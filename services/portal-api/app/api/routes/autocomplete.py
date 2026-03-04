"""Autocomplete API endpoints for search suggestions."""

from fastapi import APIRouter, Query
from sqlalchemy import text, func
from typing import List, Optional
from app.db import get_db

router = APIRouter(prefix="/autocomplete", tags=["autocomplete"])

@router.get("/search")
async def autocomplete_search(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    limit: int = Query(10, ge=1, le=20, description="Maximum number of suggestions")
):
    """
    Autocomplete search for addresses, cities, and neighborhoods.
    
    Returns ranked suggestions from:
    1. Addresses (exact + fuzzy match using trigram similarity)
    2. Cities
    3. Neighborhoods
    
    Results are prioritized by:
    - Exact matches first
    - Similarity score
    - Result type (addresses > neighborhoods > cities)
    """
    db = next(get_db())
    
    suggestions = []
    query_lower = q.lower()
    
    # 1. Address suggestions (top priority)
    # Use trigram similarity for fuzzy matching
    address_results = db.execute(text("""
        SELECT DISTINCT
            address_full,
            city,
            state,
            zip_code,
            SIMILARITY(LOWER(address_full), :query) as similarity
        FROM parcels
        WHERE 
            LOWER(address_full) LIKE :query_like
            OR SIMILARITY(LOWER(address_full), :query) > 0.3
        ORDER BY similarity DESC, address_full
        LIMIT :limit
    """), {
        "query": query_lower,
        "query_like": f"%{query_lower}%",
        "limit": max(5, limit // 2)
    })
    
    for row in address_results:
        suggestions.append({
            "type": "address",
            "label": f"{row[0]}, {row[1]}, {row[2]} {row[3] or ''}".strip(),
            "value": row[0],
            "city": row[1],
            "state": row[2],
            "zip_code": row[3],
            "confidence": min(row[4], 1.0) if row[4] else 0.5
        })
    
    # 2. Neighborhood suggestions (if query matches)
    if len(suggestions) < limit:
        neighborhood_results = db.execute(text("""
            SELECT DISTINCT
                name,
                city,
                parcel_count,
                SIMILARITY(LOWER(name), :query) as similarity
            FROM neighborhoods
            WHERE 
                LOWER(name) LIKE :query_like
                OR SIMILARITY(LOWER(name), :query) > 0.3
            ORDER BY similarity DESC, parcel_count DESC
            LIMIT :limit
        """), {
            "query": query_lower,
            "query_like": f"%{query_lower}%",
            "limit": limit - len(suggestions)
        })
        
        for row in neighborhood_results:
            suggestions.append({
                "type": "neighborhood",
                "label": f"{row[0]} ({row[1]})",
                "value": row[0],
                "city": row[1],
                "parcel_count": row[2],
                "confidence": min(row[3], 1.0) if row[3] else 0.4
            })
    
    # 3. City suggestions (lowest priority, but useful)
    if len(suggestions) < limit:
        city_results = db.execute(text("""
            SELECT DISTINCT
                city,
                COUNT(*) as property_count,
                SIMILARITY(LOWER(city), :query) as similarity
            FROM parcels
            WHERE 
                LOWER(city) LIKE :query_like
                OR SIMILARITY(LOWER(city), :query) > 0.3
            GROUP BY city
            ORDER BY similarity DESC, property_count DESC
            LIMIT :limit
        """), {
            "query": query_lower,
            "query_like": f"%{query_lower}%",
            "limit": limit - len(suggestions)
        })
        
        for row in city_results:
            suggestions.append({
                "type": "city",
                "label": f"{row[0]}, CT",
                "value": row[0],
                "property_count": row[1],
                "confidence": min(row[2], 1.0) if row[2] else 0.3
            })
    
    # Sort by confidence (highest first) and limit
    suggestions.sort(key=lambda x: x["confidence"], reverse=True)
    
    return {
        "query": q,
        "suggestions": suggestions[:limit],
        "total_count": len(suggestions[:limit])
    }

@router.get("/addresses")
async def autocomplete_addresses(
    q: str = Query(..., min_length=3, description="Address query"),
    city: Optional[str] = Query(None, description="Filter by city"),
    limit: int = Query(10, ge=1, le=20)
):
    """
    Address-specific autocomplete with optional city filter.
    More focused than general search.
    """
    db = next(get_db())
    
    query_lower = q.lower()
    
    sql_query = """
        SELECT DISTINCT
            address_full,
            city,
            state,
            zip_code,
            property_type,
            SIMILARITY(LOWER(address_full), :query) as similarity
        FROM parcels
        WHERE 
            (LOWER(address_full) LIKE :query_like
            OR SIMILARITY(LOWER(address_full), :query) > 0.4)
    """
    
    params = {
        "query": query_lower,
        "query_like": f"{query_lower}%",  # Starts with for addresses
        "limit": limit
    }
    
    if city:
        sql_query += " AND LOWER(city) = :city"
        params["city"] = city.lower()
    
    sql_query += " ORDER BY similarity DESC, address_full LIMIT :limit"
    
    results = db.execute(text(sql_query), params)
    
    addresses = []
    for row in results:
        addresses.append({
            "address": row[0],
            "city": row[1],
            "state": row[2],
            "zip_code": row[3],
            "property_type": row[4],
            "label": f"{row[0]}, {row[1]}, {row[2]} {row[3] or ''}".strip(),
            "confidence": min(row[5], 1.0) if row[5] else 0.5
        })
    
    return {
        "query": q,
        "city_filter": city,
        "addresses": addresses,
        "total_count": len(addresses)
    }


@router.get("/lookup")
async def lookup_address(
    address: str = Query(..., min_length=3, description="Full address to look up (e.g., '53 London Lane')"),
    city: Optional[str] = Query(None, description="Optional city filter for better matching"),
    limit: int = Query(5, ge=1, le=10)
):
    """
    Look up a parcel by address string. Returns parcel_id and listing_id for the best match.
    Uses fuzzy matching to find the closest address in the database.
    
    This is used when selecting a Google Places suggestion to find the corresponding parcel.
    """
    db = next(get_db())
    
    # Normalize the address - extract just the street address part (before the first comma)
    address_parts = address.split(',')
    street_address = address_parts[0].strip().lower()
    
    # Try to extract city from the address if not provided
    search_city = city
    if not search_city and len(address_parts) > 1:
        # Google format: "53 London Lane, Stamford, CT, USA"
        potential_city = address_parts[1].strip()
        if potential_city and len(potential_city) > 1:
            search_city = potential_city
    
    # Build query with optional city filter
    sql_query = """
        SELECT 
            p.parcel_id,
            p.address_full,
            p.city,
            p.state,
            p.zip_code,
            l.listing_id,
            l.status,
            SIMILARITY(LOWER(p.address_full), :query) as similarity
        FROM parcels p
        LEFT JOIN listings l ON p.parcel_id = l.parcel_id AND l.status IN ('Active', 'Pending', 'Coming Soon')
        WHERE 
            (LOWER(p.address_full) LIKE :query_like
            OR SIMILARITY(LOWER(p.address_full), :query) > 0.5)
    """
    
    params = {
        "query": street_address,
        "query_like": f"%{street_address}%",
        "limit": limit
    }
    
    if search_city:
        sql_query += " AND LOWER(p.city) = :city"
        params["city"] = search_city.lower()
    
    sql_query += " ORDER BY similarity DESC, p.address_full LIMIT :limit"
    
    results = db.execute(text(sql_query), params).fetchall()
    
    if not results:
        return {
            "found": False,
            "query": address,
            "city_filter": search_city,
            "results": []
        }
    
    matches = []
    for row in results:
        matches.append({
            "parcel_id": row[0],
            "address_full": row[1],
            "city": row[2],
            "state": row[3],
            "zip_code": row[4],
            "listing_id": row[5],
            "status": row[6],
            "similarity": float(row[7]) if row[7] else 0
        })
    
    return {
        "found": True,
        "query": address,
        "city_filter": search_city,
        "results": matches,
        "best_match": matches[0] if matches else None
    }
