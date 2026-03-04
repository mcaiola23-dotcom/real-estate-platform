"""Map endpoints for parcel GeoJSON data and parcel detail aggregation."""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Dict, List, Optional, Sequence, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import MetaData, Table, and_, case, func, select
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape

from ...core.cache import redis_client, generate_cache_key
from ...core.config import settings
from ...core.logging import get_logger
from ...db import get_db
from ...models.listing import Listing
from ...models.parcel import Parcel
from ...models.neighborhoods import Neighborhood
from ...models.overlay_layer import OverlayLayer


router = APIRouter(prefix="/api/map", tags=["map"])
logger = get_logger(__name__)


ACTIVE_LISTING_STATUSES = {"Active", "Coming Soon", "Pending", "Option Contract"}


def _parse_bbox(bbox: str) -> Tuple[float, float, float, float]:
    try:
        min_lon, min_lat, max_lon, max_lat = [float(coord) for coord in bbox.split(",")]
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="bbox must contain four comma-separated numbers")

    if min_lon >= max_lon or min_lat >= max_lat:
        raise HTTPException(status_code=400, detail="bbox coordinates are invalid (min must be less than max)")

    return min_lon, min_lat, max_lon, max_lat


def _decimal_to_float(value: Optional[Decimal]) -> Optional[float]:
    if value is None:
        return None
    return float(value)


def _serialize_listing(listing: Listing) -> Dict[str, Optional[object]]:
    if listing is None:
        return {}

    agent = listing.listing_agent
    office = listing.listing_office

    return {
        "listing_id": listing.listing_id,
        "listing_id_str": listing.listing_id_str,
        "status": listing.status,
        "status_text": listing.status_text,
        "list_price": _decimal_to_float(listing.list_price),
        "original_list_price": _decimal_to_float(listing.original_list_price),
        "sold_price": _decimal_to_float(listing.sold_price),
        "sold_date": listing.sold_date.isoformat() if listing.sold_date else None,
        "list_date": listing.list_date.isoformat() if listing.list_date else None,
        "contract_date": listing.contract_date.isoformat() if listing.contract_date else None,
        "days_on_market": listing.days_on_market,
        "bedrooms": listing.bedrooms,
        "bathrooms": _decimal_to_float(listing.bathrooms),
        "square_feet": listing.square_feet,
        "property_type": listing.property_type,
        "subdivision": listing.subdivision,
        "agent": {
            "id": agent.agent_id if agent else None,
            "first_name": agent.first_name if agent else None,
            "last_name": agent.last_name if agent else None,
            "office_phone": agent.office_phone if agent else None,
            "cell_phone": agent.cell_phone if agent else None,
            "email": agent.email if agent else None,
        },
        "office": {
            "id": office.office_id if office else None,
            "name": office.name if office else None,
            "serving_name": office.serving_name if office else None,
            "office_phone": office.office_phone if office else None,
        },
        "attribution": f"Listing courtesy of {office.name} (MLS #{listing.listing_id_str})" if office else None,
        "photos": listing.photos or [],
        "virtual_tour_url": listing.virtual_tour_url,
    }


def _load_overlay_table(table_name: str, db: Session) -> Optional[Table]:
    if not table_name:
        return None
    metadata = MetaData()
    try:
        table = Table(table_name, metadata, autoload_with=db.bind)
    except Exception:
        return None
    return table


def _get_geometry_column(table: Table) -> Optional[str]:
    for column in table.columns:
        if hasattr(column.type, "geometry_type"):
            return column.name
    return None


def _bbox_envelope(bbox: str) -> Tuple[float, float, float, float, object]:
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox)
    envelope = func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    return min_lon, min_lat, max_lon, max_lat, envelope


def _filter_overlay_by_role(layer: OverlayLayer, role: Optional[str]) -> bool:
    if not role:
        return True
    if not layer.availability:
        return True
    roles = layer.availability.get("roles") if isinstance(layer.availability, dict) else None
    if not roles:
        return True
    return role in roles


