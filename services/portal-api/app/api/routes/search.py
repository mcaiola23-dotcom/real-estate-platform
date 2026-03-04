"""Property search endpoints with map highlight integration."""

from __future__ import annotations

import hashlib
import json
import time
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import and_, or_, case, func, select
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.logging import get_logger, log_with_context
from ...core.cache import cache_response, generate_cache_key
from ...db import get_db
from ...models.listing import Listing
from ...models.parcel import Parcel
from ..schemas import (
    MapCallToAction,
    MapHighlightBlock,
    MapViewState,
    PropertySearchFilters,
    PropertySearchRequest,
    PropertySearchResponse,
    PropertySearchResult,
    PropertySearchSummary,
)


router = APIRouter(prefix="/api/search", tags=["search"])
logger = get_logger(__name__)


ACTIVE_LISTING_STATUSES = ["Active", "Coming Soon", "Pending", "Option Contract"]


def _generate_filter_hash(payload: Dict[str, object]) -> str:
    try:
        serialized = json.dumps(payload, sort_keys=True, default=str)
    except TypeError:
        serialized = json.dumps(str(payload), sort_keys=True)
    return hashlib.sha1(serialized.encode("utf-8")).hexdigest()[:12]


def _compute_bbox(points: List[Tuple[float, float]]) -> Optional[List[float]]:
    if not points:
        return None
    min_lon = min(p[0] for p in points)
    max_lon = max(p[0] for p in points)
    min_lat = min(p[1] for p in points)
    max_lat = max(p[1] for p in points)
    return [min_lon, min_lat, max_lon, max_lat]


def _compute_view(points: List[Tuple[float, float]]) -> Optional[MapViewState]:
    bbox = _compute_bbox(points)
    if not bbox:
        return None
    center_lon = (bbox[0] + bbox[2]) / 2
    center_lat = (bbox[1] + bbox[3]) / 2
    bounds = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]]
    # Rough zoom heuristic based on span
    lon_span = max(bbox[2] - bbox[0], 0.01)
    lat_span = max(bbox[3] - bbox[1], 0.01)
    approx_zoom = max(6, min(16, 12 - max(lon_span, lat_span) * 10))
    return MapViewState(center=[center_lon, center_lat], zoom=approx_zoom, bounds=bounds)


