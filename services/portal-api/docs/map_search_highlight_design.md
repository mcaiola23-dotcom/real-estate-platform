## Map Search Highlight Integration Design (Task M4)

**Date:** 2025-11-07  
**Owner:** Executor  
**Scope:** Defines the data flow, API contracts, and frontend synchronization model connecting property search results with map highlights in the SmartMLS AI Platform.

---

### 1. Objectives

- Keep property search results (list view) and map highlights perfectly in sync.
- Support instant visual feedback when filters change, results paginate, or a user selects/saves a property.
- Leverage existing parcel/map endpoints (Tasks M1–M3) by adding minimal, well-defined integration points.
- Provide a foundation for future real-time updates (new listings, price changes) and collaborative annotations.

---

### 2. Current Baseline

- Frontend `PropertiesPage` fetches `GET /properties/` (legacy endpoint), filters in-browser, and uses `SimpleMapFallback` (static UI). No live map integration yet.
- Backend `GET /properties/` still references legacy `Property` model; parcel-centric search layer not implemented.
- Map contract work (Tasks M1 & M2) produced designs for parcel GeoJSON, parcel detail aggregator, and overlays but no code yet.

Task M4 bridges the upcoming parcel-based search API with map highlighting so both experiences share a single source of truth.

---

### 3. Proposed API Surface

#### 3.1 Property Search Endpoint (List + Map metadata)

`POST /api/search/properties`

- Accepts filter payload (text, geography, price, property specs, status, overlays).
- Returns paginated results plus a `map` block describing highlight instructions for the current result set.

**Request Example**
```json
{
  "query": "Research Drive",
  "filters": {
    "status": ["active","coming_soon"],
    "price": {"min": 500000, "max": 1500000},
    "property_types": ["SingleFamily","Condo"],
    "bedrooms": {"min": 3},
    "bathrooms": {"min": 2},
    "parcel_ids": [],
    "towns": ["Fairfield","Westport"],
    "bbox": [-73.45, 41.05, -73.15, 41.25]
  },
  "sort": {"field": "list_price", "direction": "asc"},
  "page": 1,
  "page_size": 25,
  "include": ["list","map","analytics"]
}
```

**Response Skeleton**
```json
{
  "summary": {
    "total_results": 147,
    "page": 1,
    "page_size": 25,
    "filter_hash": "c85c1f70"
  },
  "results": [
    {
      "parcel_id": "FAIRFIELD-0123-4567",
      "listing_id": 987654,
      "address": "123 Research Dr",
      "city": "Fairfield",
      "state": "CT",
      "zip_code": "06824",
      "status": "Active",
      "list_price": 725000,
      "bedrooms": 4,
      "bathrooms": 3.5,
      "square_feet": 2600,
      "lot_size_acres": 0.42,
      "thumbnail_url": "https://.../photo.jpg",
      "highlight_state": "primary"  // see Section 4
    }
  ],
  "map": {
    "highlight_ids": ["FAIRFIELD-0123-4567", "WESTPORT-0056-7890", "..."],
    "selected_id": null,
    "bbox": [-73.45, 41.05, -73.15, 41.25],
    "view": {
      "center": [-73.30, 41.15],
      "zoom": 11,
      "bounds": [[-73.45, 41.05], [-73.15, 41.25]]
    },
    "call_to_action": {
      "endpoint": "/api/map/parcels",
      "params": {
        "bbox": "-73.45,41.05,-73.15,41.25",
        "zoom": 11,
        "limit": 2000,
        "highlight_ids": "FAIRFIELD-0123-4567,WESTPORT-0056-7890",
        "attributes": "core"
      }
    },
    "clusters": [
      {"parcel_ids": ["..."], "centroid": [-73.27, 41.18], "size": 8}
    ]
  }
}
```

Notes:
- `filter_hash` becomes cache key for map highlight requests; also stored in URL for deep linking.
- `map.call_to_action` reuses Task M1 endpoint (`GET /api/map/parcels`) with the `highlight_ids` parameter already envisioned.
- Response may optionally include pre-computed GeoJSON in `map.features` when page size is small, reducing round trips.

#### 3.2 Selection & Highlight Update Endpoint (Optional)

