"""
Comparable properties (comps) API endpoints.
Provides sold and active comparable properties with hyper-local matching.
"""

from fastapi import APIRouter, HTTPException, Path
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from datetime import date, timedelta

from app.core.config import settings

router = APIRouter(prefix="/api/properties", tags=["comps"])


class CompProperty(BaseModel):
    """Comparable property data."""
    listing_id: Optional[int] = None
    parcel_id: Optional[str] = None
    photo_url: Optional[str] = None
    address: str
    city: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    price: float  # sale_price or list_price
    price_per_sqft: Optional[float] = None
    date: str  # sale_date or list_date
    days_on_market: Optional[int] = None
    match_score: float
    distance_miles: float
    property_type: Optional[str] = None


def calculate_match_score(
    subject_property: dict,
    comp_property: dict,
    distance_miles: float
) -> float:
    """
    Calculate match quality score (0-100) for a comp.
    
    Scoring criteria:
    - Exact bed/bath match: +50 points
    - ±1 bed/bath: +30 points
    - Sqft within 30%: +30 points
    - Same neighborhood (city): +20 points
    - Distance penalty: -5 points per 0.25 mile beyond 0.5 mile
    """
    score = 0
    
    # Bed/bath matching
    subject_beds = subject_property.get('bedrooms', 0) or 0
    subject_baths = subject_property.get('bathrooms', 0) or 0
    comp_beds = comp_property.get('bedrooms', 0) or 0
    comp_baths = comp_property.get('bathrooms', 0) or 0
    
    if subject_beds == comp_beds and subject_baths == comp_baths:
        score += 50
    elif (abs(subject_beds - comp_beds) <= 1 and abs(subject_baths - comp_baths) <= 1):
        score += 30
    
    # Square footage matching (within 30%)
    subject_sqft = subject_property.get('square_feet', 0) or 0
    comp_sqft = comp_property.get('square_feet', 0) or 0
    
    if subject_sqft > 0 and comp_sqft > 0:
        sqft_diff_pct = abs(subject_sqft - comp_sqft) / subject_sqft
        if sqft_diff_pct <= 0.30:
            score += 30
    
    # Same neighborhood (city)
    if subject_property.get('city') == comp_property.get('city'):
        score += 20
    
    # Distance penalty (closer is better)
    if distance_miles > 0.5:
        penalty = (distance_miles - 0.5) / 0.25 * 5
        score = max(0, score - penalty)
    
    return min(100, score)


def get_subject_property(conn, property_id: str):
    """Resolve subject property by listing_id or parcel_id with coord fallback."""
    listing_id_query = text("""
        SELECT 
            l.property_type, l.bedrooms, l.bathrooms, l.square_feet,
            l.city, 
            COALESCE(l.latitude, ST_Y(p.centroid)) as latitude,
            COALESCE(l.longitude, ST_X(p.centroid)) as longitude,
            l.parcel_id
        FROM listings l
        LEFT JOIN parcels p ON l.parcel_id = p.parcel_id
        WHERE l.listing_id = :listing_id
        LIMIT 1
    """)

    listing_by_parcel_query = text("""
        SELECT 
            l.property_type, l.bedrooms, l.bathrooms, l.square_feet,
            l.city, 
            COALESCE(l.latitude, ST_Y(p.centroid)) as latitude,
            COALESCE(l.longitude, ST_X(p.centroid)) as longitude,
            l.parcel_id
        FROM listings l
        LEFT JOIN parcels p ON l.parcel_id = p.parcel_id
        WHERE l.parcel_id = :parcel_id
        LIMIT 1
    """)

    parcel_only_query = text("""
        SELECT 
            property_type, bedrooms, bathrooms, square_feet,
            city, ST_Y(centroid) as latitude, ST_X(centroid) as longitude, parcel_id
        FROM parcels
        WHERE parcel_id = :parcel_id
        LIMIT 1
    """)

    subject = None
    if property_id.isdigit():
        subject = conn.execute(listing_id_query, {"listing_id": int(property_id)}).fetchone()

    if not subject:
        subject = conn.execute(listing_by_parcel_query, {"parcel_id": property_id}).fetchone()

    if not subject:
        subject = conn.execute(parcel_only_query, {"parcel_id": property_id}).fetchone()

    return subject


