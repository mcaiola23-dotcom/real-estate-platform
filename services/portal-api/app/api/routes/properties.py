from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from math import ceil
from datetime import datetime, timedelta
from shapely import wkb
from urllib.parse import unquote

from ...db import get_db
from ...models.property import Property
from ...models.parcel import Parcel
from ...models.school import School, SchoolDistrict, ParcelSchoolAssignment
from ...models.listing import Listing
from ..schemas import Property as PropertySchema, PropertyList
from ...services.street_view import street_view_service
from geoalchemy2.functions import ST_Distance
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("/", response_model=PropertyList)
async def get_properties(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    bedrooms: Optional[int] = Query(None, ge=0, description="Number of bedrooms"),
    db: Session = Depends(get_db)
):
    """Get paginated list of properties with optional filters."""
    
    # Build query
    query = db.query(Property).filter(Property.is_active == True)
    
    # Apply filters
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if min_price:
        query = query.filter(Property.list_price >= min_price)
    if max_price:
        query = query.filter(Property.list_price <= max_price)
    if bedrooms:
        query = query.filter(Property.bedrooms >= bedrooms)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    
    # Get properties
    properties = query.offset(offset).limit(page_size).all()
    
    return PropertyList(
        properties=properties,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{property_id}", response_model=PropertySchema)
async def get_property(property_id: int, db: Session = Depends(get_db)):
    """Get a specific property by ID."""
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_active == True
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return property


@router.get("/{parcel_id:path}/street-view")
async def get_street_view(
    parcel_id: str = Path(..., description="Parcel ID (may contain slashes)"),
    db: Session = Depends(get_db)
):
    """
    Get Google Street View image URL for a parcel.
    
    ON-DEMAND ONLY: This endpoint only checks Street View availability when called.
    Results are cached in the database to avoid repeated API calls.
    
    Cost: First request = 1 API call ($0.007), subsequent requests = FREE (cached)
    """
    if not street_view_service.is_available():
        raise HTTPException(
            status_code=503,
            detail=(
                "Street View is unavailable because Google server key is not configured "
                "(GOOGLE_MAPS_SERVER_API_KEY or legacy GOOGLE_MAPS_API_KEY), "
                "or GOOGLE_STREET_VIEW_ENABLED is false."
            )
        )

    normalized_parcel_id = unquote(parcel_id).strip()

    # Find parcel
    parcel = db.query(Parcel).filter(Parcel.parcel_id == normalized_parcel_id).first()
    if not parcel and normalized_parcel_id != parcel_id:
        parcel = db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
    
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    
    # Try to use address first (more accurate for Street View)
    address_query = None
    if parcel.address_full and parcel.city and parcel.state:
        # Use full address for better Street View positioning
        address_query = f"{parcel.address_full}, {parcel.city}, {parcel.state}"
    
    # Extract coordinates from centroid as fallback
    if not parcel.centroid:
        raise HTTPException(status_code=400, detail="Parcel has no coordinates")
    
    try:
        # Parse PostGIS geometry to get lat/lng
        point = wkb.loads(bytes(parcel.centroid.data))
        lng, lat = point.x, point.y
    except Exception as e:
        print(f"[StreetView] Error parsing centroid: {e}")
        raise HTTPException(status_code=400, detail="Invalid parcel coordinates")
    
    # Check if we've already checked this parcel before (cached result)
    if parcel.street_view_available is not None:
        # Use cached result
        available = parcel.street_view_available == 1
        print(f"[StreetView] Using cached result for {normalized_parcel_id}: {available}")
        
        if available:
            # Use pano_id if available for 100% consistency
            if parcel.street_view_pano_id:
                 return {
                    "available": True,
                    "imageUrl": street_view_service.get_image_url(lat, lng, address=address_query, pano_id=parcel.street_view_pano_id),
                    "thumbnailUrl": street_view_service.get_thumbnail_url(lat, lng, address=address_query, pano_id=parcel.street_view_pano_id),
                    "parcelId": normalized_parcel_id,
                    "location": {"lat": lat, "lng": lng},
                    "panoId": parcel.street_view_pano_id,
                    "cached": True
                }

            # Fallback to address/coordinates if no pano_id saved yet
            return {
                "available": True,
                "imageUrl": street_view_service.get_image_url(lat, lng, address=address_query),
                "thumbnailUrl": street_view_service.get_thumbnail_url(lat, lng, address=address_query),
                "parcelId": normalized_parcel_id,
                "location": {"lat": lat, "lng": lng},
                "cached": True
            }
        else:
            # Revalidate negative cache periodically so properties can recover
            # from prior transient/configuration issues after environment fixes.
            revalidate_unavailable_after = datetime.utcnow() - timedelta(minutes=15)
            if (
                parcel.street_view_checked_at is not None and
                parcel.street_view_checked_at > revalidate_unavailable_after
            ):
                return {
                    "available": False,
                    "imageUrl": None,
                    "parcelId": normalized_parcel_id,
                    "cached": True
                }
            print(f"[StreetView] Revalidating previously unavailable parcel {normalized_parcel_id}")
    
    # First time checking - make API call to Google
    print(f"[StreetView] Checking availability for {normalized_parcel_id} (API CALL)")
    metadata = street_view_service.check_availability(lat, lng, address=address_query)
    available = metadata.get("available", False)
    availability_status = metadata.get("status")
    pano_id = metadata.get("pano_id")

    # Do not cache transient or configuration/API failures as "unavailable".
    if not available and availability_status not in {"ZERO_RESULTS", "NOT_FOUND"}:
        raise HTTPException(
            status_code=503,
            detail=f"Street View metadata request failed ({availability_status or 'unknown'})."
        )
    
    # Cache the result in database
    parcel.street_view_available = 1 if available else 0
    parcel.street_view_checked_at = datetime.utcnow()
    if pano_id:
        parcel.street_view_pano_id = pano_id
        
    db.commit()
    
    if available:
        # Use heading from metadata for better camera orientation
        heading = metadata.get("heading")
        return {
            "available": True,
            "imageUrl": street_view_service.get_image_url(lat, lng, address=address_query, heading=heading, pano_id=pano_id),
            "thumbnailUrl": street_view_service.get_thumbnail_url(lat, lng, address=address_query, heading=heading, pano_id=pano_id),
            "parcelId": normalized_parcel_id,
            "location": {"lat": lat, "lng": lng},
            "heading": heading,
            "panoId": pano_id,
            "cached": False
        }
    else:
        return {
            "available": False,
            "imageUrl": None,
            "parcelId": normalized_parcel_id,
            "cached": False
        }


@router.get("/{property_id}/schools")
async def get_property_schools(
    property_id: int,
    db: Session = Depends(get_db)
):
    """
    Get assigned schools for a property (listing).
    Returns elementary, middle, and high school assignments with ratings and distances.
    """
    # Get the listing
    listing = db.query(Listing).filter(Listing.listing_id == property_id).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get the parcel_id from the listing
    parcel_id = listing.parcel_id
    
    if not parcel_id:
        # No parcel linked to this listing
        return {
            "parcel_id": None,
            "elementary_school": None,
            "middle_school": None,
            "high_school": None,
            "district": None,
            "message": "No parcel data available for this listing"
        }
    
    # Get school assignments
    assignment = db.query(ParcelSchoolAssignment).filter(
        ParcelSchoolAssignment.parcel_id == parcel_id
    ).first()
    
    if not assignment:
        # No school assignments yet - return empty but valid response
        return {
            "parcel_id": parcel_id,
            "elementary_school": None,
            "middle_school": None,
            "high_school": None,
            "district": None,
            "message": "School data coming soon"
        }
    
    # Get parcel for distance calculations
    parcel = db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
    
    # Helper function to format school data
    def format_school(school: School, parcel_location) -> dict:
        if not school:
            return None
        
        # Calculate distance if both have locations
        distance_miles = None
        if school.location and parcel_location:
            try:
                # ST_Distance returns distance in degrees, multiply by 69 for approximate miles
                distance = db.query(
                    ST_Distance(school.location, parcel_location)
                ).scalar()
                distance_miles = round(distance * 69, 2) if distance else None
            except Exception as e:
                print(f"Error calculating distance: {e}")
        
        return {
            "school_id": school.school_id,
            "name": school.name,
            "school_type": school.school_type,
            "address": school.address,
            "city": school.city,
            "state": school.state,
            "zip_code": school.zip_code,
            "rating": school.greatschools_rating,
            "enrollment": school.enrollment,
            "student_teacher_ratio": school.student_teacher_ratio,
            "grades": school.grades,
            "website": school.website,
            "phone": school.phone,
            "distance_miles": distance_miles,
            "latitude": school.latitude,
            "longitude": school.longitude
        }
    
    # Get schools
    parcel_location = parcel.centroid if parcel else None
    
    elementary = assignment.elementary_school
    middle = assignment.middle_school
    high = assignment.high_school
    district = assignment.district
    
    # Format district data
    district_data = None
    if district:
        district_data = {
            "district_id": district.district_id,
            "name": district.name,
            "county": district.county,
            "state": district.state,
            "overall_rating": district.overall_rating,
            "website": district.website,
            "phone": district.phone
        }
    
    return {
        "parcel_id": parcel_id,
        "elementary_school": format_school(elementary, parcel_location),
        "middle_school": format_school(middle, parcel_location),
        "high_school": format_school(high, parcel_location),
        "district": district_data
    }


@router.get("/{parcel_id:path}/schools-by-parcel")
async def get_parcel_schools(
    parcel_id: str = Path(..., description="Parcel ID (may contain slashes)"),
    db: Session = Depends(get_db)
):
    """
    Get assigned schools for a parcel (off-market property).
    Returns elementary, middle, and high school assignments with ratings and distances.
    """
    # Get school assignments
    assignment = db.query(ParcelSchoolAssignment).filter(
        ParcelSchoolAssignment.parcel_id == parcel_id
    ).first()
    
    if not assignment:
        # No school assignments yet - return empty but valid response
        return {
            "parcel_id": parcel_id,
            "elementary_school": None,
            "middle_school": None,
            "high_school": None,
            "district": None,
            "message": "School data coming soon"
        }
    
    # Get parcel for distance calculations
    parcel = db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
    
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    
    # Helper function to format school data
    def format_school(school: School, parcel_location) -> dict:
        if not school:
            return None
        
        # Calculate distance if both have locations
        distance_miles = None
        if school.location and parcel_location:
            try:
                # ST_Distance returns distance in degrees, multiply by 69 for approximate miles
                distance = db.query(
                    ST_Distance(school.location, parcel_location)
                ).scalar()
                distance_miles = round(distance * 69, 2) if distance else None
            except Exception as e:
                print(f"Error calculating distance: {e}")
        
        return {
            "school_id": school.school_id,
            "name": school.name,
            "school_type": school.school_type,
            "address": school.address,
            "city": school.city,
            "state": school.state,
            "zip_code": school.zip_code,
            "rating": school.greatschools_rating,
            "enrollment": school.enrollment,
            "student_teacher_ratio": school.student_teacher_ratio,
            "grades": school.grades,
            "website": school.website,
            "phone": school.phone,
            "distance_miles": distance_miles,
            "latitude": school.latitude,
            "longitude": school.longitude
        }
    
    # Get schools
    parcel_location = parcel.centroid
    
    elementary = assignment.elementary_school
    middle = assignment.middle_school
    high = assignment.high_school
    district = assignment.district
    
    # Format district data
    district_data = None
    if district:
        district_data = {
            "district_id": district.district_id,
            "name": district.name,
            "county": district.county,
            "state": district.state,
            "overall_rating": district.overall_rating,
            "website": district.website,
            "phone": district.phone
        }
    
    return {
        "parcel_id": parcel_id,
        "elementary_school": format_school(elementary, parcel_location),
        "middle_school": format_school(middle, parcel_location),
        "high_school": format_school(high, parcel_location),
        "district": district_data
    }


# Sample data for development/testing
SAMPLE_PROPERTIES = [
    {
        "mls_id": "MLS001",
        "address": "123 Main Street",
        "city": "Fairfield",
        "state": "CT",
        "zip_code": "06824",
        "bedrooms": 4,
        "bathrooms": 2.5,
        "square_feet": 2500,
        "lot_size": 0.5,
        "list_price": 750000.0,
        "property_type": "Residential",
        "status": "Active",
        "description": "Beautiful colonial home in Fairfield",
        "year_built": 1995,
        "garage_spaces": 2
    },
    {
        "mls_id": "MLS002",
        "address": "456 Oak Avenue",
        "city": "Westport",
        "state": "CT",
        "zip_code": "06880",
        "bedrooms": 3,
        "bathrooms": 2.0,
        "square_feet": 1800,
        "lot_size": 0.3,
        "list_price": 650000.0,
        "property_type": "Residential",
        "status": "Active",
        "description": "Charming ranch-style home",
        "year_built": 1985,
        "garage_spaces": 1
    },
    {
        "mls_id": "MLS003",
        "address": "789 Elm Street",
        "city": "Stamford",
        "state": "CT",
        "zip_code": "06901",
        "bedrooms": 5,
        "bathrooms": 3.0,
        "square_feet": 3200,
        "lot_size": 0.75,
        "list_price": 950000.0,
        "property_type": "Residential",
        "status": "Active",
        "description": "Luxury home with modern amenities",
        "year_built": 2010,
        "garage_spaces": 3
    }
]
