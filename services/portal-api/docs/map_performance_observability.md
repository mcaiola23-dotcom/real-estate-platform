## Map Performance & Observability Plan (Task M5)

**Date:** 2025-11-07  
**Owner:** Executor  
**Scope:** Establish latency targets, caching approach, logging/metrics schema, and future-proofing backlog for the map services introduced in Tasks M1–M4.

---

### 1. Latency & Payload Targets

| Endpoint | Target (P95) | Absolute Max | Payload Goal | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/map/parcels` | ≤ 400 ms | 700 ms | GeoJSON < 1.5 MB / tile < 500 KB | Simplify geometry at low zoom, cache hot viewports. |
| `GET /api/map/parcels/{parcel_id}` | ≤ 350 ms | 600 ms | JSON < 120 KB | Use eager loading & Redis caching for parcel aggregates. |
| `GET /api/map/overlays/{layer_id}` | ≤ 450 ms | 800 ms | GeoJSON < 1 MB / tile < 600 KB | Heavy layers (FEMA) default to MVT. |
| `POST /api/search/properties` | ≤ 500 ms | 900 ms | JSON < 350 KB | Includes list + map highlight metadata. |
| `POST /api/map/search/highlights` | ≤ 250 ms | 400 ms | JSON < 80 KB | Lean response for viewport sync. |

General requirements:
- Cold cache allowances: initial cache miss may approach absolute max; ensure P99 < 900 ms.
- Streaming optional for massive responses; revisit if payload goals exceeded.

---

### 2. Caching Strategy

**Redis Namespaces**
- `map:parcels:{bbox_hash}:{zoom}:{attrs}` – TTL 60 s (public), 15 s (auth).  
- `map:parcel_detail:{parcel_id}:{include}` – TTL 120 s; bust on listing updates or annotation changes.  
- `map:overlay:{layer_id}:{bbox_hash}:{zoom}:{attrs}` – TTL varies: 10 min (static), 60 s (analytics/social).  
- `map:search:{filter_hash}:{page}` – TTL 30 s.  
- `map:highlight:{filter_hash}:{bbox_hash}:{zoom}:{selected}` – TTL 15 s.

**Invalidation Triggers**
- Listing import or status change → invalidate parcel detail & relevant search/cache keys.  
- Overlay dataset refresh (ETL completion) → invalidate `overlay_layers` metadata + layer caches.  
- Annotation create/update/delete → invalidate parcel detail caches for affected parcel.  
- Analytics pipeline run → invalidate `map:overlay` for analytics layers + highlight caches if maps depend on scores.

**HTTP Caching**
- Support `ETag` & `If-None-Match` for GeoJSON responses.  
- Use `Cache-Control: public, max-age=30` for static overlay metadata (`GET /api/map/overlays`).

---

### 3. Logging Schema

Log events with structured JSON fields:

| Field | Description |
| --- | --- |
| `event` | e.g., `map.parcels.request`, `map.overlay.cache_hit`, `map.search_highlight.response` |
| `request_id` | Correlates across services (trace ID). |
| `user_id` | Optional (hashed for privacy). |
| `role` | public/buyer/agent/investor/admin. |
| `layer_id` | For overlay requests. |
| `bbox` | Serialized as `[minLon,minLat,maxLon,maxLat]`. |
| `zoom` | Map zoom integer. |
| `feature_count` | Number of features returned. |
| `geometry_detail` | `simplified`, `full`, tile extent. |
| `response_ms` | Duration in milliseconds. |
| `cache_status` | `hit`, `miss`, `stale`, `bypassed`. |
| `filter_hash` | For search/highlight flows. |
| `errors` | Validation or PostGIS errors (if any). |

Logging tools: standard Python logging + structlog or loguru; ensure compatibility with OpenTelemetry exporters.

---

### 4. Metrics & Dashboards

Prometheus (or equivalent) metrics to capture:

```text
# Request latency histograms
histogram map_parcels_response_ms{endpoint,format,role}
histogram map_overlay_response_ms{layer_id,format}
histogram map_search_highlight_response_ms{role}

# Counts
counter map_parcels_requests_total{format}
counter map_overlay_requests_total{layer_id}
counter map_highlight_requests_total{}
counter map_cache_hits_total{type}

# Payload sizes
histogram map_response_bytes{endpoint}

# Feature counts
histogram map_features_returned{endpoint}

# Error rates
counter map_request_errors_total{endpoint,error_type}
```

Dashboard widgets:
- Latency percentiles (P50/P95/P99) per endpoint.  
- Cache hit ratio vs. request volume.  
- Feature count distribution (watch for large responses).  
- Top overlay layers by usage; top bboxes.  
- Error heatmaps (PostGIS failures, auth errors).

---

### 5. Alerting

- P95 latency > target for 5 consecutive minutes.  
- Cache hit ratio < 40% (indicates invalidation storm or misconfiguration).  
- Error rate > 2% per endpoint across 5 min window.  
- Response payload > 2 MB (GeoJSON) flagged for investigation.  
- Highlight endpoint feature count > 5,000 or response time > 400 ms (possible filter degeneracy).

---

### 6. Future Enhancements & Risks

- **Real-time updates:** integrate WebSocket or SSE channels for listing changes; ensure backpressure handling.  
- **Tile pre-generation:** for FEMA/analytics overlays, schedule nightly tile builds to reduce on-demand load.  
- **Edge caching/CDN:** consider caching vector tiles at edge (CloudFront) once traffic scales.  
- **Adaptive sampling:** automatically downgrade to cluster summary when viewport returns >5k features.  
- **Security audits:** review overlay data licensing & access controls to avoid exposing restricted layers.  
- **Observability gaps:** implement tracing spans (`parcel_fetch`, `overlay_fetch`, `search_highlight`) to isolate slow segments.  
- **Testing debt:** build synthetic datasets for load testing (10x Fairfield size) to estimate scalability.

---

### 7. Implementation Checklist

1. Configure Redis namespaces and middleware for all map endpoints.  
2. Add structured logging + metrics instrumentation (FastAPI middleware + Prometheus exporter).  
3. Build Grafana dashboard with widgets described above.  
4. Set CloudWatch/Prometheus alerts per thresholds in Section 5.  
5. Develop load test plan (Locust/K6) simulating peak map interactions.  