def get_listing_photo_url(conn, listing_id: Optional[int], cache: dict) -> Optional[str]:
    """Fetch first listing photo URL with per-request cache."""
    if not listing_id:
        return None
    if listing_id in cache:
        return cache[listing_id]
    photo_url = conn.execute(
        text("SELECT photos->>0 FROM listings WHERE listing_id = :listing_id"),
        {"listing_id": listing_id}
    ).scalar()
    cache[listing_id] = photo_url
    return photo_url


@router.get("/{property_id}/comps-sold", response_model=List[CompProperty])
async def get_sold_comps(
    property_id: str = Path(..., description="Property ID (listing_id for active, parcel_id for off-market)")
):
    """
    Get comparable sold properties (last 6 months).
    
    Matching criteria:
    - Same property_type (REQUIRED)
    - Within 3 mile radius OR same city
    - Sold in last 6 months
    - Match quality scoring
    - Returns 3-6 best matches
    """
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # First, get the subject property details
        subject = get_subject_property(conn, property_id)

        if not subject:
            return []

        subject_data = {
            'property_type': subject[0],
            'bedrooms': subject[1],
            'bathrooms': float(subject[2]) if subject[2] else None,
            'square_feet': subject[3],
            'city': subject[4],
            'latitude': float(subject[5]) if subject[5] else None,
            'longitude': float(subject[6]) if subject[6] else None,
            'parcel_id': subject[7] if len(subject) > 7 else None
        }

        # Validate we have coordinates (required for distance calculations)
        if not subject_data['latitude'] or not subject_data['longitude']:
            return []

        # Query for sold comps
        # Use PostGIS for distance calculation (3 miles = ~4.8 km)
        cutoff_date = date.today() - timedelta(days=180)  # Last 6 months

        # Exclude subject property by parcel_id (most reliable)
        subject_parcel_id = subject_data.get('parcel_id')
        has_property_type = bool(subject_data.get('property_type'))
        
        # Build dynamic query - property_type filter is optional
        comps_query = text("""
            WITH subject AS (
                SELECT 
                    ST_SetSRID(ST_MakePoint(:subject_lon, :subject_lat), 4326) as geom
            ),
            base_sales AS (
                SELECT 
                    l.listing_id,
                    l.parcel_id,
                    l.address_full as address,
                    l.city,
                    l.bedrooms,
                    l.bathrooms,
                    l.square_feet,
                    l.sold_price,
                    l.sold_date,
                    l.days_on_market,
                    l.property_type,
                    COALESCE(l.latitude, ST_Y(p.centroid)) as comp_lat,
                    COALESCE(l.longitude, ST_X(p.centroid)) as comp_lon,
                    COALESCE(l.photos->>0, NULL) as photo_url,
                    CASE WHEN l.property_type = :property_type THEN 1 ELSE 0 END as type_match
                FROM listings l
                LEFT JOIN parcels p ON l.parcel_id = p.parcel_id
                WHERE l.status = 'Sold'
                    AND l.sold_date >= :cutoff_date
                    AND l.sold_price IS NOT NULL
                    AND (
                        :subject_parcel_id IS NULL
                        OR l.parcel_id IS NULL
                        OR l.parcel_id != :subject_parcel_id
                    )
            )
            SELECT 
                listing_id,
                parcel_id,
                address,
                city,
                bedrooms,
                bathrooms,
                square_feet,
                sold_price,
                sold_date,
                days_on_market,
                property_type,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(comp_lon, comp_lat), 4326)::geography,
                    subject.geom::geography
                ) / 1609.34 as distance_miles,
                photo_url
            FROM base_sales, subject
            WHERE comp_lat IS NOT NULL
                AND comp_lon IS NOT NULL
                AND (
                    ST_DWithin(
                        ST_SetSRID(ST_MakePoint(comp_lon, comp_lat), 4326)::geography,
                        subject.geom::geography,
                        4828  -- 3 miles in meters
                    )
                    OR city = :city
                )
            ORDER BY type_match DESC, distance_miles ASC
            LIMIT 20
        """)
        
        result = conn.execute(comps_query, {
            "subject_lat": subject_data['latitude'],
            "subject_lon": subject_data['longitude'],
            "property_type": subject_data.get('property_type') or '',
            "city": subject_data['city'],
            "cutoff_date": cutoff_date,
            "subject_parcel_id": subject_parcel_id
        })
        
        comps = []
        photo_cache = {}
        for row in result:
            row_map = row._mapping
            comp_data = {
                'listing_id': row_map.get('listing_id'),
                'parcel_id': row_map.get('parcel_id'),
                'address': row_map.get('address'),
                'city': row_map.get('city'),
                'bedrooms': row_map.get('bedrooms'),
                'bathrooms': float(row_map.get('bathrooms')) if row_map.get('bathrooms') else None,
                'square_feet': row_map.get('square_feet'),
                'sold_price': float(row_map.get('sold_price')) if row_map.get('sold_price') else None,
                'sold_date': row_map.get('sold_date'),
                'days_on_market': row_map.get('days_on_market'),
                'property_type': row_map.get('property_type'),
                'distance_miles': float(row_map.get('distance_miles')),
                'photo_url': row_map.get('photo_url')
            }
            if not comp_data['photo_url']:
                comp_data['photo_url'] = get_listing_photo_url(conn, comp_data['listing_id'], photo_cache)
            
            # Calculate match score
            match_score = calculate_match_score(subject_data, comp_data, comp_data['distance_miles'])
            
            # Calculate price per sqft
            price_per_sqft = None
            if comp_data['square_feet'] and comp_data['sold_price']:
                price_per_sqft = comp_data['sold_price'] / comp_data['square_feet']
            
            comps.append(CompProperty(
                listing_id=comp_data['listing_id'],
                parcel_id=comp_data['parcel_id'],
                photo_url=comp_data['photo_url'],
                address=comp_data['address'],
                city=comp_data['city'],
                bedrooms=comp_data['bedrooms'],
                bathrooms=comp_data['bathrooms'],
                square_feet=comp_data['square_feet'],
                price=comp_data['sold_price'],
                price_per_sqft=price_per_sqft,
                date=comp_data['sold_date'].isoformat() if comp_data['sold_date'] else '',
                days_on_market=comp_data['days_on_market'],
                match_score=match_score,
                distance_miles=comp_data['distance_miles'],
                property_type=comp_data['property_type']
            ))
        
        # Sort by match score descending, then distance
        comps.sort(key=lambda x: (-x.match_score, x.distance_miles))
        
        # Return top 6 (or fewer if not available)
        return comps[:6]