@router.get("/overlays")
def list_overlay_layers(
    types: Optional[List[str]] = Query(None, description="Filter by overlay types (e.g. zoning, schools, analytics)"),
    role: Optional[str] = Query(None, description="Optional role override for availability filtering"),
    include_styles: bool = Query(True),
    include_stats: bool = Query(False),
    bbox: Optional[str] = Query(None, description="Optional bounding box filter"),
    db: Session = Depends(get_db),
):
    overlays: List[OverlayLayer] = db.query(OverlayLayer).order_by(OverlayLayer.name.asc()).all()

    layers_response: List[Dict[str, object]] = []

    for layer in overlays:
        if types and layer.type not in types:
            continue
        if not _filter_overlay_by_role(layer, role):
            continue

        layer_data = {
            "id": layer.layer_id,
            "name": layer.name,
            "description": layer.description,
            "type": layer.type,
            "geometry_type": layer.geometry_type,
            "source": layer.source,
            "attribution": layer.attribution,
            "availability": layer.availability,
            "update_cadence": layer.update_cadence,
            "updated_at": layer.updated_at.isoformat() if layer.updated_at else None,
        }

        if include_styles:
            layer_data["style"] = layer.style

        if include_stats and layer.data_table:
            try:
                table = _load_overlay_table(layer.data_table, db)
                if table is not None:
                    total_stmt = select(func.count()).select_from(table)
                    total = db.execute(total_stmt).scalar()
                else:
                    total = None
            except Exception:
                total = None
            layer_data["feature_count"] = total

        layers_response.append(layer_data)

    response = {"layers": layers_response}

    if bbox:
        response["bbox"] = bbox

    return response


@router.get("/overlays/{layer_id}")
def get_overlay_layer(
    layer_id: str,
    bbox: str = Query(..., description="Bounding box as minLon,minLat,maxLon,maxLat"),
    zoom: int = Query(12, ge=0, le=22),
    limit: int = Query(2000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    attributes: Optional[List[str]] = Query(None, description="Attribute bundles to include (e.g. core, regulatory, analytics)"),
    format: str = Query("geojson", regex="^(geojson|mvt)$"),
    db: Session = Depends(get_db),
):
    layer: Optional[OverlayLayer] = db.query(OverlayLayer).filter(OverlayLayer.layer_id == layer_id).first()

    if not layer:
        raise HTTPException(status_code=404, detail="Overlay layer not found")

    if format == "mvt":
        raise HTTPException(status_code=400, detail="format='mvt' is not yet supported")

    _, _, _, _, envelope = _bbox_envelope(bbox)

    response: Dict[str, object] = {
        "layer_id": layer.layer_id,
        "bbox": bbox,
        "zoom": zoom,
        "metadata": {
            "name": layer.name,
            "description": layer.description,
            "type": layer.type,
            "geometry_type": layer.geometry_type,
            "source": layer.source,
            "attribution": layer.attribution,
            "style": layer.style,
            "update_cadence": layer.update_cadence,
            "updated_at": layer.updated_at.isoformat() if layer.updated_at else None,
        },
        "features": [],
    }

    if not layer.data_table:
        return response

    try:
        overlay_table = _load_overlay_table(layer.data_table, db)
    except Exception:
        overlay_table = None

    if overlay_table is None:
        return response

    geometry_column_name = _get_geometry_column(overlay_table)

    if geometry_column_name is None:
        return response

    geometry_column = overlay_table.c[geometry_column_name]

    columns_to_fetch = [col for col in overlay_table.columns if col.name != geometry_column_name]
    geojson_column = func.ST_AsGeoJSON(geometry_column).label("geom_geojson")

    stmt = (
        select(*columns_to_fetch, geojson_column)
        .where(func.ST_Intersects(geometry_column, envelope))
        .offset(offset)
        .limit(limit)
    )

    rows = db.execute(stmt).all()

    features: List[Dict[str, object]] = []
    for row in rows:
        row_dict = dict(row._mapping)
        geometry_json = row_dict.pop("geom_geojson", None)
        try:
            geometry = json.loads(geometry_json) if geometry_json else None
        except json.JSONDecodeError:
            geometry = None

        properties = {
            key: value
            for key, value in row_dict.items()
            if key != geometry_column_name
        }

        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": properties,
        })

    response["features"] = features
    response["count"] = len(features)

    # Inject stats for schools layer
    if layer_id == "schools":
        try:
            # Aggregate stats by city
            stats_query = db.query(
                Listing.city,
                Listing.status,
                func.count(Listing.listing_id)
            ).group_by(Listing.city, Listing.status).all()

            city_stats = {}
            for city, status, count in stats_query:
                if not city: continue
                city_key = city.upper().strip()
                if city_key not in city_stats:
                    city_stats[city_key] = {"active": 0, "pending": 0, "sold": 0}
                
                if status == "Active":
                    city_stats[city_key]["active"] += count
                elif status == "Pending":
                    city_stats[city_key]["pending"] += count
                elif status == "Sold":
                    city_stats[city_key]["sold"] += count

            # Update features
            for feature in features:
                props = feature["properties"]
                # Try common town name fields - debug output confirmed 'name' is the column
                town_raw = props.get("TOWN") or props.get("NAME") or props.get("town") or props.get("name")
                
                if town_raw:
                    # Clean the town name: "Ansonia School District" -> "ANSONIA"
                    town_clean = str(town_raw).upper().replace(" SCHOOL DISTRICT", "").strip()
                    props["town_name"] = town_clean  # Inject cleaned name for frontend filtering
                    
                    stats = city_stats.get(town_clean, {"active": 0, "pending": 0, "sold": 0})
                    props["active_count"] = stats["active"]
                    props["pending_count"] = stats["pending"]
                    props["sold_count"] = stats["sold"]

        except Exception as e:
            logger.error(f"Failed to inject school stats: {e}")

    return response

