## Map Overlay Service Design (Task M3)

**Date:** 2025-11-07  
**Owner:** Executor  
**Scope:** Defines overlay layer inventory, API contracts, and performance strategy for delivering contextual map layers (zoning, neighborhoods, schools, flood risk, analytics) in the SmartMLS AI Platform.

---

### 1. Objectives

- Provide a consistent service layer for dynamic visual overlays that complement parcel data within the map experience.
- Support both GeoJSON summaries (for legends, metadata) and Mapbox Vector Tiles (MVT) for performant rendering.
- Allow flexible filtering by layer type, region, and zoom level while keeping payloads optimized for interactive map usage.
- Enable future additions (investment heatmaps, social annotations, agent territory boundaries) without reworking API surfaces.

---

### 2. Overlay Dataset Inventory

| Layer ID | Description | Geometry | Source | Update Cadence | Notes |
| --- | --- | --- | --- | --- | --- |
| `zoning` | Municipal zoning districts | Polygon | CT GIS zoning shapefiles (town-level) | Annual / as published | Requires normalization of zoning codes across towns. |
| `neighborhoods` | Neighborhood / village boundaries | Polygon | CT GIS neighborhoods, municipal planning PDFs digitized | Annual | Provide human-friendly names + marketing descriptions. |
| `school_districts` | School district catchments | Polygon | CT Department of Education boundary datasets | Annual (school year) | Include district, elementary/middle/high zone references. |
| `school_zones` | Individual school attendance zones | Polygon | CT DOE or local BOE maps | Annual | Optional detail layer; may have overlaps. |
| `flood_zones` | FEMA flood risk zones (A, AE, VE, X, etc.) | Polygon | FEMA NFHL | Quarterly / after FEMA updates | Data large; needs tiling/simplification. |
| `wetlands` | Protected wetland areas | Polygon | CT DEEP Wetlands Inventory | Annual | For environmental risk overlays. |
| `census_blocks` | Demographic segments | Polygon | US Census TIGER/ACS | Annual (ACS release) | Use for demographic/lifestyle heatmaps. |
| `school_points` | School locations with ratings | Point | GreatSchools or CT DOE | Quarterly | Join with ratings; include icon suggestions. |
| `transit_routes` | Rail/bus routes | LineString | CT DOT GTFS feeds | Monthly | Convert GTFS to GeoJSON vectors; optional layer. |
| `transit_stops` | Public transit stops | Point | CT DOT GTFS | Monthly | Provide mode (rail/bus) metadata. |
| `market_heatmap` | Price trends or DOM heatmap | Polygon/Grid | Internal analytics service | Weekly | Generated from analytics pipeline; may use hex bins. |
| `investment_scores` | Investor opportunity scores | Polygon/Grid | Internal analytics service | Weekly | Derived from AVM deltas, rental yields. |
| `annotations_public` | Public social annotations | Point | Parcel annotations service | Real-time | Mirror subset of annotation data for public map. |
| `agent_territories` | Agent/broker service areas | Polygon | CRM-defined | Ad hoc | Restricted to authorized roles. |

Each layer will have metadata stored in `overlay_layers` table (see Section 5).

---

### 3. API Contracts

#### 3.1 `GET /api/map/overlays`

Returns metadata for available overlay layers, optionally filtered by user role or geographic context.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `types` | csv enum | all | Filter by layer type (`zoning`, `schools`, `analytics`, `social`, `transport`, etc.). |
| `bbox` | string | — | Optional bounding box filter (returns only layers intersecting bbox). |
| `role` | enum (`public`,`buyer`,`agent`,`investor`,`admin`) | deduced | Overrides default role-based filtering. |
| `include_styles` | boolean | `true` | Include style metadata (colors, line widths, icons). |
| `include_stats` | boolean | `false` | Include summary stats (feature count, last updated). |

