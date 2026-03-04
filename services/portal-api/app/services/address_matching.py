"""
Address matching service for linking SimplyRETS listings to CT GIS parcels.

Matching strategies:
1. Tax ID matching (tax.id from SimplyRETS → Parcel_ID or CAMA_Link)
2. Address matching (address.full + city + zip)
3. Geospatial matching (coordinates within parcel boundaries)
"""

import logging
from typing import Optional, Dict, Any, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
import re

from ..models.parcel import Parcel
from ..models.listing import Listing
from ..models.address_match import AddressMatch

logger = logging.getLogger(__name__)

# Matching confidence thresholds
CONFIDENCE_EXACT = 1.0
CONFIDENCE_HIGH = 0.9
CONFIDENCE_MEDIUM = 0.7
CONFIDENCE_LOW = 0.5


class AddressMatchingService:
    """Service for matching SimplyRETS listings to CT GIS parcels."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def match_listing_to_parcel(
        self,
        listing: Listing,
        try_all_methods: bool = True
    ) -> Optional[Tuple[Parcel, float, str]]:
        """
        Match a listing to a parcel using multiple strategies.
        
        Args:
            listing: Listing to match
            try_all_methods: If True, try all methods; if False, stop at first match
            
        Returns:
            Tuple of (matched_parcel, confidence_score, method) or None
        """
        # Strategy 1: Tax ID matching (highest confidence)
        tax_match = self._match_by_tax_id(listing)
        if tax_match and not try_all_methods:
            return tax_match
        
        # Strategy 2: Address matching
        address_match = self._match_by_address(listing)
        if address_match and not try_all_methods:
            return address_match
        
        # Strategy 3: Geospatial matching
        geo_match = self._match_by_geospatial(listing)
        if geo_match and not try_all_methods:
            return geo_match
        
        # Return best match if we tried all methods
        if try_all_methods:
            matches = [m for m in [tax_match, address_match, geo_match] if m]
            if matches:
                # Sort by confidence (highest first)
                return max(matches, key=lambda x: x[1])
        
        return None
    
    def _match_by_tax_id(self, listing: Listing) -> Optional[Tuple[Parcel, float, str]]:
        """
        Match listing to parcel using tax ID.
        
        SimplyRETS tax.id should match CT GIS Parcel_ID or CAMA_Link.
        """
        if not listing.tax_id:
            return None
        
        tax_id = str(listing.tax_id).strip()
        
        # Try matching by parcel_id first
        parcel = self.db.query(Parcel).filter(
            Parcel.parcel_id == tax_id
        ).first()
        
        if parcel:
            logger.info(f"Tax ID exact match: {tax_id} -> {parcel.parcel_id}")
            return (parcel, CONFIDENCE_EXACT, "tax_id_exact")
        
        # Try matching by cama_link
        parcel = self.db.query(Parcel).filter(
            Parcel.cama_link == tax_id
        ).first()
        
        if parcel:
            logger.info(f"Tax ID CAMA match: {tax_id} -> {parcel.parcel_id}")
            return (parcel, CONFIDENCE_HIGH, "tax_id_cama")
        
        return None
    
    def _match_by_address(self, listing: Listing) -> Optional[Tuple[Parcel, float, str]]:
        """
        Match listing to parcel using address components.
        
        Uses normalized address matching with fuzzy comparison.
        """
        if not listing.address_full or not listing.city:
            return None
        
        # Normalize address components
        listing_number = self._normalize_number(listing.address_number)
        listing_street = self._normalize_street(listing.street_name or "")
        listing_city = self._normalize_city(listing.city)
        listing_zip = listing.zip_code
        
        # Build query
        query = self.db.query(Parcel).filter(
            Parcel.city.ilike(f"%{listing_city}%")
        )
        
        # Add zip code filter if available
        if listing_zip:
            query = query.filter(Parcel.zip_code == listing_zip)
        
        # Try to match by street name and number
        candidates = []
        if listing_street:
            # Query parcels with matching street name
            parcels = query.filter(
                Parcel.street_name.ilike(f"%{listing_street}%")
            ).all()
            
            for parcel in parcels:
                parcel_number = self._normalize_number(parcel.address_number)
                parcel_street = self._normalize_street(parcel.street_name or "")
                
                # Calculate match score
                number_match = (listing_number == parcel_number) if listing_number and parcel_number else False
                street_match_score = self._fuzzy_street_match(listing_street, parcel_street)
                
                if number_match and street_match_score > 0.8:
                    # Exact or near-exact match
                    confidence = CONFIDENCE_HIGH if street_match_score > 0.95 else CONFIDENCE_MEDIUM
                    candidates.append((parcel, confidence, street_match_score))
                elif street_match_score > 0.7:
                    # Street match but number mismatch
                    candidates.append((parcel, CONFIDENCE_LOW, street_match_score))
        
        if not candidates and listing_number:
            # Fallback: try matching just by number and city/zip
            parcels = query.filter(
                Parcel.address_number == listing_number
            ).all()
            if parcels:
                # If only one match, use it with lower confidence
                if len(parcels) == 1:
                    candidates.append((parcels[0], CONFIDENCE_LOW, 0.5))
        
        if candidates:
            # Return best match
            best_match = max(candidates, key=lambda x: x[1])
            method = f"address_match_{best_match[2]:.2f}"
            logger.info(f"Address match: {listing.address_full} -> {best_match[0].parcel_id} (confidence: {best_match[1]:.2f})")
            return (best_match[0], best_match[1], method)
        
        return None
    
    def _match_by_geospatial(self, listing: Listing) -> Optional[Tuple[Parcel, float, str]]:
        """
        Match listing to parcel using geospatial coordinates.
        
        Checks if listing coordinates fall within parcel boundaries.
        """
        if not listing.latitude or not listing.longitude:
            return None
        
        lat = float(listing.latitude)
        lng = float(listing.longitude)
        
        # Use PostGIS to find parcels containing the point
        query = text("""
            SELECT parcel_id, 
                   ST_Distance(centroid, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) as distance
            FROM parcels
            WHERE ST_Contains(geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            ORDER BY distance
            LIMIT 1
        """)
        
        result = self.db.execute(query, {"lat": lat, "lng": lng})
        row = result.fetchone()
        
        if row:
            parcel_id, distance = row
            parcel = self.db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
            
            if parcel:
                # Confidence based on distance (in meters)
                # If within boundary, high confidence
                # If close to centroid, still good confidence
                if distance < 10:  # Within 10 meters
                    confidence = CONFIDENCE_HIGH
                elif distance < 50:  # Within 50 meters
                    confidence = CONFIDENCE_MEDIUM
                else:
                    confidence = CONFIDENCE_LOW
                
                logger.info(f"Geospatial match: ({lat}, {lng}) -> {parcel.parcel_id} (distance: {distance:.2f}m)")
                return (parcel, confidence, f"geospatial_{distance:.0f}m")
        
        # Fallback: find nearest parcel within reasonable distance (e.g., 100m)
        query = text("""
            SELECT parcel_id, 
                   ST_Distance(centroid, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) as distance
            FROM parcels
            WHERE ST_DWithin(
                centroid, 
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                0.001  -- ~100 meters in degrees
            )
            ORDER BY distance
            LIMIT 1
        """)
        
        result = self.db.execute(query, {"lat": lat, "lng": lng})
        row = result.fetchone()
        
        if row:
            parcel_id, distance = row
            parcel = self.db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
            
            if parcel:
                # Lower confidence for nearby but not containing
                confidence = CONFIDENCE_LOW
                logger.info(f"Geospatial nearby match: ({lat}, {lng}) -> {parcel.parcel_id} (distance: {distance:.2f}m)")
                return (parcel, confidence, f"geospatial_nearby_{distance:.0f}m")
        
        return None
    
    def _normalize_number(self, number: Optional[str]) -> Optional[str]:
        """Normalize street number."""
        if not number:
            return None
        # Remove common suffixes and normalize
        normalized = re.sub(r'\s+', '', str(number).strip().upper())
        # Remove "APT", "UNIT", etc.
        normalized = re.sub(r'[A-Z]+$', '', normalized)
        return normalized if normalized else None
    
    def _normalize_street(self, street: str) -> str:
        """Normalize street name for matching."""
        if not street:
            return ""
        
        # Convert to uppercase
        normalized = street.upper().strip()
        
        # Remove common suffixes temporarily for matching
        # (we'll compare with and without them)
        suffixes = ['ST', 'STREET', 'AVE', 'AVENUE', 'RD', 'ROAD', 'DR', 'DRIVE', 
                   'BLVD', 'BOULEVARD', 'LN', 'LANE', 'CT', 'COURT', 'PL', 'PLACE',
                   'WAY', 'CIR', 'CIRCLE', 'PKWY', 'PARKWAY']
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
        return normalized
    
    def _normalize_city(self, city: str) -> str:
        """Normalize city name."""
        if not city:
            return ""
        return city.upper().strip()
    
    def _fuzzy_street_match(self, street1: str, street2: str) -> float:
        """
        Calculate fuzzy match score between two street names.
        
        Returns score between 0.0 and 1.0.
        """
        if not street1 or not street2:
            return 0.0
        
        # Exact match
        if street1 == street2:
            return 1.0
        
        # Normalize both
        s1 = self._normalize_street(street1)
        s2 = self._normalize_street(street2)
        
        if s1 == s2:
            return 1.0
        
        # Check if one contains the other
        if s1 in s2 or s2 in s1:
            return 0.9
        
        # Word-by-word comparison
        words1 = set(s1.split())
        words2 = set(s2.split())
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    def create_match_record(
        self,
        listing: Listing,
        parcel: Parcel,
        confidence: float,
        method: str,
        details: Optional[Dict[str, Any]] = None
    ) -> AddressMatch:
        """
        Create an address match record in the database.
        
        Args:
            listing: The matched listing
            parcel: The matched parcel
            confidence: Match confidence score (0.0-1.0)
            method: Matching method used
            details: Additional match details
            
        Returns:
            Created AddressMatch record
        """
        match = AddressMatch(
            listing_id=listing.listing_id,
            parcel_id=parcel.parcel_id,
            confidence=confidence,
            match_method=method,
            match_details=details or {}
        )
        
        self.db.add(match)
        self.db.flush()
        
        return match
    
    def update_listing_parcel_link(
        self,
        listing: Listing,
        parcel: Parcel,
        confidence: float
    ) -> None:
        """
        Update listing with parcel_id link if confidence is high enough.
        
        Args:
            listing: Listing to update
            parcel: Matched parcel
            confidence: Match confidence
        """
        # Only update if confidence is medium or higher
        if confidence >= CONFIDENCE_MEDIUM:
            listing.parcel_id = parcel.parcel_id
            logger.info(f"Linked listing {listing.listing_id_str} to parcel {parcel.parcel_id} (confidence: {confidence:.2f})")
        else:
            logger.warning(f"Match confidence too low ({confidence:.2f}) to link listing {listing.listing_id_str} to parcel {parcel.parcel_id}")
    
    def batch_match_listings(
        self,
        listings: List[Listing],
        min_confidence: float = CONFIDENCE_MEDIUM,
        create_match_records: bool = True
    ) -> Dict[str, Any]:
        """
        Batch match multiple listings to parcels.
        
        Args:
            listings: List of listings to match
            min_confidence: Minimum confidence to create link
            create_match_records: Whether to create AddressMatch records
            
        Returns:
            Statistics dictionary with match results
        """
        stats = {
            "total": len(listings),
            "matched": 0,
            "high_confidence": 0,
            "medium_confidence": 0,
            "low_confidence": 0,
            "unmatched": 0,
            "errors": 0
        }
        
        for listing in listings:
            try:
                result = self.match_listing_to_parcel(listing, try_all_methods=True)
                
                if result:
                    parcel, confidence, method = result
                    
                    # Update listing link if confidence is high enough
                    if confidence >= min_confidence:
                        self.update_listing_parcel_link(listing, parcel, confidence)
                    
                    # Create match record
                    if create_match_records:
                        self.create_match_record(
                            listing, parcel, confidence, method,
                            details={"listing_address": listing.address_full}
                        )
                    
                    # Update stats
                    stats["matched"] += 1
                    if confidence >= CONFIDENCE_HIGH:
                        stats["high_confidence"] += 1
                    elif confidence >= CONFIDENCE_MEDIUM:
                        stats["medium_confidence"] += 1
                    else:
                        stats["low_confidence"] += 1
                else:
                    stats["unmatched"] += 1
                    
            except Exception as e:
                logger.error(f"Error matching listing {listing.listing_id_str}: {e}")
                stats["errors"] += 1
        
        # Commit all changes
        try:
            self.db.commit()
        except Exception as e:
            logger.error(f"Error committing match results: {e}")
            self.db.rollback()
            raise
        
        return stats