@router.get("/parcels")
def get_parcels(
    response: Response,
    bbox: str = Query(..., description="Bounding box as minLon,minLat,maxLon,maxLat"),
    zoom: float = Query(14, ge=0, le=22, description="Current map zoom level"),
    limit: int = Query(1000, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    property_type: Optional[List[str]] = Query(None, description="Filter by property types"),
    zoning: Optional[List[str]] = Query(None, description="Filter by zoning codes"),
    status: Optional[str] = Query(None, description="Listing status filter: 'any', 'listed', 'unlisted', or comma-separated statuses"),
    highlight_ids: Optional[str] = Query(None, description="Comma-separated parcel IDs to force include"),
    attributes: Optional[List[str]] = Query(None, description="Attribute bundles to include (currently unused)"),
    db: Session = Depends(get_db),
):
    """Return parcel polygons and metadata for the requested viewport."""
    
    # Generate cache key (exclude highlight_ids for better cache reuse)
    cache_payload = {
        "bbox": bbox,
        "zoom": zoom,
        "limit": limit,
        "offset": offset,
        "property_type": property_type,
        "zoning": zoning,
        "status": status,
    }
    cache_key = generate_cache_key("map", cache_payload)
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        try:
            cached_data = json.loads(cached)
            response.headers["X-Cache-Hit"] = "1"
            response.headers["X-Cache-Key"] = cache_key
            return cached_data
        except json.JSONDecodeError:
            pass
    
    response.headers["X-Cache-Hit"] = "0"

    min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox)
    bbox_geom = func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)

    highlight_set: List[str] = []
    if highlight_ids:
        highlight_set = [pid.strip() for pid in highlight_ids.split(",") if pid.strip()]

    base_query = (
        db.query(Parcel.parcel_id)
        .filter(func.ST_Intersects(Parcel.geometry, bbox_geom))
    )

    if property_type:
        base_query = base_query.filter(Parcel.property_type.in_(property_type))

    if zoning:
        base_query = base_query.filter(Parcel.zoning.in_(zoning))

    if status and status != "any":
        if status == "listed":
            active_subquery = (
                db.query(Listing.parcel_id)
                .filter(Listing.status.in_(ACTIVE_LISTING_STATUSES))
                .subquery()
            )
            base_query = base_query.filter(Parcel.parcel_id.in_(select(active_subquery.c.parcel_id)))
        elif status == "unlisted":
            active_subquery = (
                db.query(Listing.parcel_id)
                .filter(Listing.status.in_(ACTIVE_LISTING_STATUSES))
                .subquery()
            )
            base_query = base_query.filter(~Parcel.parcel_id.in_(select(active_subquery.c.parcel_id)))
        else:
            # Handle comma-separated specific statuses (e.g., "Active,Pending,Contingent")
            status_list = [s.strip() for s in status.split(",")]
            status_subquery = (
                db.query(Listing.parcel_id)
                .filter(Listing.status.in_(status_list))
                .subquery()
            )
            base_query = base_query.filter(Parcel.parcel_id.in_(select(status_subquery.c.parcel_id)))

    total = base_query.distinct().count()

    parcel_ids = [row.parcel_id for row in base_query.distinct().offset(offset).limit(limit).all()]

    for pid in highlight_set:
        if pid not in parcel_ids:
            parcel_ids.append(pid)

    if not parcel_ids:
        return {
            "type": "FeatureCollection",
            "count": total,
            "limit": limit,
            "offset": offset,
            "features": [],
        }

    latest_listing_subquery = (
        db.query(
            Listing.parcel_id.label("parcel_id"),
            func.max(Listing.list_date).label("list_date")
        )
        .group_by(Listing.parcel_id)
        .subquery()
    )

    parcel_rows: Sequence = (
        db.query(
            Parcel.parcel_id,
            Parcel.address_full,
            Parcel.city,
            Parcel.state,
            Parcel.zip_code,
            Parcel.property_type,
            Parcel.lot_size_acres,
            Parcel.updated_at,
            Parcel.geometry,
            Parcel.centroid,
            Listing.listing_id,
            Listing.list_price,
            Listing.status.label("listing_status"),
            Listing.list_date,
            func.ST_AsGeoJSON(Parcel.geometry).label("geom_geojson"),
            func.ST_AsGeoJSON(Parcel.centroid).label("centroid_geojson"),
        )
        .outerjoin(latest_listing_subquery, Parcel.parcel_id == latest_listing_subquery.c.parcel_id)
        .outerjoin(
            Listing,
            and_(
                Listing.parcel_id == latest_listing_subquery.c.parcel_id,
                Listing.list_date == latest_listing_subquery.c.list_date,
            ),
        )
        .filter(Parcel.parcel_id.in_(parcel_ids))
        .order_by(case({pid: idx for idx, pid in enumerate(parcel_ids)}, value=Parcel.parcel_id))
        .all()
    )

    features: List[Dict[str, object]] = []

    for row in parcel_rows:
        geometry = json.loads(row.geom_geojson) if row.geom_geojson else None
        centroid_coords = None
        if row.centroid_geojson:
            centroid_json = json.loads(row.centroid_geojson)
            centroid_coords = centroid_json.get("coordinates")

        properties = {
            "parcel_id": row.parcel_id,
            "address_full": row.address_full,
            "city": row.city,
            "state": row.state,
            "zip_code": row.zip_code,
            "property_type": row.property_type,
            "lot_size_acres": _decimal_to_float(row.lot_size_acres),
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            "list_price": _decimal_to_float(row.list_price),
            "status": row.listing_status,
            "listing_id": row.listing_id,
            "centroid": centroid_coords,
            "highlight": row.parcel_id in highlight_set,
        }

        features.append({
            "type": "Feature",
            "id": row.parcel_id,
            "geometry": geometry,
            "properties": properties,
        })

    result = {
        "type": "FeatureCollection",
        "count": total,
        "limit": limit,
        "offset": offset,
        "features": features,
    }
    
    # Cache the result
    try:
        redis_client.set(cache_key, json.dumps(result, default=str), settings.cache_ttl_map)
    except Exception as e:
        logger.warning(f"Failed to cache map result: {e}")
    
    return result