**Response**
```json
{
  "layers": [
    {
      "id": "zoning",
      "name": "Zoning Districts",
      "description": "Local zoning classifications for Fairfield County",
      "type": "regulatory",
      "geometry_type": "polygon",
      "source": "ct_gis",
      "updated_at": "2025-06-01",
      "style": {
        "fillColor": "#FF7F0E",
        "fillOpacity": 0.2,
        "strokeColor": "#C1580A",
        "strokeWidth": 1
      },
      "attribution": "CT GIS, Town of Fairfield Planning Department",
      "availability": {
        "roles": ["public","buyer","agent","investor"],
        "zoom_min": 10,
        "zoom_max": 18
      }
    }
  ]
}
```

#### 3.2 `GET /api/map/overlays/{layer_id}`

Delivers overlay data for a specific layer, tailored to the requested viewport and zoom.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `bbox` | string (required) | — | Viewport bounds `minLon,minLat,maxLon,maxLat` (EPSG:4326). |
| `zoom` | number | — | Current map zoom (0-22) used for geometry simplification and tile selection. |
| `format` | enum (`geojson`,`mvt`) | `geojson` | Output format. `mvt` returns Mapbox Vector Tile (single tile). |
| `limit` | int | 2000 | Max features in GeoJSON mode. |
| `attributes` | csv enum | `core` | Attribute bundle selection (see Section 4). |
| `timeframe` | enum (`current`,`forecast`) | `current` | For analytics layers supporting multiple time periods. |
| `style` | enum (`default`,`minimal`) | `default` | Override style hints for lightweight clients. |

**GeoJSON Response Skeleton**
```json
{
  "layer_id": "zoning",
  "bbox": [-73.4, 41.0, -73.2, 41.2],
  "zoom": 13,
  "count": 182,
  "features": [
    {
      "type": "Feature",
      "id": "zoning:FAIRFIELD:R2",
      "geometry": { "type": "Polygon", "coordinates": [[[...]]]},
      "properties": {
        "code": "R2",
        "label": "Residential 2-Family",
        "description": "Two-family residential district",
        "lot_min_sqft": 8000,
        "height_limit_ft": 35
      }
    }
  ],
  "style": { ... },
  "metadata": {
    "source": "Town of Fairfield Planning Department",
    "updated_at": "2025-06-01",
    "attribution": "© Town of Fairfield"
  }
}
```

**Vector Tile Response**
- Binary protobuf; includes `Content-Type: application/vnd.mapbox-vector-tile` and `X-Feature-Count` header.  
- Layer name defaults to `{layer_id}`; attributes limited to essential columns for tile size < 1 MB.

#### 3.3 Future Endpoint: `GET /api/map/overlays/{layer_id}/tiles/{z}/{x}/{y}`

- Aligns with standard XYZ tile fetching for MapboxGL.  
- Reuses caching/simplification logic from Section 6.  
- Defer implementation until frontend requests dedicated tile endpoint.

---

### 4. Attribute Bundles

| Bundle | Fields | Use Case |
| --- | --- | --- |
| `core` | `id`, `code`, `name`, `description`, `attribution`, `updated_at` | Minimal metadata for legends/tooltips. |
| `regulatory` | Adds zoning metrics (`lot_min_sqft`, `height_limit_ft`, `allowed_uses`) | Zoning overlays. |
| `education` | Adds school details (`grades`, `rating`, `enrollment`) | School zones. |
| `risk` | Adds FEMA data (`risk_class`, `base_flood_elevation`, `insurance_required`) | Flood/wetlands overlays. |
| `analytics` | Adds internal metrics (`score`, `trend_pct`, `confidence`) | Market/investor heatmaps. |
| `social` | Adds annotation metadata (`author_type`, `visibility`, `reaction_counts`) | Social layers. |

Bundle selection informs SQL column projection to minimize payload weight.

---

### 5. Data Storage & Schema

Create `overlay_layers` table to store metadata:

```sql
CREATE TABLE overlay_layers (
    layer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    geometry_type VARCHAR(20) NOT NULL,
    description TEXT,
    source VARCHAR(100),
    attribution TEXT,
    availability JSONB,          -- roles, zoom levels, feature limits
    style JSONB,                 -- default styling tokens
    data_table VARCHAR(100),     -- pointer to base table/view in PostGIS
    update_cadence VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Each overlay data table (e.g., `overlay_zoning_polygons`, `overlay_flood_zones`) stores geometry+attributes with PostGIS GIST indexes. Use materialized views for analytics layers to support refresh schedules.

---

### 6. Simplification, Caching, and Performance

- Geometry simplification: Use `ST_SimplifyPreserveTopology` with tolerance derived from zoom (`zoom <= 10 → 0.001`, `11-13 → 0.0003`, `>=14 → 0.00005`).
- Large datasets (FEMA, census) should use vector tiles by default; degrade to summary GeoJSON when feature count exceeds threshold.
- Cache overlay responses in Redis with keys `(layer_id, bbox_hash, zoom, attributes, role)`. TTL 10 min for static data, 60 s for analytics/social overlays.
- Precompute and store `ST_TileEnvelope` tiles for heavy layers (FEMA) using `generate_series` approach or on-demand caching.
- Include ETag support; analytics layers should embed `as_of` timestamp in ETag.

---

### 7. Styling Metadata

Style object per layer includes:
- `fillColor`, `fillOpacity`, `strokeColor`, `strokeWidth` for polygons.
- `lineColor`, `lineWidth`, `dashArray` for polylines.
- `icon`, `iconSize`, `iconAnchor`, `color` for points.
- `legend`: array describing legend items (value → label → color).

Allow overrides via query param `style=minimal` to strip styling for clients that handle styling locally.

---

### 8. Security & Permissions

- Role-based filtering: `overlay_layers.availability.roles` indicates which user roles can view layer.
- Sensitive layers (agent territories, investor heatmaps) gated behind authentication middleware. 404 returned if unauthorized.
- Audit overlay requests in `api_usage_logs` with layer ID, role, bbox, and response format.

---

### 9. Observability

- Metrics: `map.overlays.requests`, `map.overlays.cache_hit`, `map.overlays.response_ms`, `map.overlays.feature_count`.  
- Logs include layer ID, bbox size (square km), zoom, format, feature count, simplification tolerance.  
- Alerts for cache miss ratio >50% or response time >700 ms sustained over 5 min.

---

### 10. Testing Plan

- Unit tests for parameter validation (`bbox`, `zoom`, `format`, `attributes`).
- Integration tests verifying geometry simplification, role-based visibility, and bundle-specific fields.
- Performance tests on heavy layers (FEMA) across zoom levels to ensure tile sizes < 500 KB.
- Visual regression tests (screenshot-based) once frontend integration is live.

---

### 11. Open Questions

- Confirm canonical sources for neighborhood boundaries (municipal vs. custom definitions).  
- Decide whether to host FEMA data locally or proxy from AWS S3/Tile service.  
- Determine if overlays should expose time-slider support (e.g., historical flood maps).  
- Evaluate licensing for GreatSchools ratings or alternative public datasets.  
- Align naming conventions for analytics-generated layers (hex grids vs. census tracts).

---

### 12. Implementation Checklist

1. Seed `overlay_layers` metadata table with foundational layers (zoning, neighborhoods, schools, flood).  
2. Build ingestion scripts to populate PostGIS tables from source datasets (ETL with GeoPandas/Fiona).  
3. Implement FastAPI routes (`/api/map/overlays`, `/api/map/overlays/{layer_id}`) plus parameter validation.  
4. Add data access layer utilities for GeoJSON + MVT generation (shared with parcel endpoint where possible).  
5. Integrate caching, logging, metrics instrumentation.  
6. Coordinate with frontend to finalize styling tokens and legend conventions.  


