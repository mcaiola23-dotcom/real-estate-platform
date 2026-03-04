## Map Parcels Endpoint Design (Task M1)

**Date:** 2025-11-07  
**Owner:** Executor  
**Scope:** Defines the contract and data-access pattern for `GET /api/map/parcels`, the primary data feed powering the ParcelMap in the SmartMLS AI Platform.

---

### 1. Goals & Constraints

- Deliver parcel geometries and metadata fast enough for fluid MapboxGL interactions (target <500 ms server time, <1.5 MB payload per viewport).
- Support zoom-responsive geometry detail so users can zoom from county view to individual parcel outlines without incurring excessive payload sizes.
- Provide filters aligned with current and planned search UX (property type, price, status, etc.) and extensible for future overlays.
- Offer dual output modes: GeoJSON FeatureCollection (default) and Mapbox Vector Tiles (MVT) for high-performance rendering, both backed by PostGIS.
- Allow callers to specify which attribute bundles they need (core parcel fields vs. enriched analytics) to minimize over-fetching.
- Ensure results are cache-friendly with deterministic parameter combinations and support for ETag/If-None-Match.

---

### 2. Endpoint Contract

`GET /api/map/parcels`

#### Required Parameters
| Name | Type | Description |
| --- | --- | --- |
| `bbox` | string (comma-separated) | Required map viewport bounds as `minLon,minLat,maxLon,maxLat` in EPSG:4326. |
| `zoom` | number | Current map zoom level (Mapbox style, 0-22) to determine geometry simplification tier. |

#### Optional Parameters
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | enum (`geojson`, `mvt`) | `geojson` | Output format. `mvt` returns a single tile in Mapbox Vector Tile format (pbf). |
| `limit` | integer (1-5000) | 1000 | Max features in GeoJSON mode (ignored for `mvt`). Helps constrain dense urban viewports. |
| `offset` | integer | 0 | Offset for pagination (GeoJSON only). Cursor-based pagination may be added later. |
| `geometry_detail` | enum (`simplified`, `full`) | auto | Force geometry detail tier; default auto-selects based on `zoom`. |
| `attributes` | csv string | `core` | Attribute bundle spec: `core`, `extended`, `analytics`. Multiple bundles allowed (e.g., `core,analytics`). |
| `property_type` | csv string | — | Filter parcels by standardized property types (SingleFamily, MultiFamily, etc.). |
| `zoning` | csv string | — | Filter by zoning codes. |
| `min_price` / `max_price` | number | — | Apply price filters using latest matched listing or AVM value; requires joining listings/analytics tables. |
| `status` | enum (`listed`, `unlisted`, `any`) | `any` | Filter on whether parcel has an active listing linked. |
| `updated_since` | ISO datetime | — | Return parcels with `updated_at` >= timestamp for incremental refresh on client. |
| `highlight_ids` | csv string | — | Ensure specified parcel_ids are returned even if outside bbox (for cross-panel sync). |

#### Response Examples

**GeoJSON (default):**
```json
{
  "type": "FeatureCollection",
  "count": 732,
  "limit": 1000,
  "offset": 0,
  "features": [
    {
      "type": "Feature",
      "id": "BE-0123456789",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...]]]
      },
      "properties": {
        "parcel_id": "BE-0123456789",
        "centroid": [-73.366234, 41.123456],
        "address_full": "123 Research Dr",
        "property_type": "SingleFamily",
        "lot_size_acres": 0.42,
        "list_price": 725000,
        "status": "listed",
        "avm": {
          "estimate": 712000,
          "confidence": 0.83
        },
        "last_updated": "2025-11-01T14:23:10Z"
      }
    }
  ]
}
```

**Vector Tile (`format=mvt`):**
- Response body: binary protobuf representing a single tile (layer `parcels`).
- HTTP Headers: `Content-Type: application/vnd.mapbox-vector-tile`, `Content-Encoding: gzip` (if compressed), `X-Parcel-Count` metadata.
- Tile coordinate derived from `bbox` + `zoom`; clients should request using standard `{z}/{x}/{y}` pattern in future iteration.

---

### 3. Geometry Level-of-Detail Strategy

| Zoom Range | Detail Tier | Geometry Handling | Notes |
| --- | --- | --- | --- |
| 0–9 | `simplified` | Use `ST_SimplifyPreserveTopology(geometry, 0.0005)` and return centroids only unless `geometry_detail=full`. | Keeps payload <300 features county-wide. |
| 10–14 | `simplified` | Use tolerance `0.0001`, deliver polygons + centroids. | Balances suburb-level detail (~30m tolerance). |
| 15+ | `full` | Return raw geometry (pre-validated in import) using `ST_AsGeoJSON` without simplification. | Required for parcel outlines. |

Vector tiles will leverage `ST_AsMVTGeom` with zoom-aware extent (default 4096) and internal simplification.

---

### 4. Data Access Layer Specification

