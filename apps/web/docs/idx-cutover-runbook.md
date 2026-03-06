# IDX Cutover Runbook

Last updated: 2026-03-05

## Goal
Move `apps/web` from mock listings to live IDX data without exposing IDX credentials in the browser.

## Architecture
1. Client home-search components continue using the existing listings provider contract.
2. When `NEXT_PUBLIC_LISTINGS_PROVIDER=idx` and `NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK=false`, the provider calls:
- `POST /api/listings/provider`
3. That route forwards to a server-side IDX bridge using secure env vars:
- `IDX_BRIDGE_URL`
- `IDX_BRIDGE_TOKEN`

This keeps IDX secrets server-side only.

## Required Environment
- `NEXT_PUBLIC_LISTINGS_PROVIDER=idx`
- `NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK=false`
- `IDX_BRIDGE_URL=<https endpoint>`
- `IDX_BRIDGE_TOKEN=<server secret>`
- Optional: `IDX_BRIDGE_TIMEOUT_MS=8000`

If fallback is enabled (default), the website remains on mock data.

## IDX Bridge Contract
`IDX_BRIDGE_URL` must accept:
- Method: `POST`
- Headers:
  - `Authorization: Bearer <IDX_BRIDGE_TOKEN>`
  - `x-idx-bridge-action: <action>`
  - `Content-Type: application/json`
- Body:
```json
{
  "action": "searchListings | getListingById | getListingsByIds | suggestListings | listNeighborhoods",
  "payload": {}
}
```

Response can be either:
```json
{ "ok": true, "data": { } }
```
or a direct JSON data payload matching the expected action result.

Error response:
```json
{ "ok": false, "error": "reason" }
```

## Actions and Expected Data
1. `searchListings`
- Input: `ListingSearchParams`
- Output: `ListingSearchResult`

2. `getListingById`
- Input: `{ id: string }`
- Output: `Listing | null`

3. `getListingsByIds`
- Input: `{ ids: string[] }`
- Output: `Listing[]`

4. `suggestListings`
- Input: `ListingSuggestParams`
- Output: `Listing[]`

5. `listNeighborhoods`
- Input: `{ townSlugs?: string[] }`
- Output: `ListingNeighborhoodOption[]`

Canonical type definitions live in:
- `packages/types/src/listings.ts`
- `apps/web/app/lib/data/providers/listings.types.ts`

## Cutover Steps
1. Deploy IDX bridge service with contract above.
2. Validate bridge responses against `Listing` contract.
3. Set env vars in staging.
4. Run:
```bash
npm run check --workspace @real-estate/web
npm run verify:idx-provider --workspace @real-estate/web
```

Staging/prod recommended command:
```bash
WEB_VERIFY_BASE_URL=https://staging.your-domain.com \
IDX_VERIFY_EXPECT_CONFIGURED=true \
npm run verify:idx-provider --workspace @real-estate/web
```
5. Manual staging smoke:
- Home search returns live listings.
- Autocomplete suggestions are live.
- Listing modal opens with live records.
- Saved homes and neighborhood filters still work.

`verify:idx-provider` behavior:
- Default expects bridge configured (`IDX_VERIFY_EXPECT_CONFIGURED=true`).
- In configured mode, each probe must return `HTTP 200` with JSON envelope `{ "ok": true, "data": ... }`.
- For local/dev where bridge is intentionally not configured, run:
```bash
IDX_VERIFY_EXPECT_CONFIGURED=false npm run verify:idx-provider --workspace @real-estate/web
```

6. Promote env vars to production.
7. Re-run launch smoke checklist.

## Rollback
1. Set `NEXT_PUBLIC_LISTINGS_PROVIDER=mock` (or re-enable fallback).
2. Redeploy config.
3. Confirm home-search returns mock provider data and no IDX errors.