@router.get("/parcels/{parcel_id:path}")
def get_parcel_detail(parcel_id: str, response: Response, db: Session = Depends(get_db)):
    """Return aggregated parcel detail combining CT GIS data, listings, and media."""
    
    # Generate cache key for parcel detail
    cache_key = f"detail:{parcel_id}"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        try:
            cached_data = json.loads(cached)
            response.headers["X-Cache-Hit"] = "1"
            response.headers["X-Cache-Key"] = cache_key
            return cached_data
        except json.JSONDecodeError:
            pass
    
    response.headers["X-Cache-Hit"] = "0"

    parcel: Optional[Parcel] = (
        db.query(Parcel)
        .filter(Parcel.parcel_id == parcel_id)
        .first()
    )

    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    listings: List[Listing] = (
        db.query(Listing)
        .filter(Listing.parcel_id == parcel_id)
        .order_by(Listing.list_date.desc().nullslast(), Listing.modified.desc())
        .all()
    )

    current_listing: Optional[Listing] = None
    for listing in listings:
        if listing.status in ACTIVE_LISTING_STATUSES:
            current_listing = listing
            break
    if current_listing is None and listings:
        current_listing = listings[0]

    history = []
    for listing in listings:
        history.append({
            "listing_id": listing.listing_id,
            "listing_id_str": listing.listing_id_str,
            "status": listing.status,
            "list_price": _decimal_to_float(listing.list_price),
            "sold_price": _decimal_to_float(listing.sold_price),
            "sold_date": listing.sold_date.isoformat() if listing.sold_date else None,
            "list_date": listing.list_date.isoformat() if listing.list_date else None,
            "days_on_market": listing.days_on_market,
        })

    parcel_geom = to_shape(parcel.geometry) if parcel.geometry else None
    centroid_geom = to_shape(parcel.centroid) if parcel.centroid else None

    # Resolve neighborhood name from neighborhood_id
    neighborhood_name: Optional[str] = None
    if parcel.neighborhood_id:
        neighborhood = db.query(Neighborhood).filter(Neighborhood.id == parcel.neighborhood_id).first()
        if neighborhood:
            neighborhood_name = neighborhood.name
    # Fall back to listing subdivision if no neighborhood from parcel
    if not neighborhood_name and current_listing and current_listing.subdivision:
        neighborhood_name = current_listing.subdivision

    parcel_data = {
        "parcel_id": parcel.parcel_id,
        "address": {
            "full": parcel.address_full,
            "street_number": parcel.address_number,
            "street_name": parcel.street_name,
            "city": parcel.city,
            "state": parcel.state,
            "zip": parcel.zip_code,
        },
        "location": {
            "centroid": [centroid_geom.x, centroid_geom.y] if centroid_geom else None,
            "geometry": parcel_geom.__geo_interface__ if parcel_geom else None,
            "lot_size_acres": _decimal_to_float(parcel.lot_size_acres),
            "zoning": parcel.zoning,
            "land_use": parcel.land_use_description or parcel.land_use,
        },
        "neighborhood_name": neighborhood_name,
        "parcel": {
            "property_type": parcel.property_type,
            "property_subtype": parcel.property_subtype,
            "year_built": parcel.year_built,
            "square_feet": parcel.square_feet,
            "bedrooms": parcel.bedrooms,
            "bathrooms": _decimal_to_float(parcel.bathrooms),
            "baths_full": parcel.baths_full,
            "baths_half": parcel.baths_half,
            "units": parcel.units,
            "total_rooms": parcel.total_rooms,
            "condition": parcel.condition,
            "effective_area": parcel.effective_area,
            "assessment": {
                "year": parcel.tax_year,
                "total": _decimal_to_float(parcel.assessment_total),
                "land": _decimal_to_float(parcel.assessment_land),
                "building": _decimal_to_float(parcel.assessment_building),
            },
            "appraisal": {
                "total": _decimal_to_float(parcel.appraised_total),
                "land": _decimal_to_float(parcel.appraised_land),
                "building": _decimal_to_float(parcel.appraised_building),
            },
            "sales_history": [
                {
                    "price": _decimal_to_float(parcel.last_sale_price),
                    "date": parcel.last_sale_date.isoformat() if parcel.last_sale_date else None,
                },
                {
                    "price": _decimal_to_float(parcel.prior_sale_price),
                    "date": parcel.prior_sale_date.isoformat() if parcel.prior_sale_date else None,
                },
            ],
        },
        "current_listing": _serialize_listing(current_listing) if current_listing else None,
        "history": {
            "listings": history,
        },
        "analytics": {
            "assessment_value": _decimal_to_float(parcel.assessment_total),
            "avm_estimate": None,
            "confidence": None,
        },
        "media": {
            "photos": current_listing.photos if current_listing and current_listing.photos else [],
            "virtual_tour_url": current_listing.virtual_tour_url if current_listing else None,
            "street_view": None,
            "fallback_image": None,
        },
        "overlays": {
            "zoning": parcel.zoning,
            "flood_zone": None,
            "school_district": parcel.town_name,
        },
        "annotations": {
            "personal": [],
            "team": [],
            "public": [],
        },
    }
    
    # Cache the result
    try:
        redis_client.set(cache_key, json.dumps(parcel_data, default=str), settings.cache_ttl_detail)
    except Exception as e:
        logger.warning(f"Failed to cache parcel detail: {e}")

    return parcel_data


