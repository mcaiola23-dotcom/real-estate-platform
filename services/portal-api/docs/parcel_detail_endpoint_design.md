## Parcel Detail Aggregator Endpoint Design (Task M2)

**Date:** 2025-11-07  
**Owner:** Executor  
**Scope:** Defines the response contract, data sources, and orchestration strategy for `GET /api/map/parcels/{parcel_id}` — the API powering the parcel detail drawer/property page in the SmartMLS AI Platform.

---

### 1. Objectives & Experience Goals

- Present a single parcel view that merges CT GIS fundamentals, current/previous MLS listings, AI insights, and media assets.
- Enable consistent rendering across map drawer, standalone property pages, CRM detail views, and investor dashboards.
- Provide deterministic data freshness and attribution (IDX compliance) while remaining extensible for overlays (annotations, social comments, analytics).
- Keep P99 response latency <400 ms when data is cached in Postgres/Redis; <650 ms on cold cache.

---

### 2. Endpoint Contract

`GET /api/map/parcels/{parcel_id}`

#### Path Parameters
- `parcel_id` (string, required): Primary CT GIS identifier (e.g., `FAIRFIELD-0123-4567`).

#### Query Parameters
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `include` | csv enum | `parcel,current_listing,history,analytics,media` | Controls which data blocks are returned. Supported tokens listed below. |
| `listing_status` | enum (`active`,`recent`,`any`) | `active` | Determines which listing qualifies as “current_listing”. |
| `history_limit` | int (1-25) | 10 | Max prior listings returned. |
| `analytics_at` | ISO datetime | `now` | Timestamp for time-sensitive analytics (AVM snapshot, market trend). |
| `annotations_scope` | enum (`personal`,`team`,`public`,`all`) | `all` | Controls which annotations/comments are returned. Requires auth. |
| `locale` | string | `en-US` | For human-readable formatting (currency, dates). |

#### Supported `include` tokens
- `parcel`: Core parcel metadata from CT GIS.
- `current_listing`: Active or most recent MLS listing (including IDX-required attribution).
- `history`: Historical listing timeline (prior statuses).
- `media`: Photos, virtual tours, Street View fallback, map thumbnails.
- `analytics`: AVM, confidence bands, demand/investor scores, market comps.
- `overlays`: Zoning, school district, flood zone, neighborhood identifiers.
- `annotations`: User/agent/investor notes, tasks, social comments.
- `similar`: Related parcel recommendations (comps, nearby listings, investor matches).
- `usage`: View counts, lead conversions, admin-only metrics.

---

### 3. Response Structure (Example)

