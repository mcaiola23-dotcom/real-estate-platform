"""Neighborhoods API endpoints."""

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from typing import List, Optional
from app.db import get_db

router = APIRouter(prefix="/neighborhoods", tags=["neighborhoods"])

@router.get("/list")
async def list_neighborhoods(
    cities: Optional[str] = Query(None, description="Comma-separated list of cities to filter by")
):
    """
    Get list of all neighborhoods, optionally filtered by city.
    Returns neighborhoods with parcel counts for dropdown population.
    """
    db = next(get_db())
    
    query = """
        SELECT 
            id,
            name,
            city,
            center_lat,
            center_lng,
            parcel_count
        FROM neighborhoods
        WHERE parcel_count > 0
    """
    
    params = {}
    
    if cities:
        city_list = [c.strip() for c in cities.split(',')]
        placeholders = ','.join([f':city{i}' for i in range(len(city_list))])
        query += f" AND city IN ({placeholders})"
        params = {f'city{i}': city for i, city in enumerate(city_list)}
    
    query += " ORDER BY city, name"
    
    result = db.execute(text(query), params)
    
    neighborhoods = []
    for row in result:
        neighborhoods.append({
            "id": row[0],
            "name": row[1],
            "city": row[2],
            "center_lat": row[3],
            "center_lng": row[4],
            "parcel_count": row[5]
        })
    
    return {
        "neighborhoods": neighborhoods,
        "total_count": len(neighborhoods)
    }

@router.get("/boundaries")
async def get_neighborhood_boundaries(
    city: Optional[str] = Query(None, description="Filter by city")
):
    """
    Get neighborhood boundaries as GeoJSON for map rendering.
    Optionally filter by city.
    """
    print(f"[MAP] Neighborhood boundaries requested for city: {city}")
    db = next(get_db())
    
    try:
        if city:
            query = text("""
                WITH neighborhood_stats AS (
                    SELECT 
                        p.neighborhood_id as id,
                        COUNT(CASE WHEN l.status = 'Active' THEN 1 END) as active_count,
                        COUNT(CASE WHEN l.status = 'Pending' THEN 1 END) as pending_count,
                        COUNT(CASE WHEN l.status = 'Sold' THEN 1 END) as sold_count
                    FROM parcels p
                    JOIN listings l ON l.parcel_id = p.parcel_id
                    WHERE p.neighborhood_id IS NOT NULL AND LOWER(p.city) = LOWER(:city)
                    GROUP BY p.neighborhood_id
                )
                SELECT jsonb_build_object(
                    'type', 'FeatureCollection',
                    'features', jsonb_agg(feature)
                )
                FROM (
                    SELECT jsonb_build_object(
                        'type', 'Feature',
                        'id', n.id,
                        'properties', jsonb_build_object(
                            'id', n.id,
                            'name', n.name,
                            'city', n.city,
                            'parcel_count', n.parcel_count,
                            'active_count', COALESCE(s.active_count, 0),
                            'pending_count', COALESCE(s.pending_count, 0),
                            'sold_count', COALESCE(s.sold_count, 0)
                        ),
                        'geometry', ST_AsGeoJSON(c.boundary)::jsonb
                    ) AS feature
                    FROM neighborhoods n
                    LEFT JOIN neighborhood_boundary_cache c ON n.id = c.neighborhood_id
                    LEFT JOIN neighborhood_stats s ON n.id = s.id
                    WHERE LOWER(n.city) = LOWER(:city) 
                    AND c.boundary IS NOT NULL
                    AND LOWER(n.name) != LOWER(n.city) -- Exclude town-level records
                ) features
            """)
            result = db.execute(query, {"city": city}).fetchone()
        else:
            query = text("""
                WITH neighborhood_stats AS (
                    SELECT 
                        p.neighborhood_id as id,
                        COUNT(CASE WHEN l.status = 'Active' THEN 1 END) as active_count,
                        COUNT(CASE WHEN l.status = 'Pending' THEN 1 END) as pending_count,
                        COUNT(CASE WHEN l.status = 'Sold' AND l.sold_date >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as sold_count
                    FROM parcels p
                    JOIN listings l ON l.parcel_id = p.parcel_id
                    WHERE p.neighborhood_id IS NOT NULL
                    GROUP BY p.neighborhood_id
                )
                SELECT jsonb_build_object(
                    'type', 'FeatureCollection',
                    'features', jsonb_agg(feature)
                )
                FROM (
                    SELECT jsonb_build_object(
                        'type', 'Feature',
                        'id', n.id,
                        'properties', jsonb_build_object(
                            'id', n.id,
                            'name', n.name,
                            'city', n.city,
                            'parcel_count', n.parcel_count,
                            'active_count', COALESCE(s.active_count, 0),
                            'pending_count', COALESCE(s.pending_count, 0),
                            'sold_count', COALESCE(s.sold_count, 0)
                        ),
                        'geometry', ST_AsGeoJSON(c.boundary)::jsonb
                    ) AS feature
                    FROM neighborhoods n
                    LEFT JOIN neighborhood_boundary_cache c ON n.id = c.neighborhood_id
                    LEFT JOIN neighborhood_stats s ON n.id = s.id
                    WHERE c.boundary IS NOT NULL
                    AND LOWER(n.name) != LOWER(n.city) -- Exclude town-level records
                ) features
            """)
            result = db.execute(query).fetchone()
        
        if result and result[0]:
            return result[0]
        else:
            return {
                "type": "FeatureCollection",
                "features": []
            }
    
    except Exception as e:
        import traceback
        print(f"[ERROR] Error fetching neighborhood boundaries: {e}")
        print(traceback.format_exc())
        return {
            "type": "FeatureCollection",
            "features": []
        }