`POST /api/map/search/highlights`

- Lightweight endpoint triggered when search state persists but map viewport changes (pan/zoom).  
- Request contains `filter_hash`, new `bbox`, and optional `selected_id`; returns updated highlight instructions.

```json
{
  "filter_hash": "c85c1f70",
  "bbox": [-73.30, 41.10, -73.20, 41.18],
  "zoom": 14,
  "selected_id": "FAIRFIELD-0123-4567"
}
```

Response mirrors `map` object above. Enables smooth infinite scrolling and map-driven filtering (see Section 5).

---

### 4. Highlight States & Styling

To drive consistent UI cues, each parcel result carries a `highlight_state` value:

| State | Definition | Map styling hint |
| --- | --- | --- |
| `primary` | Result matches active search filters. | Solid border + bright fill; default highlight. |
| `secondary` | Suggested/related parcel (e.g., Similar comps) included by Search service. | Dashed border, muted fill. |
| `selected` | User actively focused parcel (hover/selected). | Bold outline, drop-shadow effect, bring to front. |
| `saved` | In user’s saved list/watchlist. | Icon overlay (star/heart). |
| `hidden` | Filtered out (e.g., suppressed for compliance) but needed for analytics counts. | No render or minimal indicator. |

Frontend map layer toggles styling using Mapbox data-driven styling with `feature-state` or properties populated from GeoJSON/MVT attributes.

---

### 5. Map ↔ List Synchronization Model

1. **Initial Search**  
   - Client calls `POST /api/search/properties`.  
   - Render `results` in list; use `map.highlight_ids` to request `GET /api/map/parcels` (Task M1) for geometry.

2. **Viewport Change (Pan/Zoom)**  
   - Client sends `POST /api/map/search/highlights` with `filter_hash` + new `bbox`.  
   - Backend recalculates highlight set (may reduce to visible subset or add clusters).  
   - Response updates `highlight_ids` + recommended map center/zoom.

3. **List Interaction**  
   - Selecting a list item sets `selected_id`; map either toggles feature state locally or re-requests highlight endpoint for additional context (e.g., show nearby comps).

4. **Map Interaction**  
   - Clicking parcel on map triggers `ParcelDetail` fetch (`GET /api/map/parcels/{parcel_id}` from Task M2) and optionally updates list selection.

5. **Filter Change**  
   - Any filter change invalidates `filter_hash` → new search request → map re-sync.

State is stored centrally in frontend store (e.g., Zustand/Redux) keyed by `filter_hash`, enabling sharing across list, map, and detail drawer.

---

### 6. Caching & Performance

- Search responses cached per `filter_hash` + page number for 30 s to support rapid map interactions.
- Highlight endpoint uses Redis with composite key `(filter_hash, bbox_hash, zoom, selected_id)` TTL 15 s.
- Events that mutate underlying data (new listing, price change) should emit cache invalidation events (future Task M5).
- Provide `X-Search-Filter-Hash` header so frontend can detect stale responses.

---

### 7. Testing Plan

- Unit tests for search filter parsing, highlight state derivation, and map call-to-action assembly.
- Integration tests verifying highlight endpoint returns consistent IDs/centroids for sample datasets.
- Contract tests ensuring the `map` block includes required keys (`highlight_ids`, `call_to_action`).
- Frontend integration tests (Playwright) to confirm list ↔ map selection remains synchronized.

---

### 8. Open Questions & Future Enhancements

- Should we provide cluster summaries (count, avg price) directly in highlight response to cut down map aggregation work?  
- Do we need WebSocket push for real-time listing updates (ties into Task M5)?  
- How should we persist `filter_hash` in URLs for shareable searches (query param vs. path)?  
- Confirm compliance requirements for highlighting off-market parcels in public map.

---

### 9. Implementation Checklist

1. Build parcel-based search service (leveraging PostGIS + new models) to power `POST /api/search/properties`.  
2. Implement highlight endpoint + caching layer.  
3. Extend Mapbox frontend component to consume `map` block, request `GET /api/map/parcels` with `highlight_ids`, and apply styling.  
4. Refactor `PropertiesPage` to use new search API and maintain shared state store.  
5. Add tests + metrics instrumentation (ties into Task M5).  