Core query skeleton (GeoJSON mode):
```sql
WITH bounds AS (
  SELECT ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326) AS geom
), filtered AS (
  SELECT p.parcel_id,
         CASE WHEN :detail = 'simplified'
              THEN ST_SimplifyPreserveTopology(p.geometry, :tolerance)
              ELSE p.geometry
         END AS geom,
         ST_AsGeoJSON(p.centroid)::json ->> 'coordinates' AS centroid_coords,
         p.property_type,
         p.lot_size_acres,
         p.updated_at,
         l.list_price,
         l.status,
         avm.estimate AS avm_estimate,
         avm.confidence
  FROM parcels AS p
  JOIN bounds ON ST_Intersects(p.geometry, bounds.geom)
  LEFT JOIN listings AS l ON l.parcel_id = p.parcel_id AND l.status IN ('active','coming soon')
  LEFT JOIN parcel_analytics AS avm ON avm.parcel_id = p.parcel_id
  WHERE (:property_type IS NULL OR p.property_type = ANY(:property_type))
    AND (:zoning IS NULL OR p.zoning = ANY(:zoning))
    AND (:status = 'any' OR (:status = 'listed' AND l.list_price IS NOT NULL) OR (:status = 'unlisted' AND l.list_price IS NULL))
    AND (:updated_since IS NULL OR p.updated_at >= :updated_since)
  ORDER BY p.updated_at DESC
  LIMIT :limit OFFSET :offset
)
SELECT jsonb_build_object(
  'type', 'FeatureCollection',
  'count', (SELECT COUNT(*) FROM filtered),
  'limit', :limit,
  'offset', :offset,
  'features', jsonb_agg(jsonb_build_object(
      'type', 'Feature',
      'id', parcel_id,
      'geometry', ST_AsGeoJSON(geom)::json,
      'properties', jsonb_build_object(
          'parcel_id', parcel_id,
          'centroid', centroid_coords,
          'property_type', property_type,
          'lot_size_acres', lot_size_acres,
          'list_price', list_price,
          'status', status,
          'avm_estimate', avm_estimate,
          'avm_confidence', avm_confidence,
          'updated_at', updated_at
      )
  ))
) AS feature_collection
FROM filtered;
```

Vector tile mode reuses the `filtered` CTE and pipes into `ST_AsMVT(filtered, 'parcels', 4096, 'geom', array['parcel_id','property_type','list_price','status'])`.

**Indexes & Performance Considerations**
- Existing GIST indexes on `geometry`/`centroid` cover spatial lookups.
- Add partial index on `updated_at` if incremental polling becomes heavy.
- Ensure `listings` table has index on `(parcel_id, status)` to accelerate active listing joins.

---

### 5. Attribute Bundles

- `core`: `parcel_id`, `address_full`, `centroid`, `property_type`, `lot_size_acres`, `updated_at`.
- `extended`: Adds zoning, land_use, assessment totals, AVM summary fields.
- `analytics`: Adds AI-derived metrics (confidence bands, demand score, investor score) sourced from analytics tables.

Implementation approach: maintain mapping dict that translates bundle names into SQLAlchemy column selections and JSON serialization.

---

### 6. Caching & Observability

- Cache key derived from sorted query params; store GeoJSON responses (<=1 MB) in Redis for 60 s. Vector tiles cached per `{bbox|z}` combo for 5 min.
- Emit structured logs with `bbox`, `zoom`, `feature_count`, `geometry_detail`, `format`, `response_ms`.
- Capture metrics: `map.parcels.requests`, `map.parcels.cache_hit_ratio`, `map.parcels.avg_payload_bytes`.
- Support `If-None-Match` by hashing response body and returning `304` when unchanged.

---

### 7. Testing Strategy

- Unit tests covering parameter parsing/validation for `bbox`, `zoom`, `format`, filter combinations.
- Integration tests with PostGIS test database verifying bounding-box filtering, geometry simplification thresholds, and attribute bundle selection.
- Performance smoke tests hitting representative bounding boxes (urban downtown vs. suburban) to ensure response time budgets.
- Contract tests snapshotting GeoJSON schema (type/order) to guard against breaking frontend map ingestion.

---

### 8. Open Questions / Future Enhancements

- How should we expose `{z}/{x}/{y}` tile endpoints? Option A: Accept `tile` param; Option B: add separate `/api/map/parcels/tiles/{z}/{x}/{y}` route.
- Coordinate with frontend on acceptable default `limit` during dense blocks; may need tile slicing sooner than later.
- Determine analytics table naming conventions (`parcel_analytics`, `avm_estimates`) to finalize joins.
- Evaluate streaming responses (chunked JSON) if payload sizes grow.
- Ensure social/annotation overlays can subscribe to same bbox parameters for consistent map state.

---

### 9. Next Steps (Executor Checklist)

1. Implement FastAPI route with parameter validation (pydantic schema) following this contract.
2. Build DAL helpers in repository layer wrapping PostGIS queries (SQLAlchemy + `geoalchemy2.functions`).
3. Add serializer for GeoJSON and vector tile outputs (consider separate service class).
4. Wire caching layer and logging instrumentation.
5. Write unit/integration tests per Section 7 before exposing endpoint to frontend.


