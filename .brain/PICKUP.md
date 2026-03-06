# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- **Primary lane (as of 2026-03-05): post-roadmap launch-path completion in `apps/web`** — roadmap Phases 1 through 4 are complete and post-roadmap implementation slice is in place.
- **Immediate implementation target** — run staging verification for IDX bridge contract and AI discovery/content endpoints.
- **Follow-on implementation target** — complete production launch gate approvals (`SEO_ENABLE_INDEXING`, canonical domain config, monitoring/rollback ownership) and finalize checklist sign-off.
- **Parallel lane note** — other agents are active on CRM/blog tasks; keep this lane isolated to `apps/web` + roadmap/.brain tracking unless user redirects.

## Why This Is Next
- User asked to proceed after roadmap completion, and core post-roadmap implementation is now landed.
- Validation now shows both `check` and host-authoritative `build` passing for `apps/web`.
- Remaining value is in environment/runtime verification and go-live controls, not additional refactor work.

## Current Snapshot (2026-03-05, Agent Website Post-Roadmap Implementation Complete)
- **Branch**: `main`
- **Canonical roadmap file**: `project_tracking/agent_website_implementation_roadmap.md` (Phase 1-4 `Done`; post-roadmap launch-path section now active).
- **Locked strategy inputs**:
  - shared Sanity dataset per environment with strict tenant scoping,
  - SEO blocked by default and only enabled when production + explicit gate,
  - mock listing data is temporary pending IDX integration.
- **Latest implementation closeout**:
  - Completed enterprise isolation design note: `project_tracking/agent_website_enterprise_isolation_mode.md`.
  - Modularized home-search UI (`SearchToolbar`, `ResultsSidebar`) and cleaned stale/dead code paths.
  - Added SEO runtime gate wiring (`layout`, `robots`, `sitemap`, `lib/seo/runtime.ts`).
  - Added smoke/perf tests with workspace `check` command.
  - Added launch runbooks/checklists in `apps/web/docs/*`.
  - Added secure IDX bridge routing + provider wiring (`/api/listings/provider`, `idx-bridge.ts`, provider contract updates).
  - Added AI discovery + extraction surfaces (`/llms.txt`, `/.well-known/*`, `/api/content/agent.md`, `/api/content/market.md`, `/api/content/towns/{townSlug}`) and SEO/AEO runbook.
  - Fixed town extraction endpoint path mismatch by replacing `/api/content/towns/{townSlug}.md` with `/api/content/towns/{townSlug}`.
  - Removed tracked generated backup/log artifacts and added ignore protections.
- **Validation baseline**:
  - `npm run check --workspace @real-estate/web` — PASS (2026-03-05).
  - `cmd.exe /c "... npm run build --workspace @real-estate/web"` — PASS (2026-03-05, host Windows runtime).
  - Local runtime smoke (`next start --port 3105` + curl checks) — PASS (`200` for robots/sitemap/llms/content endpoints and `/home-search`).
- **Concurrent-agent note**: worktree contains active parallel edits in `apps/crm`, `apps/portal`, and `apps/web`; avoid touching unrelated files in this lane.

## Completed This Session (Session 33 — Property Detail Modal Fix & Polish + Neighborhood Data)
1. Implemented 7-issue Property Detail Modal Fix & Polish sprint: sticky header restructure, section reorder, print preview fix, market stats two-column table, comps error handling (404→200 + 3mi radius), neighborhood display throughout modal, photo vertical gallery.
2. Fixed print preview regression (Next.js Image `fill` position:absolute containment), expanded comps radius, rewrote Transaction History UI (listingId prop, most-recent-first, soft errors).
3. Added `subdivision` to `PublicListing` Pydantic schema, joined Neighborhood table in `get_parcel_detail()`, updated frontend normalization fallback chain.
4. Ran neighborhood data pipeline: `populate_cache.py` (42/42 cached), `fix_parcel_assignments.py` with new nearest-neighbor fallback (103,756 parcels assigned, 0 generic Stamford).
5. Fixed Street View heading: added `_calculate_bearing()` geodesic bearing from pano to property, updated `get_image_url()` to use pano+heading or address-based auto-orient.
6. Replaced off-market info card with "Currently Off-Market" pill overlay on Street View image.
7. Disabled `scrollWheelZoom` on neighborhood map to prevent scroll hijacking.