@router.post("/properties", response_model=PropertySearchResponse)
def search_properties(
    payload: PropertySearchRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    from ...core.cache import redis_client
    
    start_time = time.time()
    page = max(payload.page, 1)
    page_size = min(max(payload.page_size, 1), settings.max_page_size)

    filters_data = payload.filters
    if isinstance(filters_data, dict):
        filters_model = PropertySearchFilters(**filters_data)
    elif filters_data is None:
        filters_model = PropertySearchFilters()
    else:
        filters_model = filters_data

    include = payload.include or ["list", "map"]
    
    # Generate cache key from request payload
    cache_payload = {
        "query": payload.query,
        "page": page,
        "page_size": page_size,
        "filters": filters_model.dict(exclude_none=True) if hasattr(filters_model, 'dict') else {},
        "sort": payload.sort.dict() if payload.sort else None,
    }
    cache_key = generate_cache_key("search", cache_payload)
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        try:
            cached_data = json.loads(cached)
            response.headers["X-Cache-Hit"] = "1"
            response.headers["X-Cache-Key"] = cache_key
            logger.debug(f"Cache HIT: {cache_key}")
            return cached_data
        except json.JSONDecodeError:
            pass  # Fall through to execute query
    
    response.headers["X-Cache-Hit"] = "0"

    latest_listing_subquery = (
        db.query(
            Listing.parcel_id.label("parcel_id"),
            func.max(Listing.list_date).label("list_date"),
        )
        .group_by(Listing.parcel_id)
        .subquery()
    )

    base_query = (
        db.query(
            Parcel.parcel_id,
            Parcel.address_full,
            Parcel.city,
            Parcel.state,
            Parcel.zip_code,
            Parcel.property_type,
            Parcel.town_name,
            func.ST_AsGeoJSON(Parcel.centroid).label("centroid_geojson"),
            Listing.listing_id,
            Listing.listing_id_str,
            Listing.status,
            Listing.list_price,
            Listing.bedrooms,
            Listing.bathrooms,
            Listing.square_feet,
            Listing.photos,
            Listing.modified,
        )
        .outerjoin(latest_listing_subquery, Parcel.parcel_id == latest_listing_subquery.c.parcel_id)
        .outerjoin(
            Listing,
            and_(
                Listing.parcel_id == latest_listing_subquery.c.parcel_id,
                Listing.list_date == latest_listing_subquery.c.list_date,
            ),
        )
    )

    # Note: We LEFT JOIN listings, so parcels without listings (off-market) are included
    # Don't filter out null listing_ids if searching for off-market properties

    # Log the incoming request (removed - was causing Windows encoding issues)
    
    # Text query
    if payload.query:
        pattern = f"%{payload.query.lower()}%"
        base_query = base_query.filter(func.lower(Parcel.address_full).like(pattern) | func.lower(Parcel.city).like(pattern))

    # Status filter with configurable sold_years
    if filters_model.status:
        status_filters = []
        
        # Handle "Off-Market" status (parcels without listings)
        if "Off-Market" in filters_model.status:
            status_filters.append(Listing.listing_id.is_(None))
        
        # Handle "Sold" status with time window
        if "Sold" in filters_model.status:
            from datetime import datetime, timedelta
            # Calculate cutoff date based on sold_years (default 2.0 years)
            sold_years = filters_model.sold_years if filters_model.sold_years else 2.0
            days_back = int(sold_years * 365)
            cutoff_date = datetime.now().date() - timedelta(days=days_back)
            
            # Filter for sold properties within timeframe
            status_filters.append(
                and_(
                    Listing.status == "Sold",
                    Listing.sold_date >= cutoff_date
                )
            )
        
        # Handle other listing statuses (Active, Pending, etc.)
        other_statuses = [s for s in filters_model.status if s not in ["Off-Market", "Sold"]]
        if other_statuses:
            status_filters.append(Listing.status.in_(other_statuses))
        
        # Apply combined status filter with OR logic
        if status_filters:
            if len(status_filters) == 1:
                base_query = base_query.filter(status_filters[0])
            else:
                base_query = base_query.filter(or_(*status_filters))
    else:
        # Default: show only active listings
        base_query = base_query.filter(Listing.status.in_(ACTIVE_LISTING_STATUSES))

    # Price filters (support both legacy and new format)
    if filters_model.price_min is not None:
        base_query = base_query.filter(Listing.list_price >= filters_model.price_min)
    elif filters_model.price and filters_model.price.min is not None:
        base_query = base_query.filter(Listing.list_price >= filters_model.price.min)
    
    if filters_model.price_max is not None:
        base_query = base_query.filter(Listing.list_price <= filters_model.price_max)
    elif filters_model.price and filters_model.price.max is not None:
        base_query = base_query.filter(Listing.list_price <= filters_model.price.max)

    # Property type filters
    if filters_model.property_types:
        base_query = base_query.filter(Parcel.property_type.in_(filters_model.property_types))

    # Bedrooms filter (range)
    if filters_model.bedrooms:
        if filters_model.bedrooms.min is not None:
            base_query = base_query.filter(Listing.bedrooms >= filters_model.bedrooms.min)
        if filters_model.bedrooms.max is not None:
            base_query = base_query.filter(Listing.bedrooms <= filters_model.bedrooms.max)
    
    # Bathrooms filter (range, supports decimals)
    if filters_model.bathrooms:
        if filters_model.bathrooms.min is not None:
            base_query = base_query.filter(Listing.bathrooms >= filters_model.bathrooms.min)
        if filters_model.bathrooms.max is not None:
            base_query = base_query.filter(Listing.bathrooms <= filters_model.bathrooms.max)
    
    # Square footage filter (range)
    if filters_model.square_feet:
        if filters_model.square_feet.min is not None:
            base_query = base_query.filter(Listing.square_feet >= filters_model.square_feet.min)
        if filters_model.square_feet.max is not None:
            base_query = base_query.filter(Listing.square_feet <= filters_model.square_feet.max)
    
    # Lot size filter (range, in acres)
    if filters_model.lot_size_acres:
        if filters_model.lot_size_acres.min is not None:
            base_query = base_query.filter(Parcel.lot_size_acres >= filters_model.lot_size_acres.min)
        if filters_model.lot_size_acres.max is not None:
            base_query = base_query.filter(Parcel.lot_size_acres <= filters_model.lot_size_acres.max)
    
    # Year built filter (range)
    if filters_model.year_built:
        if filters_model.year_built.min is not None:
            base_query = base_query.filter(Listing.year_built >= filters_model.year_built.min)
        if filters_model.year_built.max is not None:
            base_query = base_query.filter(Listing.year_built <= filters_model.year_built.max)

    # Towns filter (multi-select)
    if filters_model.towns:
        base_query = base_query.filter(Parcel.town_name.in_(filters_model.towns))
    
    # Neighborhoods filter (multi-select) - filter by neighborhood names
    if filters_model.neighborhoods:
        # Filter by neighborhood names (use IN clause with list)
        from sqlalchemy import text as sql_text
        # Get neighborhood IDs from names
        placeholders = ','.join([f':name{i}' for i in range(len(filters_model.neighborhoods))])
        params = {f'name{i}': name for i, name in enumerate(filters_model.neighborhoods)}
        neighborhood_ids = db.execute(
            sql_text(f"SELECT id FROM neighborhoods WHERE name IN ({placeholders})"),
            params
        ).fetchall()
        print(f"[DEBUG] Neighborhood filter - Input: {filters_model.neighborhoods}")
        print(f"[DEBUG] Found IDs: {[row[0] for row in neighborhood_ids]}")
        if neighborhood_ids:
            neighborhood_id_list = [row[0] for row in neighborhood_ids]
            base_query = base_query.filter(Parcel.neighborhood_id.in_(neighborhood_id_list))
            print(f"[DEBUG] Applied filter for neighborhood IDs: {neighborhood_id_list}")

    # Filter by specific neighborhood ID (from map click)
    if filters_model.neighborhood_id:
        base_query = base_query.filter(Parcel.neighborhood_id == filters_model.neighborhood_id)

    # Bounding box filter (centroid-based)
    if filters_model.bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(coord) for coord in filters_model.bbox.split(",")]
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="bbox filter must be four comma-separated numbers")
        bbox_geom = func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
        base_query = base_query.filter(func.ST_Intersects(Parcel.centroid, bbox_geom))

    # Sorting will be applied later; keep a reference to the filtered query before ordering
    filtered_query = base_query

    # Sorting
    if payload.sort:
        field = payload.sort.field
        direction = payload.sort.direction
        if field == "list_price":
            order_column = Listing.list_price
        elif field == "modified":
            order_column = Listing.modified
        else:
            order_column = Listing.list_price
        order_clause = order_column.asc() if direction == "asc" else order_column.desc()
    else:
        order_clause = Listing.modified.desc().nullslast()

    # Count distinct parcels without ORDER BY to avoid DISTINCT ON mismatch
    total_results = (
        filtered_query.with_entities(Parcel.parcel_id)
        .distinct()
        .count()
    )

    offset = (page - 1) * page_size

    results_query = filtered_query.order_by(order_clause).offset(offset).limit(page_size)
    rows = results_query.all()

    results: List[PropertySearchResult] = []
    highlight_ids: List[str] = []
    centroid_points: List[Tuple[float, float]] = []

    for row in rows:
        centroid = None
        if row.centroid_geojson:
            try:
                centroid_geo = json.loads(row.centroid_geojson)
                coords = centroid_geo.get("coordinates") if isinstance(centroid_geo, dict) else None
                if coords and len(coords) == 2:
                    centroid = [coords[0], coords[1]]
                    centroid_points.append((coords[0], coords[1]))
            except json.JSONDecodeError:
                centroid = None

        result = PropertySearchResult(
            parcel_id=row.parcel_id,
            listing_id=row.listing_id,
            listing_id_str=row.listing_id_str,
            address=row.address_full or "",
            city=row.city or row.town_name or "",
            state=row.state or "CT",
            zip_code=row.zip_code,
            status=row.status,
            list_price=float(row.list_price) if row.list_price else None,
            bedrooms=row.bedrooms,
            bathrooms=float(row.bathrooms) if row.bathrooms else None,
            square_feet=row.square_feet,
            property_type=row.property_type,
            thumbnail_url=(row.photos[0] if row.photos else None),
            highlight_state="primary",
            centroid=centroid,
        )
        results.append(result)
        highlight_ids.append(row.parcel_id)

    filter_payload = {
        "query": payload.query,
        "filters": filters_model.dict(exclude_none=True),
        "sort": payload.sort.dict() if payload.sort else None,
    }
    filter_hash = _generate_filter_hash(filter_payload)

    bbox = _compute_bbox(centroid_points)
    view_state = _compute_view(centroid_points)

    call_to_action: Optional[MapCallToAction] = None
    if "map" in include and highlight_ids:
        params = {
            "bbox": filters_model.bbox if filters_model.bbox else (
                ",".join(str(val) for val in bbox) if bbox else "-74.05,40.9,-73.0,41.5"
            ),
            "zoom": str(int(view_state.zoom) if view_state else 12),
            "limit": "2000",
            "highlight_ids": ",".join(highlight_ids),
            "attributes": "core",
        }
        call_to_action = MapCallToAction(endpoint="/api/map/parcels", params=params)

    map_block = MapHighlightBlock(
        highlight_ids=highlight_ids,
        selected_id=None,
        bbox=bbox,
        view=view_state,
        call_to_action=call_to_action,
        clusters=[],
    )

    summary = PropertySearchSummary(
        total_results=total_results,
        page=page,
        page_size=page_size,
        filter_hash=filter_hash,
    )

    # Log search completion with metrics
    duration_ms = (time.time() - start_time) * 1000
    log_with_context(
        logger, 20,  # INFO level
        "search_properties completed",
        duration_ms=f"{duration_ms:.2f}",
        total_results=total_results,
        page=page,
        result_count=len(results),
        filter_hash=filter_hash
    )

    result = PropertySearchResponse(summary=summary, results=results, map=map_block)
    
    # Cache the result
    try:
        result_dict = result.dict() if hasattr(result, 'dict') else result.model_dump()
        redis_client.set(cache_key, json.dumps(result_dict, default=str), settings.cache_ttl_search)
        logger.debug(f"Cache SET: {cache_key}, TTL={settings.cache_ttl_search}s")
    except Exception as e:
        logger.warning(f"Failed to cache search result: {e}")
    
    return result