@router.get("/{property_id}/comps-active", response_model=List[CompProperty])
async def get_active_comps(
    property_id: str = Path(..., description="Property ID (listing_id for active, parcel_id for off-market)")
):
    """
    Get comparable active listings.
    
    Same matching criteria as sold comps but for Active/Pending listings.
    Returns 3-6 best matches.
    """
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # Get subject property (same logic as sold comps)
        subject = get_subject_property(conn, property_id)

        if not subject:
            return []

        subject_data = {
            'property_type': subject[0],
            'bedrooms': subject[1],
            'bathrooms': float(subject[2]) if subject[2] else None,
            'square_feet': subject[3],
            'city': subject[4],
            'latitude': float(subject[5]) if subject[5] else None,
            'longitude': float(subject[6]) if subject[6] else None,
            'parcel_id': subject[7] if len(subject) > 7 else None
        }

        # Validate we have coordinates (required for distance calculations)
        if not subject_data['latitude'] or not subject_data['longitude']:
            return []
        
        # Query for active comps
        # Exclude subject property by parcel_id (most reliable)
        subject_parcel_id = subject_data.get('parcel_id')
        
        # Build dynamic query - property_type filter is optional, prioritize matches
        comps_query = text("""
            WITH subject AS (
                SELECT 
                    ST_SetSRID(ST_MakePoint(:subject_lon, :subject_lat), 4326) as geom
            ),
            base_active AS (
                SELECT 
                    l.listing_id,
                    l.parcel_id,
                    l.address_full as address,
                    l.city,
                    l.bedrooms,
                    l.bathrooms,
                    l.square_feet,
                    l.list_price,
                    l.list_date,
                    l.days_on_market,
                    l.property_type,
                    COALESCE(l.latitude, ST_Y(p.centroid)) as comp_lat,
                    COALESCE(l.longitude, ST_X(p.centroid)) as comp_lon,
                    COALESCE(l.photos->>0, NULL) as photo_url,
                    CASE WHEN l.property_type = :property_type THEN 1 ELSE 0 END as type_match
                FROM listings l
                LEFT JOIN parcels p ON l.parcel_id = p.parcel_id
                WHERE l.status IN ('Active', 'Pending')
                    AND l.list_price IS NOT NULL
                    AND (
                        :subject_parcel_id IS NULL
                        OR l.parcel_id IS NULL
                        OR l.parcel_id != :subject_parcel_id
                    )
            )
            SELECT 
                listing_id,
                parcel_id,
                address,
                city,
                bedrooms,
                bathrooms,
                square_feet,
                list_price,
                list_date,
                days_on_market,
                property_type,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(comp_lon, comp_lat), 4326)::geography,
                    subject.geom::geography
                ) / 1609.34 as distance_miles,
                photo_url
            FROM base_active, subject
            WHERE comp_lat IS NOT NULL
                AND comp_lon IS NOT NULL
                AND (
                    ST_DWithin(
                        ST_SetSRID(ST_MakePoint(comp_lon, comp_lat), 4326)::geography,
                        subject.geom::geography,
                        4828  -- 3 miles in meters
                    )
                    OR city = :city
                )
            ORDER BY type_match DESC, distance_miles ASC
            LIMIT 20
        """)
        
        result = conn.execute(comps_query, {
            "subject_lat": subject_data['latitude'],
            "subject_lon": subject_data['longitude'],
            "property_type": subject_data.get('property_type') or '',
            "city": subject_data['city'],
            "subject_parcel_id": subject_parcel_id
        })
        
        comps = []
        photo_cache = {}
        for row in result:
            row_map = row._mapping
            comp_data = {
                'listing_id': row_map.get('listing_id'),
                'parcel_id': row_map.get('parcel_id'),
                'address': row_map.get('address'),
                'city': row_map.get('city'),
                'bedrooms': row_map.get('bedrooms'),
                'bathrooms': float(row_map.get('bathrooms')) if row_map.get('bathrooms') else None,
                'square_feet': row_map.get('square_feet'),
                'list_price': float(row_map.get('list_price')) if row_map.get('list_price') else None,
                'list_date': row_map.get('list_date'),
                'days_on_market': row_map.get('days_on_market'),
                'property_type': row_map.get('property_type'),
                'distance_miles': float(row_map.get('distance_miles')),
                'photo_url': row_map.get('photo_url')
            }
            if not comp_data['photo_url']:
                comp_data['photo_url'] = get_listing_photo_url(conn, comp_data['listing_id'], photo_cache)
            
            # Calculate match score
            match_score = calculate_match_score(subject_data, comp_data, comp_data['distance_miles'])
            
            # Calculate price per sqft
            price_per_sqft = None
            if comp_data['square_feet'] and comp_data['list_price']:
                price_per_sqft = comp_data['list_price'] / comp_data['square_feet']
            
            comps.append(CompProperty(
                listing_id=comp_data['listing_id'],
                parcel_id=comp_data['parcel_id'],
                photo_url=comp_data['photo_url'],
                address=comp_data['address'],
                city=comp_data['city'],
                bedrooms=comp_data['bedrooms'],
                bathrooms=comp_data['bathrooms'],
                square_feet=comp_data['square_feet'],
                price=comp_data['list_price'],
                price_per_sqft=price_per_sqft,
                date=comp_data['list_date'].isoformat() if comp_data['list_date'] else '',
                days_on_market=comp_data['days_on_market'],
                match_score=match_score,
                distance_miles=comp_data['distance_miles'],
                property_type=comp_data['property_type']
            ))
        
        # Sort by match score descending, then distance
        comps.sort(key=lambda x: (-x.match_score, x.distance_miles))
        
        # Return top 6 (or fewer if not available)
        return comps[:6]