### Files Modified (Session 33)
- `apps/portal/src/components/PropertyDetailModal.tsx` — sticky header, section reorder, neighborhood display, photo gallery, off-market pill, print fixes, Transaction History listingId
- `apps/portal/src/app/globals.css` — print CSS fixes (scoped overflow, img containment, print-hero)
- `apps/portal/src/components/NeighborhoodMap.tsx` — neighborhood prop, heading display
- `apps/portal/src/components/NeighborhoodMapInner.tsx` — scrollWheelZoom disabled
- `apps/portal/src/components/MarketStatsSection.tsx` — two-column table rewrite
- `apps/portal/src/components/pricing/CompsSection.tsx` — soft error styling, radius note
- `apps/portal/src/components/pricing/TransactionHistory.tsx` — complete rewrite (listingId, sort, UI)
- `services/portal-api/app/api/routes/comps.py` — 404→200, 3mi radius
- `services/portal-api/app/api/routes/transaction_history.py` — 404→empty result
- `services/portal-api/app/api/routes/map.py` — Neighborhood table join
- `services/portal-api/app/api/listing_schemas.py` — subdivision field
- `services/portal-api/app/services/street_view.py` — bearing calculation, image URL logic
- `services/portal-api/scripts/populate_cache.py` — Unicode fix
- `services/portal-api/scripts/fix_parcel_assignments.py` — nearest-neighbor pass, Unicode fix
- `services/portal-api/scripts/import_zillow_neighborhoods.py` — Unicode fix

## Completed Previous Session (Session 32)
1. Split Google key usage in backend config into server key (`GOOGLE_MAPS_SERVER_API_KEY`) and places key (`GOOGLE_PLACES_API_KEY`) with legacy fallback support (`GOOGLE_MAPS_API_KEY`).
2. Added startup fail-fast Google key checks (missing/placeholder/key-shape) in `services/portal-api/app/core/config.py`.
3. Updated Google key consumers across backend routes/services (`commute`, `places`, `street_view`, `favorites`, `properties`, `commute_service`) to use resolved split keys.
4. Updated docs/deployment config for split keys (`services/portal-api/README.md`, `services/portal-api/render.yaml`) and optional frontend browser-key guidance (`apps/portal/.env.example`).
5. Added reusable smoke checklist runbook (`services/portal-api/docs/portal-smoke-test-checklist.md`).
6. Ran syntax validation on touched backend Python files (`python3 -m py_compile ...`) and confirmed pass.

## Completed This Session (Session 31)
1. Added authenticated write-path success-path smoke coverage for `POST /api/favorites` in `services/portal-api/tests/test_hardening_smoke.py`.
2. Extended fake DB test scaffolding to support model-aware query fixtures so write-path success tests can deterministically satisfy route checks (`UserFavorite` existing lookup + `Listing` existence lookup).
3. Re-ran local syntax validation (`python3 -m py_compile tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`) and confirmed pass.
4. Re-ran authoritative backend gate with Postgres-backed `DATABASE_URL` via `cmd.exe /v:on ... ci-gate-windows.cmd`; captured pass output (`29 passed`, Alembic head checks pass).
5. Updated `.brain` and `portal_crm_integration_suggestions.md` with new test/gate baseline.

## Completed Previous Session (Session 30)
1. Closed the pending authoritative backend gate task by running `services/portal-api/scripts/ci-gate-windows.cmd` against Postgres with corrected env handling (`cmd.exe /v:on` + `set DATABASE_URL=...&&`), capturing pass output (`28 passed`, Alembic head checks pass).
2. Added authenticated write-path success-path smoke coverage for `POST /api/saved-searches` in `services/portal-api/tests/test_hardening_smoke.py`.
3. Enhanced smoke-test fake session refresh behavior to assign deterministic ID/timestamp values needed by response-model validation in create-path tests.
4. Re-ran local syntax validation (`python3 -m py_compile tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`) and confirmed pass.
5. Synchronized `.brain` and `portal_crm_integration_suggestions.md` status entries to mark backend CI/Alembic runtime validation complete.

## First Actions Next Session
1. Run `/session-bootstrap`.
2. Open and align against `project_tracking/agent_website_implementation_roadmap.md`.
3. Run staging verification against `apps/web/docs/idx-cutover-runbook.md` and confirm bridge contract responses for all provider actions.
4. Run staging/production SEO-AEO verification against `apps/web/docs/seo-aeo-runbook.md` and `apps/web/docs/launch-readiness-checklist.md`.
5. Use the automation scripts instead of manual curls where possible:
   - `npm run verify:seo-aeo --workspace @real-estate/web`
   - `npm run verify:idx-provider --workspace @real-estate/web` (staging/prod expects configured bridge)
6. Keep `.brain` + roadmap status synchronized as launch-path checks are completed.

## Constraints To Keep
- Preserve tenant isolation for all CRM/Admin/portal data operations.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- No cross-app imports.
- Keep this session lane focused on `apps/web` roadmap execution while separate portal/CRM workstreams proceed in parallel.