@router.get("/{neighborhood_id}")
async def get_neighborhood(neighborhood_id: int):
    """Get details for a specific neighborhood."""
    db = next(get_db())
    
    result = db.execute(text("""
        SELECT 
            id,
            name,
            city,
            state,
            center_lat,
            center_lng,
            parcel_count,
            ST_AsGeoJSON(boundary) as boundary_geojson
        FROM neighborhoods
        WHERE id = :neighborhood_id
    """), {"neighborhood_id": neighborhood_id})
    
    row = result.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
    
    
    if not row:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
    
    return {
        "id": row[0],
        "name": row[1],
        "city": row[2],
        "state": row[3],
        "center_lat": row[4],
        "center_lng": row[5],
        "parcel_count": row[6],
        "boundary": row[7]  # GeoJSON string
    }


@router.get("/by-slug/{slug}")
async def get_neighborhood_by_slug(slug: str):
    """
    Get neighborhood details by slug (e.g., 'greenfield-hill').
    Returns neighborhood info with stats.
    """
    db = next(get_db())
    
    # Simple un-slugify
    name = slug.replace('-', ' ').title()
    
    # We need to find the neighborhood by name
    # We also need listing counts
    query = text("""
        WITH neighborhood_stats AS (
            SELECT 
                p.neighborhood_id,
                COUNT(CASE WHEN l.status = 'Active' THEN 1 END) as active_count,
                AVG(l.list_price) as avg_price
            FROM parcels p
            JOIN listings l ON l.parcel_id = p.parcel_id
            WHERE p.neighborhood_id IS NOT NULL
            GROUP BY p.neighborhood_id
        )
        SELECT 
            n.id,
            n.name,
            n.city,
            n.parcel_count,
            COALESCE(s.active_count, 0) as active_listing_count,
            COALESCE(s.avg_price, 0) as avg_price
        FROM neighborhoods n
        LEFT JOIN neighborhood_stats s ON n.id = s.neighborhood_id
        WHERE LOWER(n.name) = LOWER(:name)
        LIMIT 1
    """)
    
    result = db.execute(query, {"name": name}).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
        
    return {
        "neighborhood_id": result[0],
        "name": result[1],
        "town_name": result[2], # Map city -> town_name for schema compatibility
        "active_listing_count": result[4],
        "property_count": result[3],
        "avg_price": float(result[5]) if result[5] else None
    }