```json
{
  "parcel_id": "FAIRFIELD-0123-4567",
  "address": {
    "full": "123 Research Dr, Fairfield, CT 06824",
    "street_number": "123",
    "street_name": "Research Dr",
    "city": "Fairfield",
    "state": "CT",
    "zip": "06824"
  },
  "location": {
    "centroid": [-73.366234, 41.123456],
    "geometry": { "type": "Polygon", "coordinates": [[[...]]]},
    "lot_size_acres": 0.42,
    "zoning": "R2",
    "land_use": "SingleFamily",
    "neighborhood": {
      "id": "FAIRFIELD-DOWNTOWN",
      "name": "Downtown Fairfield"
    },
    "school_district": "Fairfield Public Schools",
    "flood_zone": "X"
  },
  "parcel": {
    "property_type": "SingleFamily",
    "year_built": 1995,
    "square_feet": 2450,
    "units": 1,
    "assessment": {
      "year": 2025,
      "total": 415000,
      "land": 200000,
      "building": 215000
    },
    "recent_sales": [
      { "price": 685000, "date": "2020-06-15" },
      { "price": 625000, "date": "2014-09-20" }
    ]
  },
  "current_listing": {
    "listing_id": 987654,
    "listing_id_str": "170610123",
    "status": "Active",
    "list_price": 725000,
    "list_date": "2025-10-31",
    "days_on_market": 8,
    "bedrooms": 4,
    "bathrooms": 3.5,
    "square_feet": 2600,
    "remarks": "Beautiful colonial...",
    "agent": {
      "name": "Alex Morgan",
      "license": "RES.0790000",
      "phone": "203-555-0199",
      "email": "alex@example.com"
    },
    "office": {
      "name": "Fairfield Realty Group",
      "broker_id": "BRK012345",
      "phone": "203-555-0100"
    },
    "attribution": "Listing courtesy of Fairfield Realty Group (SmartMLS #170610123)"
  },
  "history": {
    "listings": [
      {
        "listing_id_str": "170580432",
        "status": "Sold",
        "list_price": 699000,
        "sold_price": 685000,
        "sold_date": "2020-06-15",
        "days_on_market": 21
      },
      {
        "listing_id_str": "170420987",
        "status": "Expired",
        "list_price": 649000,
        "expired_date": "2018-09-30"
      }
    ],
    "events": [
      { "type": "price_change", "date": "2025-11-02", "from": 745000, "to": 725000 },
      { "type": "status", "date": "2020-06-15", "status": "Sold" }
    ]
  },
  "analytics": {
    "avm": {
      "estimate": 712000,
      "confidence": 0.83,
      "low": 690000,
      "high": 735000,
      "model_version": "avm-lite-0.2"
    },
    "demand_score": 68,
    "investment_score": 74,
    "rental_estimate": {
      "rent": 3500,
      "cap_rate": 4.8
    },
    "comps": [
      { "parcel_id": "FAIRFIELD-0456-7890", "distance_m": 420, "sold_price": 705000, "sold_date": "2025-05-11" }
    ]
  },
  "media": {
    "photos": [
      { "url": "https://cdn.smartmls.ai/listings/170610123/photo1.jpg", "caption": "Front elevation", "source": "listing" }
    ],
    "virtual_tour_url": "https://vtour.smartmls.ai/170610123",
    "street_view": {
      "url": "https://maps.googleapis.com/...",
      "heading": 210,
      "pitch": 5,
      "latlng": [41.12345, -73.3661]
    },
    "fallback_image": "https://cdn.smartmls.ai/placeholders/colonial.png"
  },
  "annotations": {
    "personal": [
      { "id": "note-abc", "author": "user-123", "body": "Potential client loves the yard.", "created_at": "2025-11-05T18:30:00Z" }
    ],
    "team": [],
    "public": [
      { "id": "comment-xyz", "author": { "display_name": "LocalResident" }, "body": "Great neighborhood for families!", "created_at": "2025-10-28T14:12:00Z" }
    ]
  },
  "similar": {
    "nearby_listings": ["FAIRFIELD-0987-6543", "FAIRFIELD-0567-4321"],
    "comparable_sales": ["FAIRFIELD-0456-7890"]
  },
  "usage": {
    "views_30d": 142,
    "leads_generated": 3,
    "last_viewed_at": "2025-11-07T13:15:00Z"
  }
}
```

Blocks omitted (based on `include`) should either be absent or explicitly set to `null` depending on frontend preference (default: omit).

---

### 4. Data Source Mapping

| Block | Source Tables / Services | Notes |
| --- | --- | --- |
| `parcel` | `parcels` table | Base CT GIS attributes; geometry served via Map endpoint but centroid/excerpts reused here. |
| `current_listing` | `listings`, `agents`, `offices`, `address_matches` | Filter by status hierarchy: `active > coming soon > pending > recently sold`. |
| `history` | `listings` (ordered by `list_date` desc), `address_matches`, event generator | Maintain deduped timeline; include status changes, price adjustments. |
| `media` | `listings.photos`, `listings.virtual_tour_url`, `PropertyImageService` (Street View, stored imagery) | Fallback logic described in Section 6. |
| `analytics` | `avm_estimates`, `parcel_analytics`, `market_metrics`, `search_analytics` | Some tables pending implementation; design should abstract via service layer. |
| `overlays` | `parcel_overlays`, `school_districts`, `zoning_layers`, `fema_flood_zones`, `neighborhoods` | Use simplified geometries and metadata; primarily references to overlay IDs + names here. |
| `annotations` | `parcel_notes`, `team_annotations`, `public_comments` | Auth-gated; integrate with CRM/social modules. |
| `similar` | `comparable_scoring_service`, `search_index` | Provide lightweight arrays of parcel IDs + pre-fetched attributes if needed. |
| `usage` | `property_view_analytics`, `api_usage_logs`, `lead_tracking` | Stats for agents/admin; hide for public users. |

---

### 5. Data Access Strategy

