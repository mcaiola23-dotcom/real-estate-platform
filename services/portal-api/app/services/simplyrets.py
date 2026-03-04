"""
SimplyRETS API integration service for SmartMLS data.
Based on https://simplyrets.com/ documentation.
"""

import httpx
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)

# Fairfield County bounds for coordinate validation
FAIRFIELD_COUNTY_BOUNDS = {
    'min_lat': 41.0,
    'max_lat': 41.4,
    'min_lng': -73.7,
    'max_lng': -73.1
}

class SimplyRETSService:
    """Service for integrating with SimplyRETS API for MLS data."""
    
    def __init__(self):
        self.base_url = settings.simplyrets_base_url
        self.username = settings.simplyrets_username
        self.password = settings.simplyrets_password
        self.timeout = settings.simplyrets_timeout
        self.max_retries = settings.simplyrets_max_retries
        self.retry_delay = settings.simplyrets_retry_delay
        
    async def _make_request(
        self, 
        endpoint: str, 
        params: Dict[str, Any] = None,
        retry_count: int = 0
    ) -> Dict[str, Any]:
        """
        Make authenticated request to SimplyRETS API with retry logic.
        
        Args:
            endpoint: API endpoint
            params: Query parameters
            retry_count: Current retry attempt
            
        Returns:
            JSON response data
        """
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    url,
                    auth=(self.username, self.password),
                    params=params or {}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                # Don't retry on client errors (4xx)
                if e.response.status_code < 500:
                    logger.error(f"SimplyRETS API client error: {e.response.status_code} - {e.response.text}")
                    raise
                # Retry on server errors (5xx)
                if retry_count < self.max_retries:
                    wait_time = self.retry_delay * (2 ** retry_count)  # Exponential backoff
                    logger.warning(f"SimplyRETS API server error, retrying in {wait_time}s (attempt {retry_count + 1}/{self.max_retries})")
                    await asyncio.sleep(wait_time)
                    return await self._make_request(endpoint, params, retry_count + 1)
                logger.error(f"SimplyRETS API error after {self.max_retries} retries: {e}")
                raise
            except httpx.TimeoutException as e:
                if retry_count < self.max_retries:
                    wait_time = self.retry_delay * (2 ** retry_count)
                    logger.warning(f"SimplyRETS API timeout, retrying in {wait_time}s")
                    await asyncio.sleep(wait_time)
                    return await self._make_request(endpoint, params, retry_count + 1)
                logger.error(f"SimplyRETS API timeout after {self.max_retries} retries")
                raise
            except Exception as e:
                logger.error(f"Unexpected error in SimplyRETS request: {e}")
                raise
    
    async def get_properties(
        self,
        limit: int = 20,
        offset: int = 0,
        city: Optional[str] = None,
        state: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        property_type: Optional[str] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Fetch properties from SimplyRETS API with filters.
        
        Args:
            limit: Number of properties to return (max 50)
            offset: Number of properties to skip
            city: Filter by city
            state: Filter by state (e.g., 'CT')
            min_price: Minimum list price
            max_price: Maximum list price
            property_type: Type of property (Residential, Condo, etc.)
            bedrooms: Minimum number of bedrooms
            bathrooms: Minimum number of bathrooms
            
        Returns:
            Dictionary containing properties and metadata
        """
        params = {
            "limit": min(limit, 50),  # SimplyRETS max limit
            "offset": offset
        }
        
        # Add filters
        if city:
            params["city"] = city
        if state:
            params["state"] = state
        if min_price:
            params["minprice"] = min_price
        if max_price:
            params["maxprice"] = max_price
        if property_type:
            params["type"] = property_type
        if bedrooms:
            params["minbeds"] = bedrooms
        if bathrooms:
            params["minbaths"] = bathrooms
            
        try:
            data = await self._make_request("/properties", params)
            
            # Transform SimplyRETS data to our format
            properties = []
            for prop in data:
                transformed_prop = self._transform_property(prop)
                if transformed_prop:
                    properties.append(transformed_prop)
            
            return {
                "properties": properties,
                "total": len(properties),
                "limit": params["limit"],
                "offset": params["offset"]
            }
            
        except Exception as e:
            logger.error(f"Error fetching properties from SimplyRETS: {e}")
            return {
                "properties": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "error": str(e)
            }
    
    def _transform_property(self, prop: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform SimplyRETS property data to our Listing model format.
        
        This transformation maps all SimplyRETS fields to our database schema.
        """
        try:
            # Extract basic identifiers
            mls_id = prop.get("mlsId")
            # Try multiple possible field names for listing ID
            listing_id_str = prop.get("listingId") or prop.get("listing_id") or prop.get("id") or str(mls_id) if mls_id else ""
            
            if not listing_id_str:
                logger.warning("Property missing listingId/mlsId, skipping")
                return None
            
            # Extract address
            address = prop.get("address", {})
            
            # Extract coordinates and validate
            geo = prop.get("geo", {})
            latitude = geo.get("lat")
            longitude = geo.get("lng")
            
            # Validate coordinates are within Fairfield County
            if latitude and longitude:
                if not self._validate_coordinates(float(latitude), float(longitude)):
                    logger.warning(f"Coordinates outside Fairfield County for listing {listing_id_str}: ({latitude}, {longitude})")
                    # Don't reject, but log warning
            
            # Extract property details
            property_details = prop.get("property", {})
            
            # Extract MLS info
            mls_info = prop.get("mls", {})
            
            # Extract sales info
            sales = prop.get("sales", {})
            
            # Extract agent/office
            agent = prop.get("agent", {})
            office = prop.get("office", {})
            co_agent = prop.get("coAgent", {})
            
            # Extract school info
            school = prop.get("school", {})
            
            # Extract tax info
            tax = prop.get("tax", {})
            
            # Extract association info
            association = prop.get("association", {})
            
            # Extract parking (nested in property)
            parking = property_details.get("parking", {})
            
            # Parse dates
            list_date = self._parse_date(prop.get("listDate"))
            sold_date = self._parse_date(sales.get("closeDate"))
            contract_date = self._parse_date(sales.get("contractDate"))
            modified = self._parse_datetime(prop.get("modified"))
            original_entry = self._parse_datetime(mls_info.get("originalEntryTimestamp"))
            
            # Calculate total bathrooms
            baths_full = property_details.get("bathsFull")
            baths_half = property_details.get("bathsHalf")
            baths_three_quarter = property_details.get("bathsThreeQuarter")
            total_bathrooms = self._calculate_total_bathrooms(
                baths_full, baths_half, baths_three_quarter
            )
            
            # Transform to database format
            transformed = {
                # Identifiers
                "mls_id": int(mls_id) if mls_id else None,
                "listing_id_str": str(listing_id_str),
                
                # Status
                "status": mls_info.get("status", "active").lower(),
                "status_text": mls_info.get("statusText"),
                
                # Pricing
                "list_price": self._safe_decimal(prop.get("listPrice")),
                "original_list_price": self._safe_decimal(prop.get("originalListPrice")),
                "sold_price": self._safe_decimal(sales.get("closePrice")),
                "sold_date": sold_date,
                "contract_date": contract_date,
                "list_date": list_date or datetime.now().date(),
                "days_on_market": self._safe_int(mls_info.get("daysOnMarket")),
                
                # MLS info
                "mls_area": mls_info.get("area"),
                "mls_area_minor": mls_info.get("areaMinor"),
                
                # Address
                "address_full": address.get("full", ""),
                "address_number": address.get("streetNumberText"),
                "street_name": address.get("streetName"),
                "unit": address.get("unit"),
                "city": address.get("city", ""),
                "state": (address.get("state", "") or "CT")[:2].upper(),  # Ensure 2-char state code
                "zip_code": address.get("postalCode"),
                "cross_street": address.get("crossStreet"),
                
                # Coordinates
                "latitude": float(latitude) if latitude else None,
                "longitude": float(longitude) if longitude else None,
                "county": geo.get("county"),
                "market_area": geo.get("marketArea"),
                "directions": geo.get("directions"),
                
                # Property details
                "property_type": property_details.get("type"),
                "property_subtype": property_details.get("subType"),
                "property_subtype_text": property_details.get("subTypeText"),
                "bedrooms": self._safe_int(property_details.get("bedrooms")),
                "bathrooms": total_bathrooms,
                "baths_full": self._safe_int(baths_full),
                "baths_half": self._safe_int(baths_half),
                "baths_three_quarter": self._safe_int(baths_three_quarter),
                "square_feet": self._safe_int(property_details.get("area")),
                "area_source": property_details.get("areaSource"),
                "lot_size": property_details.get("lotSize"),
                "lot_size_area": self._safe_decimal(property_details.get("lotSizeArea")),
                "lot_size_area_units": property_details.get("lotSizeAreaUnits"),
                "acres": self._safe_decimal(property_details.get("acres")),
                "year_built": self._safe_int(property_details.get("yearBuilt")),
                "stories": self._safe_int(property_details.get("stories")),
                "garage_spaces": self._safe_decimal(property_details.get("garageSpaces")),
                "parking_spaces": self._safe_int(parking.get("spaces")),
                "parking_description": parking.get("description"),
                "style": property_details.get("style"),
                "subdivision": property_details.get("subdivision"),
                "view": property_details.get("view"),
                "construction": property_details.get("construction"),
                "roof": property_details.get("roof"),
                "foundation": property_details.get("foundation"),
                "heating": property_details.get("heating"),
                "cooling": property_details.get("cooling"),
                "water": property_details.get("water"),
                "fireplaces": self._safe_int(property_details.get("fireplaces")),
                "flooring": property_details.get("flooring"),
                "pool": property_details.get("pool"),
                "accessibility": property_details.get("accessibility"),
                "interior_features": property_details.get("interiorFeatures"),
                "exterior_features": property_details.get("exteriorFeatures"),
                "additional_rooms": property_details.get("additionalRooms"),
                "laundry_features": property_details.get("laundryFeatures"),
                "lot_description": property_details.get("lotDescription"),
                "maintenance_expense": self._safe_decimal(property_details.get("maintenanceExpense")),
                
                # Media
                "photos": prop.get("photos", []),
                "virtual_tour_url": prop.get("virtualTourUrl"),
                
                # Content
                "public_remarks": prop.get("remarks"),
                "private_remarks": prop.get("privateRemarks"),
                "showing_instructions": prop.get("showingInstructions"),
                "showing_contact_name": prop.get("showingContactName"),
                "showing_contact_phone": prop.get("showingContactPhone"),
                
                # Terms
                "terms": prop.get("terms"),
                "agreement": prop.get("agreement"),
                "lease_type": prop.get("leaseType"),
                "lease_term": prop.get("leaseTerm"),
                "special_conditions": prop.get("specialListingConditions"),
                "disclaimer": prop.get("disclaimer"),
                
                # Tax (for matching)
                "tax_id": tax.get("id"),
                "tax_year": self._safe_int(tax.get("taxYear")),
                "tax_annual_amount": self._safe_decimal(tax.get("taxAnnualAmount")),
                
                # Agent/Office
                "listing_agent_id": agent.get("id"),
                "listing_office_id": office.get("brokerid"),
                "co_agent_id": co_agent.get("id") if co_agent else None,
                
                # Schools
                "school_elementary": school.get("elementarySchool"),
                "school_middle": school.get("middleSchool"),
                "school_high": school.get("highSchool"),
                "school_district": school.get("district"),
                
                # HOA
                "hoa_name": association.get("name"),
                "hoa_fee": self._safe_decimal(association.get("fee")),
                "hoa_frequency": association.get("frequency"),
                "hoa_amenities": association.get("amenities"),
                
                # Display flags
                "internet_address_display": prop.get("internetAddressDisplay"),
                "internet_entire_listing_display": prop.get("internetEntireListingDisplay"),
                "ownership": prop.get("ownership"),
                
                # System
                "originating_system": mls_info.get("originatingSystemName"),
                "original_entry_timestamp": original_entry,
                "modified": modified or datetime.now(),
                
                # Agent/Office data (will be stored in separate tables)
                "_agent_data": agent,
                "_office_data": office,
                "_co_agent_data": co_agent,
                "_sales_agent_data": sales.get("agent"),
                "_sales_office_data": sales.get("office"),
            }
            
            return transformed
            
        except Exception as e:
            logger.error(f"Error transforming property data: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def _validate_coordinates(self, lat: float, lng: float) -> bool:
        """Validate coordinates are within Fairfield County bounds."""
        return (
            FAIRFIELD_COUNTY_BOUNDS['min_lat'] <= lat <= FAIRFIELD_COUNTY_BOUNDS['max_lat'] and
            FAIRFIELD_COUNTY_BOUNDS['min_lng'] <= lng <= FAIRFIELD_COUNTY_BOUNDS['max_lng']
        )
    
    def _safe_int(self, value: Any) -> Optional[int]:
        """Safely convert value to integer."""
        if value is None or value == '':
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    
    def _safe_decimal(self, value: Any) -> Optional[float]:
        """Safely convert value to decimal/float."""
        if value is None or value == '':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def _parse_date(self, value: Any) -> Optional[date]:
        """Parse date string to date object."""
        if not value:
            return None
        try:
            if isinstance(value, str):
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ']:
                    try:
                        dt = datetime.strptime(value.split('T')[0], fmt.split('T')[0])
                        return dt.date()
                    except ValueError:
                        continue
            return None
        except Exception:
            return None
    
    def _parse_datetime(self, value: Any) -> Optional[datetime]:
        """Parse datetime string to datetime object."""
        if not value:
            return None
        try:
            if isinstance(value, str):
                # Try common datetime formats
                for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%S.%f']:
                    try:
                        return datetime.strptime(value.replace('Z', ''), fmt.replace('Z', ''))
                    except ValueError:
                        continue
            return None
        except Exception:
            return None
    
    def _calculate_total_bathrooms(
        self,
        baths_full: Optional[int],
        baths_half: Optional[int],
        baths_three_quarter: Optional[int]
    ) -> Optional[float]:
        """Calculate total bathrooms from components."""
        if baths_full is None and baths_half is None and baths_three_quarter is None:
            return None
        total = (baths_full or 0) + (baths_half or 0) * 0.5 + (baths_three_quarter or 0) * 0.75
        return total if total > 0 else None
    
    async def get_property_by_mls_id(self, mls_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific property by MLS ID."""
        try:
            data = await self._make_request(f"/properties/{mls_id}")
            return self._transform_property(data)
        except Exception as e:
            logger.error(f"Error fetching property {mls_id}: {e}")
            return None
    
    async def health_check(self) -> Dict[str, Any]:
        """Check SimplyRETS API health."""
        try:
            # Try to fetch a small number of properties
            data = await self.get_properties(limit=1)
            return {
                "status": "healthy",
                "message": "SimplyRETS API is accessible",
                "properties_available": data.get("total", 0) > 0
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"SimplyRETS API error: {str(e)}",
                "properties_available": False
            }

# Global service instance
simplyrets_service = SimplyRETSService()
