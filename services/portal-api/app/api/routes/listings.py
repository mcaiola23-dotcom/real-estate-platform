"""
API endpoints for listing data (SimplyRETS format).
"""

import time
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from math import ceil
from decimal import Decimal

try:
    from shapely.geometry import shape
    from geoalchemy2.shape import to_shape
    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False

from ...db import get_db
from ...core.logging import get_logger, log_with_context
from ...models.listing import Listing
from ...models.parcel import Parcel
from ...models.agent import Agent
from ...models.office import Office

router = APIRouter(prefix="/listings", tags=["listings"])
logger = get_logger(__name__)


from ...api.listing_schemas import PublicListing, PublicListingList

@router.get("/", response_model=PublicListingList)
async def get_listings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    city: Optional[str] = Query(None, description="Filter by city"),
    neighborhood_id: Optional[int] = Query(None, description="Filter by neighborhood ID"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Pending, Sold)"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum list price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum list price"),
    min_beds: Optional[int] = Query(None, ge=0, description="Minimum bedrooms"),
    max_beds: Optional[int] = Query(None, ge=0, description="Maximum bedrooms"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    sort_by: Optional[str] = Query("list_date", description="Sort by field (list_price, list_date, bedrooms)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db)
):
    """Get paginated list of listings with optional filters."""
    
    # Build query
    query = db.query(Listing)
    
    # Apply filters
    if city:
        query = query.filter(Listing.city.ilike(f"%{city}%"))
    if city:
        query = query.filter(Listing.city.ilike(f"%{city}%"))
    
    if neighborhood_id:
        query = query.join(Listing.parcel).filter(Parcel.neighborhood_id == neighborhood_id)
    
    if status:
        query = query.filter(Listing.status == status)
    
    if min_price:
        query = query.filter(Listing.list_price >= Decimal(str(min_price)))
    
    if max_price:
        query = query.filter(Listing.list_price <= Decimal(str(max_price)))
    
    if min_beds:
        query = query.filter(Listing.bedrooms >= min_beds)
    
    if max_beds:
        query = query.filter(Listing.bedrooms <= max_beds)
    
    if property_type:
        query = query.filter(Listing.property_type == property_type)
    
    # Apply sorting
    if sort_by == "list_price":
        sort_field = Listing.list_price
    elif sort_by == "bedrooms":
        sort_field = Listing.bedrooms
    elif sort_by == "square_feet":
        sort_field = Listing.square_feet
    else:
        sort_field = Listing.list_date
    
    if sort_order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    
    # Get listings
    listings = query.offset(offset).limit(page_size).all()
    
    # Pydantic will handle the validation/filtering based on PublicListing schema
    # We return the ORM objects directly where possible, but for simplicity/safety with overrides:
    # We'll construct the list to ensure format matches PublicListing
    
    return {
        "listings": listings, # ORM objects should map via from_attributes=True
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{listing_id}")
async def get_listing(listing_id: int, db: Session = Depends(get_db)):
    """Get a specific listing by ID with full details."""
    
    listing = db.query(Listing).filter(Listing.listing_id == listing_id).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get associated parcel data
    parcel_data = None
    if listing.parcel_id:
        parcel = db.query(Parcel).filter(Parcel.parcel_id == listing.parcel_id).first()
        if parcel:
            # Extract lat/lng from parcel centroid
            parcel_lat = None
            parcel_lng = None
            if HAS_SHAPELY and parcel.centroid is not None:
                try:
                    point = to_shape(parcel.centroid)
                    parcel_lat = point.y
                    parcel_lng = point.x
                except Exception:
                    pass

            parcel_data = {
                "parcel_id": parcel.parcel_id,
                "latitude": parcel_lat,
                "longitude": parcel_lng,
                "assessment_total": float(parcel.assessment_total) if parcel.assessment_total else None,
                "assessment_land": float(parcel.assessment_land) if parcel.assessment_land else None,
                "assessment_building": float(parcel.assessment_building) if parcel.assessment_building else None,
                "appraised_total": float(parcel.appraised_total) if parcel.appraised_total else None,
                "appraised_land": float(parcel.appraised_land) if parcel.appraised_land else None,
                "appraised_building": float(parcel.appraised_building) if parcel.appraised_building else None,
                "last_sale_price": float(parcel.last_sale_price) if parcel.last_sale_price else None,
                "last_sale_date": parcel.last_sale_date.isoformat() if parcel.last_sale_date else None,
                "prior_sale_price": float(parcel.prior_sale_price) if parcel.prior_sale_price else None,
                "prior_sale_date": parcel.prior_sale_date.isoformat() if parcel.prior_sale_date else None,
                "total_rooms": parcel.total_rooms,
                "condition": parcel.condition,
                "effective_area": parcel.effective_area,
                "zoning": parcel.zoning,
                "land_use": parcel.land_use
            }
    
    # Get agent data
    agent_data = None
    if listing.listing_agent_id:
        agent = db.query(Agent).filter(Agent.agent_id == listing.listing_agent_id).first()
        if agent:
            agent_data = {
                "agent_id": agent.agent_id,
                "first_name": agent.first_name,
                "last_name": agent.last_name,
                "email": agent.email,
                "office_phone": agent.office_phone,
                "cell_phone": agent.cell_phone
            }
    
    # Get office data  
    office_data = None
    if listing.listing_office_id:
        office = db.query(Office).filter(Office.office_id == listing.listing_office_id).first()
        if office:
            office_data = {
                "office_id": office.office_id,
                "name": office.name,
                "email": office.email,
                "office_phone": office.office_phone
            }
    
    # Return plain dict - FastAPI will validate against response_model
    return {
        "listing_id": listing.listing_id,
        "listing_id_str": listing.listing_id_str,
        "mls_id": listing.mls_id,
        "address_full": listing.address_full,
        "city": listing.city,
        "state": listing.state,
        "zip_code": listing.zip_code,
        "status": listing.status,
        "list_price": float(listing.list_price) if listing.list_price else None,
        "original_list_price": float(listing.original_list_price) if listing.original_list_price else None,
        "sold_price": float(listing.sold_price) if listing.sold_price else None,
        "sold_date": listing.sold_date,
        "list_date": listing.list_date,
        "days_on_market": listing.days_on_market,
        "property_type": listing.property_type,
        "bedrooms": listing.bedrooms,
        "bathrooms": float(listing.bathrooms) if listing.bathrooms else None,
        "baths_full": listing.baths_full,
        "baths_half": listing.baths_half,
        "square_feet": listing.square_feet,
        "lot_size": listing.lot_size,
        "acres": float(listing.acres) if listing.acres else None,
        "year_built": listing.year_built,
        "stories": listing.stories,
        "garage_spaces": float(listing.garage_spaces) if listing.garage_spaces else None,
        "style": listing.style,
        "latitude": float(listing.latitude) if listing.latitude else None,
        "longitude": float(listing.longitude) if listing.longitude else None,
        "photos": listing.photos or [],
        "virtual_tour_url": listing.virtual_tour_url,
        "public_remarks": listing.public_remarks,
        "tax_annual_amount": float(listing.tax_annual_amount) if listing.tax_annual_amount else None,
        # Property details
        "interior_features": listing.interior_features,
        "exterior_features": listing.exterior_features,
        "construction": listing.construction,
        "heating": listing.heating,
        "cooling": listing.cooling,
        "flooring": listing.flooring,
        "roof": listing.roof,
        "foundation": listing.foundation,
        "pool": listing.pool,
        "view": listing.view,
        "water": listing.water,
        "fireplaces": listing.fireplaces,
        "parking_spaces": listing.parking_spaces,
        "parking_description": listing.parking_description,
        # Schools
        "school_elementary": listing.school_elementary,
        "school_middle": listing.school_middle,
        "school_high": listing.school_high,
        "school_district": listing.school_district,
        # HOA
        "hoa_fee": float(listing.hoa_fee) if listing.hoa_fee else None,
        "hoa_frequency": listing.hoa_frequency,
        "hoa_name": listing.hoa_name,
        # Location context
        "subdivision": listing.subdivision,
        "cross_street": listing.cross_street,
        # Relationships
        "agent": agent_data,
        "office": office_data,
        "parcel": parcel_data,
        "last_update_timestamp": listing.modified
    }




@router.get("/by-parcel/{parcel_id:path}", response_model=PublicListingList)
async def get_listings_by_parcel(parcel_id: str, db: Session = Depends(get_db)):
    """Get all listings for a specific parcel."""
    
    listings = db.query(Listing).filter(Listing.parcel_id == parcel_id).all()
    
    return {
        "listings": listings,
        "total": len(listings),
        "page": 1,
        "page_size": len(listings) if listings else 20,
        "total_pages": 1
    }


@router.get("/stats/summary")
async def get_listings_stats(db: Session = Depends(get_db)):
    """Get summary statistics for all listings."""
    
    from sqlalchemy import func
    
    # Overall stats
    total_listings = db.query(Listing).count()
    active_listings = db.query(Listing).filter(Listing.status == "Active").count()
    pending_listings = db.query(Listing).filter(Listing.status == "Pending").count()
    sold_listings = db.query(Listing).filter(Listing.status == "Sold").count()
    
    # Price stats for active listings
    price_stats = db.query(
        func.min(Listing.list_price).label("min_price"),
        func.max(Listing.list_price).label("max_price"),
        func.avg(Listing.list_price).label("avg_price"),
    ).filter(Listing.status == "Active").first()
    
    # Listings by city
    city_counts = db.query(
        Listing.city,
        func.count(Listing.listing_id).label("count")
    ).group_by(Listing.city).order_by(desc("count")).limit(10).all()
    
    return {
        "total_listings": total_listings,
        "active_listings": active_listings,
        "pending_listings": pending_listings,
        "sold_listings": sold_listings,
        "price_stats": {
            "min": float(price_stats.min_price) if price_stats.min_price else None,
            "max": float(price_stats.max_price) if price_stats.max_price else None,
            "avg": float(price_stats.avg_price) if price_stats.avg_price else None,
        },
        "top_cities": [{"city": city, "count": count} for city, count in city_counts],
    }