1. **Parcel fetch**: Use SQLAlchemy query with eager loading of `List` relationships to minimize round trips. Example skeleton:
   ```python
   parcel = (
       db.query(Parcel)
       .options(joinedload(Parcel.listings).joinedload(Listing.listing_agent),
                joinedload(Parcel.listings).joinedload(Listing.listing_office))
       .filter(Parcel.parcel_id == parcel_id)
       .first()
   )
   ```

2. **Filter listings**: Partition results into `current_listing` vs. `history` using status precedence and `list_date` ordering. Expand to include `sold` events.

3. **Analytics aggregation**: Call dedicated service (e.g., `ParcelInsightsService`) that queries AVM, demand/investor scores, comps, rental estimates. Accepts `parcel_id` and `as_of` timestamp.

4. **Media collation**: Pass parcel + listing context to `PropertyImageService` which returns prioritized media assets (Section 6).

5. **Annotations & social**: Invoke annotation service with parcel ID, user context, and scope filters.

6. **Overlays references**: Query overlay lookup tables for names/IDs; embed only metadata and highlight tokens, not full geometry (map endpoint handles visuals).

7. **Caching**: Compose aggregated response as JSON and cache in Redis keyed by `parcel_id` + include parameters + user role. TTL 60 s for public data, 15 s for authenticated views.

---

### 6. Media Fallback Hierarchy

1. **Listing Photos** (if `current_listing.photos` non-empty) — prioritized by MLS-provided order.
2. **Historical Listing Photos** (search most recent listing with photos).
3. **Street View Image** via `PropertyImageService` (uses Google Street View static API with stored pano metadata).
4. **Cached CT GIS Imagery** (if aerial imagery catalog available in future).
5. **Generated Placeholder** (style-aligned property-type illustration hosted on CDN).

Each media item should include `source` (`listing`, `street_view`, `cadastre`, `generated`), capture timestamp, and attribution requirements.

---

### 7. IDX Compliance & Permissions

- Always include listing attribution (`Listing courtesy of…`) when `current_listing` present.
- Hide restricted fields (`private_remarks`, `showing_instructions`) unless requester has agent/admin role.
- Enforce geofencing if MLS rules require (e.g., hide certain data outside allowed regions).
- Log access in `api_usage_logs` including user ID, parcel ID, include parameters, and timestamp.

---

### 8. Performance & Observability

- **Targets**: Backend time <400 ms (cache hit) / <650 ms (cache miss); payload <80 KB by default (without media arrays).
- **Metrics**: `parcel_detail.requests`, `parcel_detail.cache_hit`, `parcel_detail.response_ms`, `parcel_detail.media_fallback_level`.
- **Tracing**: Use OpenTelemetry spans for `parcel_fetch`, `listing_select`, `analytics_fetch`, `media_resolve`.
- **Error Handling**: Return `404` if parcel not found; `409` if data temporarily inconsistent (e.g., missing matched listing). Provide `warnings` array in response metadata when fallback behaviors triggered.

---

### 9. Testing Plan

- **Unit Tests**: Cover include parameter parsing, status precedence for listings, media fallback selection, auth-based filtering.
- **Integration Tests**: With seed data for parcel + multiple listings to validate aggregator output. Include cases with/without analytics data, missing media.
- **Contract Tests**: Snapshot JSON schema for consumer teams; ensure optional blocks remain optional.
- **Performance Tests**: Simulate repeated hits to confirm caching and instrumentation behave under load.

---

### 10. Future Enhancements & Questions

- Clarify structure for `annotations` and `social` modules (e.g., threaded comments, reactions).
- Determine update pipeline for historical listing data (do we ingest sold listings nightly?).
- Define standardized scoring outputs for `demand_score`, `investment_score`, `rental_estimate` once analytics services land.
- Explore GraphQL facade for parcel detail to give consumers granular control over selection.
- Consider websocket channel for real-time updates (e.g., price changes) for agents subscribed to parcel.

---

### 11. Implementation Checklist

1. Create FastAPI route + schema models aligning with response sections (Pydantic).  
2. Build aggregator service orchestrating database queries and external services.  
3. Wire caching/logging/metrics instrumentation.  
4. Integrate media fallback logic with `PropertyImageService`.  
5. Add unit/integration/performance tests before releasing to frontend.  


