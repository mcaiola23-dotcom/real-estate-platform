# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- **Authoritative runtime confirmation for new Google startup checks** — run `python run.py` from Windows backend venv and confirm fail-fast behavior/messages for missing/invalid split keys.
- **Secret-handling policy closeout** — rotate exposed Google/OpenAI keys and finalize pre-launch key-rotation checklist docs.
- **Keep authoritative CI evidence current** — rerun `services/portal-api/scripts/ci-gate-windows.cmd` after backend hardening changes and record output in `.brain`.
- **UI work remains out-of-scope for this lane** — another agent is currently handling portal UI; this lane should stay on stability/security/hardening.

## Why This Is Next
- Google key usage is now split by function (server vs places) with legacy fallback support, and startup validation has become stricter by default.
- The new smoke checklist is documented, but authoritative host-runtime execution should confirm startup behavior in the production-like toolchain.
- Remaining risk is key governance/rotation and keeping CI evidence current after config hardening changes.

## Current Snapshot (2026-03-03, Session 32 end)
- **Branch**: `main`
- **Portal frontend status**:
  - `npm run typecheck --workspace @real-estate/portal` — PASS
  - `npm run test:routes --workspace @real-estate/portal` — PASS
  - `npm run lint --workspace @real-estate/portal` — PASS (pre-existing warnings only)
- **Backend CI gate status**: `ci:portal-api` now defaults `PORTAL_API_TEST_TARGETS` to `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`, enforces PostgreSQL/PostGIS, and keeps Alembic current/upgrade/current checks.
- **Google config status**:
  - Split env support added: `GOOGLE_MAPS_SERVER_API_KEY` + `GOOGLE_PLACES_API_KEY` with legacy fallback `GOOGLE_MAPS_API_KEY`.
  - Startup validation added in `app/core/config.py` (presence + placeholder/shape checks) with toggles:
    - `GOOGLE_REQUIRE_KEYS_ON_STARTUP` (default `true`)
    - `GOOGLE_VALIDATE_KEY_FORMAT` (default `true`)
- **Smoke checklist status**: `services/portal-api/docs/portal-smoke-test-checklist.md` added and linked from backend README.
- **Backend test status**: `services/portal-api/tests/test_hardening_smoke.py` now includes write/error/authz checks plus authenticated create success-path coverage for `saved-searches` and `favorites`; legacy suites remain modernized and in default targets (`app/tests/test_api.py`, `tests/test_phase0.py`).
- **Alembic status**: runtime upgrade validation executed successfully in Windows virtualenv on both `sqlite:///./test.db` and `postgresql://postgres:user@localhost:5432/smartmls_db`, reaching `20260302_000002 (head)`.
- **Authoritative gate status**: `cmd.exe /v:on /c "... set DATABASE_URL=postgresql://postgres:user@localhost:5432/smartmls_db&& services\\portal-api\\scripts\\ci-gate-windows.cmd"` passes with `29 passed`, Alembic pre/post-upgrade at `20260302_000002 (head)`.
- **Environment note**: Alembic was installed in external Windows venv `C:\\Users\\19143\\Projects\\smartmls-ai-app\\backend\\.venv`; this repo-local WSL Python environment still lacks `pytest`/`alembic`.
- **Environment note**: WSL runtime still lacks backend dependencies like `pydantic_settings`; authoritative startup/CI checks remain Windows-via-venv.

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
2. Add authenticated `/api/alerts` write-path success-path smoke coverage.
3. Re-run `services/portal-api/scripts/ci-gate-windows.cmd` after that test change and capture output deltas.
4. Finalize secret-manager policy + pre-launch key-rotation checklist documentation (rotation itself still deferred per user direction).
5. Keep `.brain` + `portal_crm_integration_suggestions.md` synchronized after each backend-gate execution/update.

## Constraints To Keep
- Preserve tenant isolation for all CRM/Admin/portal data operations.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- No cross-app imports.
- Keep this session lane focused on technical hardening while separate UI work proceeds in parallel.
