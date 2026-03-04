# Portal Smoke Test Checklist

Use this checklist after portal-api or portal frontend changes that affect map/search/property detail behavior.

## Preconditions

- `services/portal-api` is running (`python run.py`) with valid `.env.local` values:
  - `DATABASE_URL`
  - `GOOGLE_MAPS_SERVER_API_KEY` (or legacy `GOOGLE_MAPS_API_KEY`)
  - `GOOGLE_PLACES_API_KEY` (or legacy `GOOGLE_MAPS_API_KEY`)
- `apps/portal` is running (`npm run dev:portal` or workspace equivalent).
- Browser cache is hard-refreshed.

## Core Smoke Checks

1. Map parcels render
- Open `/properties`.
- Pan/zoom map.
- Verify parcel overlays and parcel hover/click interactions appear.

2. Search autocomplete works
- In search bar, type a partial street address (3+ chars).
- Verify suggestions include off-market parcel matches and location suggestions.

3. Off-market property modal: Street View + Commute
- Open an off-market parcel detail modal.
- Verify Street View image renders (not stock fallback).
- Open `Location & Commute` tab.
- Verify both cards populate:
  - `NYC Grand Central`
  - `Nearest Train Station`

4. Active listing modal: Street View + Commute
- Open an active listing modal.
- If listing has photos, verify fallback behavior remains correct.
- Open `Location & Commute` tab.
- Verify commute values load and no "Unable to load commute data" error is shown.

## Failure Capture (If Any Check Fails)

Collect these before triage:

- Property identifier used (`listing_id` and/or `parcel_id`).
- Browser error text shown in UI.
- Backend log lines for failing requests:
  - `/api/properties/{id}/calculate-commute`
  - `/api/properties/{parcel}/street-view`
  - `/api/places/autocomplete` (if autocomplete fails)

## Expected Result

All 4 core checks pass with no blocking UI errors and no startup config errors in backend logs.
