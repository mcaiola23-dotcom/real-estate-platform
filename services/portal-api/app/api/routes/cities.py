"""City/Town listing endpoints for search filters."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...db import get_db
from ...models.listing import Listing
from ...models.parcel import Parcel
from ..schemas import CityInfo, CityListResponse


router = APIRouter(prefix="/api/cities", tags=["cities"])


@router.get("/list", response_model=CityListResponse)
def list_cities(db: Session = Depends(get_db)):
    """
    Get list of all cities/towns with property and listing counts.
    
    Returns cities alphabetically sorted with:
    - Total property count (all parcels)
    - Active listing count (currently listed properties)
    """
    
    # Get property counts by town
    property_counts = (
        db.query(
            Parcel.town_name.label("town"),
            func.count(Parcel.parcel_id).label("property_count")
        )
        .filter(Parcel.town_name.isnot(None))
        .group_by(Parcel.town_name)
        .subquery()
    )
    
    # Get active listing counts by town
    listing_counts = (
        db.query(
            Parcel.town_name.label("town"),
            func.count(Listing.listing_id).label("listing_count")
        )
        .join(Listing, Parcel.parcel_id == Listing.parcel_id)
        .filter(
            Parcel.town_name.isnot(None),
            Listing.status.in_(["Active", "Coming Soon", "Pending"])
        )
        .group_by(Parcel.town_name)
        .subquery()
    )
    
    # Combine counts
    results = (
        db.query(
            property_counts.c.town,
            property_counts.c.property_count,
            func.coalesce(listing_counts.c.listing_count, 0).label("listing_count")
        )
        .outerjoin(listing_counts, property_counts.c.town == listing_counts.c.town)
        .order_by(property_counts.c.town)  # Alphabetical order
        .all()
    )
    
    # Build response
    cities = [
        CityInfo(
            name=row.town,
            property_count=row.property_count,
            active_listing_count=row.listing_count
        )
        for row in results
    ]
    
    
    return CityListResponse(
        cities=cities,
        total_cities=len(cities)
    )


@router.get("/{slug}", response_model=CityInfo)
def get_city_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Get city details by slug (e.g., 'fairfield', 'new-canaan').
    Returns city info with property counts.
    """
    
    # Simple un-slugify: "new-canaan" -> "New Canaan"
    # This works for most CT towns. Special handling can be added if needed.
    city_name = slug.replace('-', ' ').title()
    
    # Get property count
    property_count = (
        db.query(func.count(Parcel.parcel_id))
        .filter(func.lower(Parcel.town_name) == city_name.lower())
        .scalar()
    ) or 0
    
    # If no properties found, return 404 (invalid city slug)
    if property_count == 0:
        # Check if it's a valid city in our DB at all before 404ing?
        # For now, if no parcels, it's virtually invalid for us.
        # But let's check against list of known cities to be safe?
        # Actually, query is cheap. 0 count means we have nothing to show anyway.
        # But we probably want to support "Coming Soon" pages for cities with 0 props but valid...
        # Let's assume for MVP: no parcels = 404.
        pass

    # Get active listing count
    listing_count = (
        db.query(func.count(Listing.listing_id))
        .join(Parcel, Listing.parcel_id == Parcel.parcel_id)
        .filter(
            func.lower(Parcel.town_name) == city_name.lower(),
            Listing.status.in_(["Active", "Coming Soon", "Pending"])
        )
        .scalar()
    ) or 0
    
    # If strictly no properties, verify if it might be a casing issue or just empty
    # For now, we return 404 if property_count is 0 to avoid serving pages for "garbage-slug"
    if property_count == 0:
         from fastapi import HTTPException
         raise HTTPException(status_code=404, detail=f"City '{city_name}' not found")
         
    return CityInfo(
        name=city_name,
        property_count=property_count,
        active_listing_count=listing_count
    )

