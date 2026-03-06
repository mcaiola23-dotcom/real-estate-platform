# TODO_BACKLOG

## Critical / Now
- [x] Create `real-estate-platform` parent repo.
- [x] Copy current Fairfield app to `apps/web`.
- [x] Move/initialize studio as `apps/studio`.
- [x] Add workspace tooling and root scripts.
- [x] Define shared domain and event types.
- [x] Stand up tenant/domain schema.
- [x] Complete tenant context threading through remaining website APIs and data providers.
- [x] Complete tenant context threading through remaining client-side/static data providers.
- [x] Replace seed-backed tenant persistence with durable data store + migrations.

## Next
- [x] Implement portal-side gateway boundary in `apps/portal` (`/api/portal/[...path]`) to proxy backend calls with centralized controls instead of direct client-to-backend calls. (Completed 2026-03-02 via new catch-all route + shared proxy utilities.)
- [x] Add endpoint-specific rate limiting for portal AI search, auth registration/credentials login, lead submission/read, favorites, saved-search, and alerts flows. (Completed 2026-03-02 via `apps/portal/src/lib/server/rate-limit.ts`, NextAuth authorize throttling, and proxy endpoint policy mapping.)
- [x] Enforce portal runtime security baseline in this monorepo: fail-fast weak non-local auth secret checks and non-dev debug-route lock down. (Completed 2026-03-02 via `apps/portal/src/lib/server/env-security.ts` + `apps/portal/src/middleware.ts`.)
- [x] Protect portal lead retrieval surface behind authenticated access and remove insecure sample-data fallback from agent dashboard. (Completed 2026-03-02 via `/api/portal/leads` policy + auth-required `/agents` flow updates.)
- [x] Fix portal favorites runtime field drift (`address` vs `address_full`) through response normalization at the gateway boundary. (Completed 2026-03-02 in `apps/portal/src/app/api/portal/proxy-utils.ts`.)
- [x] Add portal CI quality-gate command surface and route smoke coverage for new proxy policy/normalization behavior. (Completed 2026-03-02 via `typecheck/test:routes/check` scripts in `apps/portal/package.json`, root `ci:portal`, and `proxy-utils.test.ts`.)
- [x] Apply backend-only technical-suggestion follow-through in standalone `services/portal-api` (alert model/field drift incl. `user.full_name`, dependency manifest completeness, scheduler worker split, Alembic migration discipline baseline, backend startup secret guards). (Completed 2026-03-02: lead read authz guard, backend secret fail-fast, canonical `SearchAlert`, dedicated scheduler worker, explicit dependency manifest, Alembic scaffold + baseline revision.)
- [~] Roll out pre-commit secret scanning for portal/backend repositories and enforce secret-handling policy prior to launch. (Completed 2026-03-02 for scanner + hook rollout via `scripts/security/scan-secrets.sh`, `.githooks/pre-commit`, and `security:hooks:install`; remaining: secret-manager policy + pre-launch key-rotation checklist.)
- [x] Resolve portal workspace React type mismatch baseline (`heroicons` JSX incompatibility from duplicate/incompatible React typings) so `npm run typecheck --workspace @real-estate/portal` can pass authoritatively. (Completed 2026-03-02 by pinning portal-local React type resolution in `apps/portal/tsconfig.json`; Windows-authoritative `npm run ci:portal` now passes.)
- [x] Execute Alembic upgrade validation (`alembic upgrade head`) for `services/portal-api` in an environment with Alembic CLI/runtime installed and capture output in `.brain`. (Completed 2026-03-02 via Windows virtualenv against both `sqlite:///./test.db` and `postgresql://postgres:<redacted>@localhost:5432/smartmls_db`: post-upgrade revision is `20260302_000002 (head)`.)
- [x] Re-run Alembic + backend test gate in a PostgreSQL/PostGIS-backed runtime (not SQLite) and capture authoritative CI pass/fail output for release readiness. (Completed 2026-03-02: Postgres-backed Alembic `upgrade head` + `current` passed; backend hardening smoke tests pass via `python -m pytest tests/test_hardening_smoke.py -q`.)
- [x] Standardize portal API base usage to a single pattern (`/api/portal` for client fetches, `joinPortalApiPath(...)` for server fetches) and remove mixed `NEXT_PUBLIC_BACKEND_URL` usage. (Completed 2026-03-02 across portal pages/components + shared server helper.)
- [x] Reduce production debug-log noise in portal search/map hot paths by gating verbose logs to development-only wrappers. (Completed 2026-03-02 in `properties/page.tsx`, `LeafletParcelMap.tsx`, `OverlayLayer.tsx`, `UnifiedSearchBar.tsx`, and `StreetViewWidget.tsx`.)
- [x] Fix post-migration portal regressions where parcel overlays stopped rendering and search autocomplete no longer surfaced off-market parcel matches. (Completed 2026-03-02 in `apps/portal/src/app/properties/page.tsx` by fixing gateway URL construction for map parcel fetches, and in `apps/portal/src/components/UnifiedSearchBar.tsx` by restoring `/api/autocomplete/search` suggestions alongside Google Places.)
- [x] Fix portal Street View + commute regressions after migration (`Location & Commute` active-listing placeholder, off-market commute loading stall, and off-market Street View fallback behavior). (Completed 2026-03-02 via `apps/portal/src/components/PropertyDetailModal.tsx` Location tab wiring to `CommuteSection`, `services/portal-api/app/api/routes/commute.py` path-parameter + decoded-ID handling for slash parcel IDs, and Street View identifier/pano handling updates in `services/portal-api/app/api/routes/properties.py` + `services/portal-api/app/services/street_view.py`.)
- [x] Add explicit Google Maps configuration diagnostics for post-migration Street View/commute failures (instead of silent fallback/generic errors). (Completed 2026-03-02 in `services/portal-api/app/api/routes/commute.py`, `services/portal-api/app/api/routes/properties.py`, `services/portal-api/app/services/street_view.py`, `apps/portal/src/components/CommuteSection.tsx`, and `apps/portal/src/components/StreetViewWidget.tsx`.)
- [x] Add Street View negative-cache auto-revalidation so parcels cached as unavailable during transient outages/config gaps can recover after env fixes. (Completed 2026-03-02 in `services/portal-api/app/api/routes/properties.py` with periodic revalidation of cached unavailable parcels.)
- [x] Align portal-api settings with `.env.local` convention so backend Google Maps credentials placed in `.env.local` are loaded at runtime. (Completed 2026-03-02 in `services/portal-api/app/core/config.py` by loading `(".env.local", ".env")`.)
- [x] Standardize backend CI gate for `services/portal-api` and wire root command surface. (Completed 2026-03-02 via `ci:portal-api` + `scripts/ci-gate.sh` with PostgreSQL/PostGIS requirement, default hardening smoke tests, and Alembic current/upgrade/current checks.)
- [x] Modernize or retire legacy `app/tests/test_api.py` / `tests/test_phase0.py` suites that are SQLite-hardcoded and drifted from current routes/models (Completed 2026-03-02 by replacing both suites with dependency-override/fake-session route-contract tests aligned to current health/leads/listings/cities behavior; reintroduced into default backend CI targets.)
- [x] Expand `services/portal-api/tests/test_hardening_smoke.py` to cover additional release-critical write-path authz/error-path behavior (Completed 2026-03-02 with lead-create success + invalid payload error path + lead-detail authz/not-found checks in addition to existing health/debug/lead-list coverage.)
- [x] Add a reproducible backend CI execution note/script for the authoritative runtime path (Windows venv + Postgres-backed `ci:portal-api`) so local/Wsl environment drift does not block hardening validation. (Completed 2026-03-02 via `services/portal-api/scripts/ci-gate-windows.cmd` + README runbook updates.)
- [x] Expand backend hardening smoke coverage for authenticated `/api` write-path protections (`favorites`, `saved-searches`, `alerts`) with deterministic auth/validation checks. (Completed 2026-03-02 in `services/portal-api/tests/test_hardening_smoke.py`, including auth-required + validation/limit paths and authenticated create success paths for `saved-searches` + `favorites`.)
- [x] Execute the updated default backend CI target set (`tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`) through the authoritative Windows/Postgres gate script and capture full pass/fail output in `.brain`. (Completed 2026-03-02 via `services/portal-api/scripts/ci-gate-windows.cmd`: `28 passed`, Alembic `current -> upgrade head -> current` at `20260302_000002 (head)`.)
- [x] Split Google Maps credential usage by backend function with explicit envs (`GOOGLE_MAPS_SERVER_API_KEY` for Street View/commute and `GOOGLE_PLACES_API_KEY` for Places proxy) while keeping `GOOGLE_MAPS_API_KEY` as legacy fallback. (Completed 2026-03-03 in `services/portal-api/app/core/config.py` + Google route/service consumers + docs/deploy config updates.)
- [x] Add fail-fast startup/config validation for missing/placeholder Google keys with actionable error messages. (Completed 2026-03-03 in `services/portal-api/app/core/config.py` via `validate_runtime_settings()` Google checks and key-format validation toggles.)
- [x] Add a reusable portal smoke test checklist covering parcels, autocomplete, Street View, and commute (active + off-market). (Completed 2026-03-03 in `services/portal-api/docs/portal-smoke-test-checklist.md` and linked from backend README.)
- [x] Property Detail Modal Fix & Polish Sprint — 7 issues: sticky header, section reorder, print preview, market stats table, comps error handling, neighborhood display, photo gallery. (Completed 2026-03-03 across PropertyDetailModal.tsx, globals.css, NeighborhoodMap.tsx, MarketStatsSection.tsx, CompsSection.tsx, comps.py.)
- [x] Fix Street View heading to face property instead of pointing down street. (Completed 2026-03-03 via bearing calculation in `services/portal-api/app/services/street_view.py`.)
- [x] Populate neighborhood boundary cache and assign parcels to specific neighborhoods via spatial intersection + nearest-neighbor fallback. (Completed 2026-03-03: 42/42 boundaries cached, 103,756 parcels assigned, 0 generic Stamford parcels.)
- [x] Resolve neighborhood name in parcel detail API via Neighborhood table join + add subdivision to PublicListing schema. (Completed 2026-03-03 in map.py + listing_schemas.py.)
- [x] Fix Transaction History to try listing_id lookup before parcel_id fallback, and rewrite UI (most-recent-first, soft errors). (Completed 2026-03-03 in TransactionHistory.tsx + transaction_history.py.)
- [x] Expand comps search radius from 1.25mi to 3mi and return empty 200 instead of 404. (Completed 2026-03-03 in comps.py + CompsSection.tsx.)
- [x] Disable scroll-wheel zoom on neighborhood map embed to prevent scroll hijacking. (Completed 2026-03-03 in NeighborhoodMapInner.tsx.)
- [x] Replace off-market info card with "Currently Off-Market" pill overlay on Street View image. (Completed 2026-03-03 in PropertyDetailModal.tsx.)
- [ ] Adjust Westover (Stamford) neighborhood boundary to extend east to Long Ridge Road. (Deferred — user identified Zillow boundary as too conservative.)
- [x] Scaffold `apps/admin` control-plane app with protected auth boundary and internal operations dashboard shell.
- [x] Implement shared control-plane db/contracts for tenant provisioning, domain lifecycle management, and plan/feature-flag settings.
- [x] Add tenant provisioning/domain/status API routes in `apps/admin` and connect dashboard mutation flows.
- [x] Add route-level tests for control-plane API validation/guard behavior and happy-path provisioning/domain updates.
- [x] Execute `@real-estate/admin` route-test command in a compatible local environment (tsx IPC + platform-matched esbuild) and record passing output. (Validated 2026-02-14 via Windows `cmd.exe`: 8/8 tests pass.)
- [x] Re-run Prisma migrate/seed validation for control-plane schema changes in a network-capable environment (`binaries.prisma.sh` reachable) and confirm migration `202602130004_add_tenant_control_settings` application. (Validated 2026-02-14 via Windows `cmd.exe`: migrate applied and seed script executed successfully.)
- [x] Confirm `npm run build --workspace @real-estate/admin` in standard dev environment after resolving sandbox SWC/cache constraints. (Validated 2026-02-14 via Windows `cmd.exe` after Prisma client regeneration.)
- [x] Add admin mutation RBAC/audit boundary in `apps/admin` routes (`tenant.provision`, `tenant.domain.add`, `tenant.domain.update`, `tenant.settings.update`) with route-level deny/allow coverage.
- [x] Persist admin control-plane audit events in a durable shared boundary (schema + helper) instead of app-log-only emission. (Implemented model/migration `AdminAuditEvent` + helper `packages/db/src/admin-audit.ts`, wired admin audit sink to shared helper, and validated route/build/test flow on 2026-02-14.)
- [x] Expose admin audit timeline read surface (API + UI) for operator query workflows. (Implemented `apps/admin/app/api/admin-audit/route.ts` and timeline module/filters in `apps/admin/app/components/control-plane-workspace.tsx` on 2026-02-14.)
- [x] Add route-level integration tests for admin audit timeline read endpoint behavior (tenant-filtered + recent global feed aggregation). (Validated 2026-02-14 via `apps/admin/app/api/lib/routes.integration.test.ts`: audit tenant/global feed tests added, `cmd.exe` run passes 13/13.)
- [x] Re-run `@real-estate/admin` route/build validation for audit timeline changes in Windows `cmd.exe` and record authoritative outcomes. (Validated 2026-02-14: `test:routes` 13/13 pass and `build` pass including `/api/admin-audit` route output.)
- [x] Build tenant resolver middleware by host header.
- [x] Implement website module registry + toggle system.
- [x] Install `@real-estate/db` workspace dependencies and run Prisma generate/migrate/seed locally.
- [x] Create CRM app skeleton and auth integration.
- [x] Build lead/contact/activity database model.
- [x] Add event ingestion pipeline from website actions to CRM.
- [x] Mitigate local Prisma engine file-lock issue impacting `db:generate` reliability on Windows dev environment.
- [x] Build tenant-scoped CRM read/write API routes and dashboard UI modules for leads, contacts, and activity timeline.
- [x] Elevate CRM UI from baseline scaffold to polished, brand-aligned workspace shell and responsive module layout (`apps/crm/app/components/crm-workspace.tsx`, `apps/crm/app/globals.css`, auth entry pages).
- [x] Introduce ingestion service boundary (queue/worker contract) so website APIs enqueue events instead of direct CRM writes.
- [x] Add Prisma config migration (`prisma.config.ts`) and remove deprecated `package.json#prisma` in `@real-estate/db`.
- [x] Expand CRM API filtering/pagination contracts and add route-level validation tests.
- [x] Add CRM API route integration tests for tenant/auth guards, payload validation, pagination responses, and lead status activity side effects.
- [x] Add CRM mutation failure integration coverage for tenant-scoped invalid lead/contact linkage on activity creation.
- [x] Add ingestion worker retry scheduling + dead-letter handling for production reliability.
- [x] Add integration test flow for enqueue -> worker -> CRM persistence (tenant-scoped baseline).
- [x] Add dead-letter lifecycle coverage to ingestion integration flow (invalid payload -> dead-letter -> requeue -> dead-letter).
- [x] Add retry/backoff integration coverage for queue reprocessing cadence (`pending -> processing -> pending` with `nextAttemptAt` gating and attempt count progression).
- [x] Add terminal retry-threshold integration coverage for `ingestion_failed` jobs transitioning to `dead_letter` at max attempts.
- [x] Add dead-letter operator command integration coverage for single-job requeue and tenant-filtered batch requeue paths.
- [x] Add explicit payload validation guard in ingestion path to avoid noisy runtime throws for malformed lead/valuation payloads.
- [x] Add machine-readable JSON output mode for dead-letter operator commands and assert payload shape stability in integration tests.
- [x] Add malformed valuation payload integration coverage to verify retry/backoff and max-attempt dead-letter semantics match malformed lead behavior.
- [x] Add deterministic temporary-tenant fixture lifecycle for ingestion integration test runs to avoid persistent baseline data growth.
- [x] Extract shared ingestion integration test helpers for tenant fixture lifecycle and forced retry progression; refactor integration scripts to consume helper and assert cleanup success.
- [x] Move Prisma client generation/runtime loading to package-local output (`packages/db/generated/prisma-client`) to reduce shared Windows engine lock contention.
- [x] Stabilize Prisma full-engine local generation path on Windows so ingestion scripts can run end-to-end.
- [x] Add dead-letter queue observability + manual re-drive tooling for operations.
- [x] Re-run post-restart Windows Prisma/runtime validation (`db:generate`, `db:generate:direct`, `worker:ingestion:drain`, `@real-estate/admin` route tests) to confirm no partial session state regressions. (Validated 2026-02-16 via Windows `cmd.exe`: all commands pass.)
- [x] Run repeated Windows `db:generate:direct` loop (10+ attempts) and record `EPERM` incidence rate to decide whether additional safe-generate retry/backoff hardening is still required. (Validated 2026-02-16 via Windows `cmd.exe`: 15/15 pass, 0 failures.)
- [x] Add explicit retry/failure-rate logging output to Prisma reliability sampling workflow (store pass/fail snapshots in `.brain` per session) so lock regressions are measurable over time. (Implemented 2026-02-16 via `packages/db/scripts/db-generate-reliability-sample.mjs` + `db:generate:sample` workspace/root command.)
- [x] Add stronger lock retry/backoff handling to safe Prisma generate path before `--no-engine` fallback. (Implemented 2026-02-16 in `packages/db/scripts/db-generate-safe.mjs`: 3 retries with cleanup + progressive backoff.)
- [x] Add temp-artifact hygiene for Prisma lock failures (`query_engine-windows.dll.node.tmp*`) so sampling/hardening loops do not accumulate stray files. (Implemented 2026-02-16 via safe-generate cleanup + `.gitignore` rule.)
- [x] Identify and implement one additional mitigation for persistent Windows Prisma engine rename lock when direct generation repeatedly fails (`query_engine-windows.dll.node` EPERM), then re-run reliability sample to verify improved full-engine success rate. (Implemented 2026-02-17 via new direct wrapper `packages/db/scripts/db-generate-direct.mjs` with rename-lock probe/wait + cleanup + retry/backoff, and re-ran Windows-authoritative sample: still `0/6` pass, so mitigation landed but did not improve success rate yet.)
- [x] Implement next mitigation targeting lock-holder process/file-handle contention for `packages/db/generated/prisma-client/query_engine-windows.dll.node` (beyond retry/cleanup/wait), then compare Windows sample pass rate before/after. (Implemented 2026-02-17 by adding healthy full-engine client reuse gate in `packages/db/scripts/db-generate-direct.mjs`; Windows-authoritative sample improved from `0/6` to `6/6` pass for the same command.)
- [x] Run an extended Windows reliability sample (`db:generate:sample -- 10+ --json --exit-zero`) to confirm mitigation stability over a larger attempt window and record results in `.brain/CURRENT_FOCUS.md`. (Validated 2026-02-17 via Windows `cmd.exe`: `db:generate:sample -- 12 --json --exit-zero` passed `12/12` with `0` `EPERM` failures; post-sample `worker:ingestion:drain` also passed.)
- [ ] Continue periodic Windows reliability sampling (10+ attempts) after restarts/environment changes and track pass/fail trend in `.brain/CURRENT_FOCUS.md`. (Latest 2026-02-22 Windows-authoritative sample: `12/12` pass, `0` `EPERM` lock failures; `worker:ingestion:drain` command from this mixed WSL/Windows dependency state was non-authoritative due `esbuild` platform mismatch.)
- [x] Implement next Prisma Windows lock mitigation for `db:generate:direct` and re-run `db:generate:sample -- 12 --json --exit-zero` to restore stable pass rate. (Completed 2026-02-20 via preflight lock reuse + `DATABASE_URL` fallback + existing-engine preservation in `packages/db/scripts/db-generate-direct.mjs`; sample recovered to `12/12` pass.)
- [x] Add CRM lead-list workflow refinements: quick search/filter controls and pipeline grouping option while preserving tenant-scoped API contracts. (Implemented 2026-02-17 in `apps/crm/app/components/crm-workspace.tsx` with status-tab filtering, multi-filter controls, and sticky quick actions for draft saves.)
- [x] Add CRM micro-interaction polish: optimistic mutation feedback, inline success toasts, and unsaved-change indicators for lead notes/status edits. (Implemented 2026-02-17 in `apps/crm/app/components/crm-workspace.tsx` + `apps/crm/app/globals.css` with optimistic lead/contact/activity mutations, toast stack feedback, and per-lead unsaved draft indicators.)
- [x] Ingest website browsing intent events into CRM pipeline (`search performed`, `listing viewed`, `listing favorited/unfavorited`) so lead-behavior intelligence is persisted tenant-scoped for CRM use. (Implemented 2026-02-17 via `apps/web/app/api/website-events/route.ts`, Home Search/favorites tracking hooks, expanded `packages/types/src/events.ts`, and ingestion handling in `packages/db/src/crm.ts`.)
- [x] Add CRM UI surfaces for website behavior intelligence (Lead Profile Modal sections + timeline/table widgets for search history, listing views, favorites, and most-recent intent signals). (Completed 2026-02-17 in `apps/crm/app/components/crm-workspace.tsx` with modal behavior cards/lists, filter summaries, timeline integration, and dashboard/table intent indicators.)
- [x] Implement reusable Lead Profile Modal across CRM touchpoints (Recent Activity rows, lead names/addresses/contacts, search/autocomplete, table rows, and pipeline cards) with inline edit + save. (Completed 2026-02-17 in `apps/crm/app/components/crm-workspace.tsx`.)
- [x] Add dedicated sortable Leads Table view/tab (Name, Lead Type, Status, Price Range, Location, Last Contact, Beds/Baths/Size desired, Source, Updated At). (Completed 2026-02-17 in `apps/crm/app/components/crm-workspace.tsx`.)
- [x] Make Dashboard KPI cards (`New Leads`, `Need Follow-up`, `Open Pipeline`, `Closed Win Rate`) clickable with clear drill-down/filter behavior. (Completed 2026-02-17.)
- [x] Fix CRM shell navigation affordances: functional left-sidebar `Settings`, functional top-right user menu (Profile/Settings/Logout), and durable header/footer layout treatment. (Completed 2026-02-17 with settings panel placeholder and shell/footer actions.)
- [x] Rework Pipeline board lane rendering so headers/cards are visible on initial load, and add visible horizontal lane navigation controls for smaller laptop viewports. (Completed 2026-02-17 with sticky headers, reduced lane minimum height, and arrow controls.)
- [x] Add Pipeline-local filter controls with explicit `All` option, and make Dashboard-vs-Pipeline filter synchronization explicit/non-surprising. (Completed 2026-02-17 with independent filter state + clear-all control.)
- [x] Add search autocomplete behavior in CRM shell search input with lead/contact suggestions, status metadata, and click-through into Lead Profile Modal. (Implemented 2026-02-17 in `apps/crm/app/components/crm-workspace.tsx` with suggestion dropdown and modal-open actions.)
- [x] Fix Pipeline card save/status transitions so save buttons are always actionable and status changes move cards predictably without accidental disappearance under active filters. (Completed 2026-02-17 with always-actionable save behavior + filter-state notice.)
- [x] Normalize source/type display mappings in CRM UI so internal values (e.g. `website_valuation`) consistently render as operator-friendly labels (e.g. `Valuation Request`) without data-model migration. (Completed 2026-02-17 via `apps/crm/app/lib/crm-display.ts`.)
- [x] Update Activity form linkage UX: lead/contact dropdowns auto-sync in both directions, default most-recent ordering, and optional alphabetical sort toggle. (Completed 2026-02-17 in CRM activity form.)
- [x] Ensure logged notes are visible in all relevant surfaces (Recent Activity feed, lead modal timeline/history, lead-specific context views). (Completed 2026-02-17 in dashboard activity feed + modal timeline.)
- [x] Fix overly dark hover highlights across CRM interactive text/card surfaces (lead/address links, KPI cards, sortable table headers) by normalizing to subtle readable hover styles in `apps/crm/app/globals.css`. (Completed 2026-02-17.)

## Next Session Candidate Work (Admin Priority)
- [ ] Propagate the GTM baseline into operator enablement artifacts (sales/onboarding runbook + Admin seed defaults) so canonical plan matrix, setup SLA policy, and managed-services model are operationalized beyond `.brain/PRODUCT_SPEC.md`.
- [x] Build tenant support diagnostics toolkit (auth/domain/ingestion health checks with operator-friendly remediation actions). (Completed 2026-02-20 via `apps/admin/app/api/tenants/[tenantId]/diagnostics/route.ts`, shared db helpers in `packages/db/src/control-plane.ts`, and Admin workspace diagnostics UI/remediation controls in `apps/admin/app/components/control-plane-workspace.tsx`.)
- [x] Implement data safety/recovery controls in Admin (soft-delete/restore flows for tenant/domain/settings plus destructive-action confirmations). (Completed 2026-02-20 via status-based lifecycle routes + Admin confirmation UX in `apps/admin`.)
- [x] Improve Admin mutation error transparency: surface actionable backend error messages in onboarding/domain/settings UI (RBAC denial, duplicate slug/domain, validation failures) with field-level guidance and operator next steps. (Implemented 2026-02-18 in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/lib/mutation-error-guidance.ts`.)
- [x] Add domain operations automation surface (verification status polling/retry controls and SSL/certificate readiness indicators) on top of existing manual domain actions. (Implemented 2026-02-19 in `apps/admin/app/components/control-plane-workspace.tsx` with polling/auto-poll/retry controls and readiness cards.)
- [x] Implement managed plan/feature governance UX (plan catalog defaults, guardrails, and reusable feature-flag templates by plan tier). (Implemented 2026-02-19 in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/lib/plan-governance.ts`.)
- [x] Expand audit timeline UX (advanced filters, diff-style change detail, exportable logs, and stronger actor/request attribution). (Completed 2026-02-20 in `apps/admin/app/api/admin-audit/route.ts`, `apps/admin/app/api/lib/admin-access.ts`, and `apps/admin/app/components/control-plane-workspace.tsx` with route tests updated.)
- [ ] Run a focused manual browser click-through for admin onboarding + domain ops on desktop and smaller laptop viewport to confirm no environment-specific interaction/layout regressions. (Deferred per product-direction override on 2026-02-20 until additional Admin UI/UX improvements are completed; sandbox remains non-authoritative for local runtime bind checks.)
- [x] Add backend-driven domain verification/certificate status probes so admin poll/retry controls use authoritative external status instead of UI-level refresh-only semantics. (Implemented 2026-02-19 via `apps/admin/app/api/lib/domain-probe.ts`, `apps/admin/app/api/tenants/[tenantId]/domains/probe/route.ts`, and Domain Ops wiring in `apps/admin/app/components/control-plane-workspace.tsx`; validated with `@real-estate/admin` route tests `15/15` and build pass.)
- [x] Harden billing provider ingress with provider-native webhook signature verification + payload normalization for Stripe-style events. (Completed 2026-02-20 in `apps/admin/app/api/billing/webhooks/route.ts` with route coverage updates in `apps/admin/app/api/lib/routes.integration.test.ts`; validated via Windows `test:routes` `38/38`, `lint`, and `build`.)
- [x] Add entitlement drift detection/reporting on reconciled billing provider events (compare provider entitlement signals against persisted tenant settings and return actionable drift summaries). (Completed 2026-02-20 via shared drift summary logic in `packages/db/src/control-plane.ts`, webhook reporting in `apps/admin/app/api/billing/webhooks/route.ts`, and route coverage updates in `apps/admin/app/api/lib/routes.integration.test.ts`; validated via Windows `test:routes` `39/39`, `lint`, and `build`.)
- [x] Add operator-facing drift triage surfaces in Admin billing/audit workflows (drift signal cards + one-click audit preset + investigation guidance). (Completed 2026-02-20 in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/globals.css`; validated via Windows `test:routes` `39/39`, `lint`, and `build`.)
- [x] Add operator remediation shortcuts from drift triage (map missing/extra entitlement flags into guided settings/billing correction actions). (Completed 2026-02-20 in `apps/admin/app/components/control-plane-workspace.tsx` with per-signal missing/extra/all quick actions that update settings draft flags and arm billing entitlement sync; validated via Windows `test:routes` `39/39`, `lint`, and `build`.)
- [x] Add focused automated regression coverage for billing drift remediation shortcut behavior (settings-draft flag mutation + entitlement-sync arming). (Completed 2026-02-20 via shared helper `apps/admin/app/lib/billing-drift-remediation.ts` and targeted tests in `apps/admin/app/api/lib/routes.integration.test.ts`; validated via Windows `test:routes` `43/43`, `lint`, and `build`.)
- [x] Add billing drift reporting summary surface (recent drift counts/modes per tenant) to extend operator visibility beyond per-event triage. (Completed 2026-02-20 via observability summary aggregation in `packages/db/src/control-plane.ts`, shared contracts in `packages/types/src/control-plane.ts`, and Admin UI surface in `apps/admin/app/components/control-plane-workspace.tsx`; validated with `@real-estate/admin` route tests `43/43`.)
- [ ] Run a final manual local browser click-through for CRM (desktop + smaller laptop viewport) to close the remaining post-polish validation gap after current admin-priority work. (Deferred per product-direction override on 2026-02-20 until additional CRM UI/UX improvements are completed; sandbox remains non-authoritative for local runtime bind checks.)

## CRM UI/UX Overhaul (Phase Tracking)
- [x] Phase 0: Component Decomposition — extracted types, formatters, scoring, display helpers, leaf components (`EmptyState`, `SevenDayPulse`, `StatusIcon`, etc.), and `LeadProfileModal` from monolithic `crm-workspace.tsx`. (Completed 2026-02-21.)
- [x] Phase 1A: Enhanced empty states + micro-animations (4 CSS keyframe animations, pipeline card hover enhancement). (Completed 2026-02-21.)
- [x] Phase 1B: 7-Day Pulse polish — angular straight-line SVG, sticky tooltip, full date format. (Completed 2026-02-21.)
- [x] Phase 1C: Lead modal enhancements + contact history + DB migration (`202602210001_add_lead_tracking_fields` — 5 new Lead columns). Full-stack: schema → types → helpers → API → UI. New `ContactHistoryLog.tsx`. (Completed 2026-02-21.)
- [x] Phase 1D: Lead Tracker phone/email columns with `tel:` and `mailto:` links. (Completed 2026-02-21.)
- [x] Phase 1E: Dynamic dashboard widgets — hydration-safe greeting, urgent follow-ups widget. (Completed 2026-02-21.)
- [x] Phase 2: Properties / Prospecting Tool — shared listing types (`packages/types/src/listings.ts`), property cards/filters/detail modal, CRM assign/send actions, mock listings provider. (Completed 2026-02-21.)
- [x] Phase 3: Active Transactions (#14) — 4 DB models (Transaction, TransactionParty, TransactionDocument, TransactionMilestone), 7 API routes (factory pattern), 5 UI components (TransactionsView, TransactionPipeline, TransactionCard, TransactionDetailModal, NewTransactionForm), workspace nav integration. (Completed 2026-02-21, session 4.)
- [x] Phase 4: Drag-and-Drop Pipeline (#25) — @dnd-kit/core + @dnd-kit/sortable, PipelineView/PipelineColumn/PipelineCard extraction, DndContext with drag overlay, optimistic status update on drop, keyboard DnD. (Completed 2026-02-21.)
- [x] Phase 5: Dark Mode — CSS variable override via `[data-theme="dark"]`, `useCrmTheme` hook with per-tenant localStorage persistence, sidebar toggle. (Completed 2026-02-21.)
- [x] Phase 6A: ICS calendar utility (`crm-calendar.ts`) for follow-up reminder downloads. (Completed 2026-02-21.)
- [x] Phase 6B: Performance polish — `React.memo` on StatusIcon, KpiSparkline, PropertyCard; `dynamic()` imports for ProfileView, SettingsView, LeadProfileModal, PropertiesView. (Completed 2026-02-21.)
- [x] Phase 10A: "My Day" focus panel — hero strip with overdue/today/hot leads, quick stats, collapsible. (Completed 2026-02-21.)
- [x] Phase 10B: Conversion funnel SVG widget with draw-in animation and legend. (Completed 2026-02-21.)
- [x] Phase 10C: Revenue pipeline widget with commission estimates and lane totals. (Completed 2026-02-21.)
- [x] Phase 11A: Command Palette (Cmd+K) — fuzzy search, navigation, lead search, keyboard nav. (Completed 2026-02-21.)
- [x] Phase 11B: Notification Center — right-side slide panel with overdue/activity/milestone categories and badge. (Completed 2026-02-21.)
- [x] Phase 11C: Pinned Leads — `usePinnedLeads` hook, star toggle on pipeline cards, sidebar chips. (Completed 2026-02-21.)
- [x] Phase 12A: Analytics view — performance metrics, time range selector, source ROI table. (Completed 2026-02-21.)
- [x] Phase 12C: CSV export utility (`crm-export.ts`) for leads and contacts. (Completed 2026-02-21.)
- [x] Phase 14B: Deal value on pipeline cards + lane totals with commission estimates. (Completed 2026-02-21.)
- [x] Phase 14C: Pipeline aging indicators — `crm-aging.ts` with 7d/14d/30d+ badges. (Completed 2026-02-21.)
- [x] Phase 7: Auto Lead-to-Property Matching — `getLeadPropertyMatches()` with weighted scoring, `GET /api/leads/[leadId]/matches` route, "Suggested Properties" section in LeadProfileModal, "Matches" chip on pipeline cards. (Completed 2026-02-21.)
- [x] Phase 14A: Pipeline Swimlanes — "By Status" / "By Type" toggle with compact cards and status dots. (Completed 2026-02-21.)
- [x] Phase 9C (partial): Communication Quick Actions — Phone/Email/Text icons on pipeline cards. (Completed 2026-02-21.)
- [x] Phase 10D: Breadcrumb Context Bar — 28px nav strip below header with view path + lead name. (Completed 2026-02-21.)
- [x] Phase 12B: Lead Source ROI chart — SourceRoiChart component with editable cost inputs, CSS bar chart, ROI tier coloring. Wired into AnalyticsView. (Completed 2026-02-21, session 4.)
- [x] Phase 13A: Unified Lead Timeline — UnifiedTimeline + TimelineEvent components replacing 3 separate sections. Category filters, day grouping, relative timestamps. (Completed 2026-02-21, session 4.)
- [x] Phase 13B: Lead Tags — DB migration (tags TEXT column), inline tag input with autocomplete, preset suggestions, PATCH API, `/api/leads/tags` endpoint, filter-by-tag support. (Completed 2026-02-21, session 4.)
- [x] Phase 13C: Source Attribution Chain — SourceAttributionChain component with transit-map visualization, auto-computed from activities, deduplication, overflow indicator. (Completed 2026-02-21, session 4.)
- [x] Phase 13D: Duplicate Detection — `findPotentialDuplicateLeads` DB helper, `/api/leads/duplicates` route, DuplicateWarning component with View/Dismiss actions. (Completed 2026-02-21, session 4.)
- [x] Phase 8: AI Integration Foundation — `packages/ai/` scaffold with types, config, LLM client, prompt templates, and 4 CRM orchestration modules (next-action-engine, lead-intelligence, message-drafting, conversation-extractor). 5 factory-pattern AI API routes, 4 AI UI components, 12 route tests. (Completed 2026-02-22, session 5.)
- [x] Phase 9A: AI-Powered Reminders — DB migration (`202602220001_add_reminder_fields` — `nextActionChannel`, `reminderSnoozedUntil`), smart reminder engine (`packages/ai/src/crm/reminder-engine.ts`) with 5 rule-based patterns + AI enhancement, factory-pattern API route, `SmartReminderForm` UI component with AI suggestions + snooze, 3 route tests. (Completed 2026-02-22, session 7.)
- [x] Phase 9B: AI Message Templates — Template library (`apps/crm/app/lib/crm-templates.ts`) with 9 templates, merge field resolution, `TemplateLibrary` UI component with category/channel filters, AI tone adjustment via existing draft-message API. (Completed 2026-02-22, session 7.)
- [x] Phase 9D: AI Escalation — Escalation engine (`packages/ai/src/crm/escalation-engine.ts`) with 4 triggers and 5 escalation levels, score decay integration in `crm-scoring.ts`, factory-pattern API route, `EscalationBanner` + `EscalationAlertBanner` UI components, 3 route tests. (Completed 2026-02-22, session 7.)
- [x] Phase 9C (full): Communication Quick Actions (#44) — tel:/mailto:/sms: links on LeadProfileModal header, Lead Tracker "Actions" column, MyDayPanel sections. (Completed 2026-02-22, session 8.)
- [x] Phase 9E: Win/Loss Analysis (#49) + Lead Handoff (#41) — DB migration `202602230001_add_lead_close_and_assignment` (closeReason, closeNotes, closedAt, assignedTo, referredBy), WinLossModal component, workspace status-change integration. (Completed 2026-02-22, session 8.)
- [x] Phase 9F: AI Draft Composer UI (#52) — AiDraftComposer component with channel/tone/prompt selection, suggestion chips, editable draft, mailto/clipboard actions. Wired into LeadProfileModal. (Completed 2026-02-22, session 8.)
- [x] Phase 9G: CSV Lead Import (#8) — POST /api/leads/import route with contact-first creation, CsvImportModal component with drag-and-drop, auto column mapping, preview table, import progress. Expanded CrmLeadType and CreateCrmLeadInput. (Completed 2026-02-22, session 8.)
- [x] Phase 9H: AI Conversation Insights UI (#54) — ConversationInsights component with extract-from-API, checkbox approval list, confidence badges. Wired into ContactHistoryLog for post-log and per-entry extraction. (Completed 2026-02-22, session 8.)
- [x] Phase 9I: Confirmed AI Lead Scoring Explanations (#50) and AI Lead Summaries (#53) already fully built and integrated. (Verified 2026-02-22, session 8.)
- [x] Remaining CRM polish: #62 Mobile-First Actions, #63 Offline Note Capture, #65 MLS/IDX Feed Status, #66 Document Management, #61 Export. (Completed 2026-02-22, session 10.)
- [x] Lead Profile Modal Round 2 Polish: leadType editability (full-stack DB→API→workspace→modal), auto-classification of legacy types, color-coded lead type badges, last-contact clickable badge with color-matched hover, delete button alignment. (Completed 2026-02-24, session 17.)
- [x] Remove EscalationBanner from modal (aggressive, no actionable resolution). Component retained for future use. (Completed 2026-02-24, session 17.)
- [x] Remove DuplicateWarning from modal (no merge flow). Component retained for future use. (Completed 2026-02-24, session 17.)
- [x] Communications Hub Phase 1 (UI Redesign) — `CommunicationsHub.tsx` replacing toggle-card layout with unified timeline, channel filters, compose bar, integration status. LeadProfileModal Communication tab simplified. (Completed 2026-02-27, session 20.)
- [x] Communications Hub Phase 4 (Custom Templates CRUD) — Prisma `MessageTemplate` model + migration, 6 DB CRUD helpers, 2 API route files, `TemplateLibrary` rewrite with create/edit/delete/favorite/merge-field-picker. (Completed 2026-02-27, session 20.)
- [x] Communications Hub Phase 5 (AI Draft Enhancement) — Multi-draft generation, template-to-draft pipeline, communication history context, SMS-specific prompts, `AiDraftComposer` rewrite with multi-draft tabs. (Completed 2026-02-27, session 20.)
- [ ] Communications Hub Phase 2 (Google OAuth Activation) — Backend fully built. Needs env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `INTEGRATION_ENCRYPTION_KEY`. Then add "Connect Google" prompt in CommunicationsHub + route AI drafts through GmailComposer.
- [ ] Communications Hub Phase 3 (Twilio Integration) — Needs Twilio account + env vars. Build: twilio package code, SMS/voice API routes, SmsComposer + CallLogger components, webhook handlers.
- [ ] Build duplicate lead merge/resolution flow — DuplicateWarning component exists, re-enable in modal when merge UX is built.
- [ ] Build actionable escalation resolution flow — EscalationBanner component exists, re-enable when it provides actionable steps beyond "X days overdue."

## Control Plane Roadmap (Longer Term)
- [x] Improve Admin mutation error transparency: surface actionable backend error messages in UI (RBAC denial, duplicate slug/domain, validation failures) with field-level hints. (Implemented 2026-02-18 in admin onboarding/domain/settings flows with scoped next-step guidance.)
- [x] Build guided tenant onboarding workflow in Admin (multi-step wizard + completion checklist + next required action state). (Implemented 2026-02-18 in `apps/admin/app/components/control-plane-workspace.tsx` with 4-step provisioning flow and launch-readiness checks.)
- [x] Add domain operations automation surface (DNS record guidance, verification status polling/retry, certificate/SSL readiness indicators). (Completed 2026-02-19 with polling/retry controls and readiness indicators in admin Domain Ops.)
- [x] Implement managed plan/feature governance (plan catalog, defaults, guardrails, and feature-flag templates by plan tier). (Completed 2026-02-19 with shared plan-governance helper + onboarding/settings enforcement/override UX.)
- [x] Add authoritative domain/certificate status integrations behind Domain Ops polling controls (provider-backed verification checks + certificate lifecycle signal sync). (Completed 2026-02-19 via backend DNS/TLS probe route + Domain Ops UI integration.)
- [x] Add Admin RBAC management surface (role assignment, permission matrix, actor management, and secure support-session workflows). (Completed 2026-02-20 via new actor/support-session APIs + UI workflow in `apps/admin/app/components/control-plane-workspace.tsx` and shared db persistence in `packages/db/src/control-plane.ts`.)
- [x] Add control-plane observability dashboard (mutation failure trends, ingestion/runtime health indicators, and tenant-level readiness score). (Completed 2026-02-20 via `apps/admin/app/api/observability/route.ts`, shared summary helper `getControlPlaneObservabilitySummary`, and Admin observability UI section.)
- [x] Expand audit timeline UX (advanced filters, diff-style change detail, exportable logs, and stronger actor/request attribution). (Completed 2026-02-20 with richer filter API/UI, metadata attribution capture, and CSV/JSON export in Admin.)
- [x] Add data safety/recovery controls (soft-delete + restore flows for tenants/domains/settings, plus destructive-action confirmations). (Completed 2026-02-20 with tenant/domain/settings status lifecycle controls and restore paths.)
- [x] Integrate billing/subscription operations into control-plane workflows (plan transitions, entitlement sync, trial/payment status visibility). (Completed 2026-02-20 via Prisma model/migration `TenantBillingSubscription`, shared db helpers, Admin billing API route, and billing controls in `apps/admin/app/components/control-plane-workspace.tsx`.)
- [x] Build support diagnostics toolkit per tenant (auth/domain/ingestion checks with one-click operator diagnostics and remediation actions). (Completed 2026-02-20 via diagnostics API/db/UI surfaces with one-click remediation actions.)
- [x] Harden billing-provider integration on top of control-plane billing baseline (external provider/customer sync, status reconciliation/webhooks, and entitlement drift detection). (Completed 2026-02-20 across shared reconciliation, provider-native Stripe signature/payload hardening, and entitlement drift reporting with route-level coverage.)
- [x] Improve Admin workspace information architecture/usability (guided mode, clearer section naming, selected-tenant next-step summary, progressive disclosure for advanced tools). (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/globals.css`.)
- [x] Add task-based Admin workspace navigation with operator Action Center and inline glossary help for advanced platform terms. (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/globals.css`.)
- [x] Propagate GTM plan/onboarding/service baselines into operator enablement artifacts and Admin onboarding guidance/default surfaces. (Completed 2026-02-22 via `project_tracking/operator_onboarding_runbook.md`, `apps/admin/app/lib/commercial-baselines.ts`, Admin onboarding UI integration, plan-tier checklist templates, and actor seed presets.)
- [x] Extract Action Center prioritization into a tested pure helper and split new Admin task-navigation surfaces into subcomponents. (Completed 2026-02-22 via `apps/admin/app/lib/action-center.ts`, `apps/admin/app/lib/action-center.test.ts`, `apps/admin/app/components/control-plane/ActionCenterPanel.tsx`, and `apps/admin/app/components/control-plane/WorkspaceTaskTabs.tsx`.)
- [x] Continue Admin workspace decomposition by extracting `support` and `health` tab bodies plus workspace tab-metrics helper into dedicated/tested modules. (Completed 2026-02-22 via `SupportTabBody.tsx`, `PlatformHealthTabBody.tsx`, `workspace-task-metrics.ts`, and `workspace-task-metrics.test.ts`.)
- [x] Continue Admin workspace decomposition by extracting `billing`, `access`, and `audit` tab bodies into dedicated components while preserving tenant-scoped behavior. (Completed 2026-02-22 via `BillingTabBody.tsx`, `AccessTabBody.tsx`, and `AuditTabBody.tsx` plus wiring updates in `apps/admin/app/components/control-plane-workspace.tsx`.)
- [x] Implement onboarding task persistence MVP foundation + first Admin read/create integration (shared contracts, Prisma models/migration, db helpers, onboarding API routes, Launch checklist persisted read path, and Create Plan From Template action). (Completed 2026-02-22 in `packages/types/src/control-plane.ts`, `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/202602220002_add_tenant_onboarding_persistence/migration.sql`, `packages/db/src/control-plane.ts`, onboarding admin API routes, and `apps/admin/app/components/control-plane-workspace.tsx`; sandbox route tests/typecheck remained non-authoritative due `tsx` IPC and WSL filesystem constraints.)
- [x] Add persisted onboarding task mutation UI in Admin Launch checklist (status/owner/due/client-blocker updates wired to onboarding task PATCH API). (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx`; `apps/admin` typecheck passes in WSL with timeout, route-test command remains sandbox-non-authoritative due `tsx` IPC `EPERM`.)
- [x] Add onboarding plan lifecycle controls and persist onboarding-task signals into Admin Action Center/readiness/next-step guidance. (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx`, `apps/admin/app/lib/action-center.ts`, and `apps/admin/app/lib/action-center.test.ts`; Windows Admin build + Prisma migrate validation passed, Windows route-test command blocked by mixed-platform `esbuild` binary mismatch.)
- [x] Add plan-level onboarding field editing UI in Launch checklist (`targetLaunchDate`, `pauseReason`) with tenant-scoped draft/save state wired to onboarding plan PATCH API. (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx` with route coverage extension in `apps/admin/app/api/lib/routes.integration.test.ts`; WSL route tests + Admin typecheck pass.)
- [x] Implement durable onboarding task persistence in Admin control plane (schema, helpers, API routes, UI state) using the design proposal in `project_tracking/admin_onboarding_task_persistence_design.md`. (Completed 2026-02-22 across shared contracts/Prisma/db helpers/Admin onboarding routes/Launch checklist UI, including plan lifecycle + plan metadata editing + task editing + bulk actions + actor assignment + persisted onboarding signals in Action Center/readiness + server-side observability/readiness onboarding metrics.)
- [x] Surface server-side onboarding observability metrics in the Admin observability dashboard UI cards/tables (beyond backend summary + readiness integration). (Completed 2026-02-22 in `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx` with onboarding KPI cards + `Onboarding Rollout Health` panel.)
- [x] Add bulk actor assignment actions for onboarding tasks (set `ownerActorId` across selected tasks) with guardrails for role/actor mismatches. (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx` via tenant-scoped bulk actor selector/action, compatibility guardrails, and incremental task PATCH updates.)
- [x] Resolve mixed-platform `esbuild` `node_modules` state and re-run Windows-authoritative `npm run test:routes --workspace @real-estate/admin` after onboarding persistence MVP changes. (Completed 2026-02-22 via Windows `npm rebuild esbuild`; `@real-estate/admin` route tests now pass `50/50` in Windows.)
- [x] Add tenant-level onboarding metrics columns/highlights to the observability readiness scoreboard (e.g., blocked/overdue/unassigned counts per tenant) to speed operator triage. (Completed 2026-02-22 via `ControlPlaneTenantReadinessScore.onboarding` server-side metrics in `packages/db/src/control-plane.ts` and readiness scoreboard UI chips in `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx`.)
- [x] Add actor-role compatibility guidance to per-task `Owner Actor` assignment control (not only bulk flow) for consistent onboarding assignment guardrails. (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx` with compatible-actor filtering, stale/incompatible actor inline errors, and save-time validation.)
- [x] Add a combined bulk "owner role + actor" assignment action for faster onboarding triage. (Completed 2026-02-22 in `apps/admin/app/components/control-plane-workspace.tsx` using existing onboarding task PATCH API with one mutation per selected task.)
- [x] Add server-side per-tenant onboarding required-task completion counts to readiness/observability payload so the scoreboard can show progress context (not just risk counts). (Completed 2026-02-22 via `ControlPlaneTenantReadinessScore.onboarding` progress fields and server-side aggregation in `packages/db/src/control-plane.ts`, surfaced in Platform Health readiness + triage UI.)
- [x] Add route-level validation for onboarding task `ownerActorId` compatibility (if business rules should be enforced server-side, not only UI-side). (Completed 2026-02-22 by enforcing compatibility in shared DB helper `updateTenantOnboardingTask(...)` in `packages/db/src/control-plane.ts`; Admin task PATCH route surfaces helper errors and route tests cover compatibility-style error passthrough.)
- [x] Add a cross-tenant onboarding triage view/table (sort/filter by blocked/overdue/unassigned counts). (Completed 2026-02-22 in `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx` as `Onboarding Triage Queue` panel with filter/sort controls and persisted onboarding risk/progress chips.)
- [x] Add direct tests for shared DB onboarding task update compatibility enforcement (beyond route passthrough) when DB-layer test harness is available. (Completed 2026-02-22 by extracting DB compatibility matrix helper to `packages/db/src/onboarding-owner-assignment.ts` and adding direct unit coverage in `packages/db/src/onboarding-owner-assignment.test.ts`; `updateTenantOnboardingTask(...)` reuses the helper for server-side enforcement.)
- [x] Consider backend bulk onboarding task mutation endpoints if checklist sizes or operator throughput make repeated PATCH calls a bottleneck. (Completed 2026-02-23: queried local `AdminAuditEvent` telemetry publishes and found no published onboarding telemetry aggregates yet in the dev DB (`0` publishes), so the decision remains to keep repeated task PATCH orchestration and defer a dedicated bulk endpoint pending real usage evidence. Recommendation messaging/policy visibility remain in `apps/admin/app/lib/admin-usage-telemetry.ts` and `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx`.)
- [x] Add direct deep-link behavior from Platform Health triage rows to scroll/focus the Launch checklist onboarding panel (current quick action switches tenant + tab only). (Completed 2026-02-22 via `onOpenTenantLaunch` callback wiring + `#launch-onboarding-checklist` scroll/focus in `apps/admin/app/components/control-plane-workspace.tsx` and `PlatformHealthTabBody.tsx`.)
- [x] Add a lightweight Admin UI debug/inspection surface for browser-local onboarding usage telemetry (`admin-usage-telemetry.v1`) so operators/devs can review triage/bulk-action usage without DevTools. (Completed 2026-02-22 in `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx` with refresh/clear controls, event counters, recent events, bulk-action stats, and recommendation messaging.)
- [x] Decide whether any onboarding triage/bulk-action telemetry should be promoted from browser-local storage to server-side observability/audit summaries (and define retention/privacy boundaries). (Completed 2026-02-22 with an opt-in aggregate-only promotion path to Admin audit via `POST /api/observability/usage-telemetry`, explicit privacy/retention policy constants in `apps/admin/app/lib/admin-usage-telemetry.ts`, and Platform Health policy/publish UI. Raw recent events and tenant IDs are excluded from the published aggregate payload by design.)
- [x] Evaluate whether promoted telemetry should also feed server-side observability summaries (beyond audit-log persistence) and, if so, define aggregation windows/rollups. (Completed 2026-02-22 by adding `onboardingUsageTelemetry` rollup to `ControlPlaneObservabilitySummary`, aggregated from successful `tenant.observability.telemetry.publish` audit events over a 14-day window in `packages/db/src/control-plane.ts`, and surfacing it in Platform Health telemetry inspector UI.)
- [x] Revisit onboarding usage telemetry rollup window/retention alignment (currently 14-day observability rollup over audit events) and confirm it matches operator review cadence. (Completed 2026-02-23: kept the 14-day server rollup in `packages/db/src/control-plane.ts` as a biweekly window covering two weekly operator review cycles; codified cadence/rollup/retention policy metadata + alignment messaging in `apps/admin/app/lib/admin-usage-telemetry.ts` and surfaced it in `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx`.)
- [x] Tune onboarding bulk-endpoint recommendation thresholds (`ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS`) after collecting real local/published telemetry usage data. (Completed 2026-02-23: local dev DB had no published telemetry aggregates yet (`0` publishes), so thresholds were tuned conservatively to avoid premature backend expansion while reacting faster to reliability issues: `minRunsForDecision=12`, `avgSelectedWarnAt=18`, `avgDurationWarnMs=12000`, `failureRateWarnRatio=0.10`; helper coverage added in `apps/admin/app/lib/admin-usage-telemetry.test.ts`.)

## CRM Elite Overhaul (Completed 2026-02-23)
- [x] Sprint 1: State management (Zustand + React Query), Quick-Add Lead, Universal Search, Pipeline Card Density.
- [x] Sprint 2: Speed-to-Lead Timer, Floating Activity Log, Browser Push Notifications.
- [x] Sprint 3: Showing Scheduling, Commission Tracker, Voice Notes. DB models: Showing, CommissionSetting, Commission.
- [x] Sprint 4: Typography (Outfit/JetBrains Mono), Motion/Micro-interactions, DensityToggle, Color System Enhancement.
- [x] Sprint 5: Drip Campaigns, Ad Spend Tracker, Team Roster. DB models: Campaign, CampaignEnrollment, AdSpend, TeamMember.
- [x] Sprint 6: AI Workflow Panel, NL Query in CommandPalette, NotificationDigest, ForecastPanel, BenchmarkPanel.
- [x] Sprint 7: SSE Real-Time, 36 New Route Tests (89 total), DOMPurify Security, Rate Limiter, Composite DB Indexes.
- [x] Sprint 8: Client Portal (HMAC tokens), MLS Property Cards, E-Signature Panel. DB model: ESignatureRequest.
- [ ] Generate and apply Prisma migrations for 8 new models (Showing, CommissionSetting, Commission, Campaign, CampaignEnrollment, AdSpend, TeamMember, ESignatureRequest) when targeting production DB.

## CRM Lead Profile Modal Redesign (Audit 2026-02-23, Session 14 → Implemented Session 15)
- [x] Add tabbed navigation within the modal (Overview / Communication / Intelligence / Activity tabs) to break scroll-fatigue. (Completed 2026-02-23.)
- [x] Restructure "Lead + Contact Details" section into logical groups: Contact Info, Property Preferences, Follow-Up, Notes. (Completed 2026-02-23.)
- [x] Unify the three "next action" concepts (date/note fields, timeframe field, SmartReminderForm) into one clear widget. (Completed 2026-02-23.)
- [x] Move messaging tools (Templates, AI Composer, Gmail, Email History) out of "Lead Intelligence" into "Communication" tab. (Completed 2026-02-23.)
- [x] Auto-collapse AI sections behind expandable headers (like SmartReminderForm pattern). (Completed 2026-02-23 via CollapsibleSection component.)
- [x] Add "Link Contact" affordance when no contact exists (instead of just disabled fields). (Completed 2026-02-23.)
- [x] Combine Save Lead + Save Contact into a single "Save Changes" action. (Completed 2026-02-23.)
- [x] Make listing references in UnifiedTimeline clickable (opens CRM Listing Modal). (Completed 2026-02-23.)
- [x] Make Suggested Properties cards previewable (opens CRM Listing Modal). (Completed 2026-02-23.)
- [x] Add keyboard focus trap for modal accessibility. (Completed 2026-02-23.)
- [x] Replace emoji icons (📞 ✉️ 💬 📅) with consistent SVG icons. (Completed 2026-02-23.)
- [x] Increase modal padding and section gaps to reduce visual density. (Completed 2026-02-23.)
- [x] Remove redundant nested borders — use spacing/background differentiation instead of double-boxing. (Completed 2026-02-23.)
- [x] Add visual hierarchy to section headings (primary vs. secondary). (Completed 2026-02-23 via crm-modal-heading-lg/sm/label CSS classes.)
- [x] Add section-level expand/collapse for less-used sections (Voice Notes, Showings). (Completed 2026-02-23 via CollapsibleSection.)
- [x] Fix MlsPropertyCard naming/labeling — renamed to PropertyPreferences. (Completed 2026-02-23.)
- [x] Rename "Next Action" field (timeframe) to clarify its purpose — moved to Property Preferences. (Completed 2026-02-23.)

## CRM Listing Modal Integration (New Feature — Implemented 2026-02-23)
- [x] Create `CrmListingModal` wrapper in `apps/crm` using shared listing types from `packages/types/src/listings.ts`. (Completed 2026-02-23.)
- [x] Port photo gallery from `apps/web` ListingModal (no cross-app import — rewritten in CRM context). (Completed 2026-02-23.)
- [x] Replace agent branding/inquiry CTA with CRM actions: Schedule Showing, Share with Client, Add to Suggested. (Completed 2026-02-23.)
- [x] Add lead context header showing which lead is viewing this listing. (Completed 2026-02-23.)
- [ ] Add agent notes/annotations capability for listing-in-context-of-lead.
- [ ] Show listing engagement data if lead has viewed/favorited this listing.
- [x] Wire clickable listing references throughout Lead Profile Modal (timeline events, suggested properties). (Completed 2026-02-23.)
- [ ] Add "Copy Listing Link" and "Email Listing to Lead" share actions integrated with CRM communication tools.
- [ ] Tenant-scope all listing data (remove hardcoded brand images).

## Lead Profile Modal Overview Tab Upgrade (Implemented 2026-02-24)
- [x] Sprint 1: Form field fixes — Lead Type + Status side-by-side, Address full-width, Notes rows, Contact layout, $ adornments, inputMode, helper text, responsive grid.
- [x] Sprint 2: Component fixes — Link Contact feedback, SmartReminderForm hideHeader+CollapsibleSection, SVG checkmark, calendar hint, Timeframe dropdown.
- [x] Sprint 3: House Style full-stack field + PriceRangeSlider component (custom thumb drag, piecewise log scale $0-$10M+).
- [x] Sprint 4: SourceAttributionChain upgrade — SVG icons, ResizeObserver auto-fit, connecting line, tooltips, expansion panel.
- [x] Visual polish: source/status pills in header, urgency badge restyle, scale marker positioning, timeline equal spacing, contact name half-width.

## AI Roadmap
- [x] Create prompt registry and versioning. (Completed — `PROMPT_VERSIONS` registry in `packages/ai/src/prompts/crm-prompts.ts` with per-prompt version tracking.)
- [x] Implement AI Market Digest (#55) — Dashboard market analytics widget with KPI strip, narrative, highlights, and agent takeaway. Rule-based baseline + AI enhancement. (Completed 2026-02-22.)
- [x] Implement AI Listing Description Generator (#56) — Modal with property details form, tone selector (4 tones), feature chips, MLS-ready description output with copy/regenerate. Rule-based baseline + AI enhancement. (Completed 2026-02-22.)
- [x] Implement Predictive Lead Scoring (#57) — Naive Bayes conversion prediction from historical Won/Lost patterns. 9 bucketed features, Laplace smoothing, 50-lead minimum threshold, in-memory distribution cache. API route + UI widget in Lead Profile Modal. (Completed 2026-02-22.)
- [x] Implement Smart Lead Routing (#58) — Advisory agent-to-lead matching with 5 weighted factors (geo specialization, property type expertise, pipeline load, conversion rate, response time). Solo self-assessment + team ranking modes. API route + UI widget in Lead Profile Modal. (Completed 2026-02-22.)
- [x] Implement CRM AI differentiators — NL query endpoint, daily digest, AI workflow toggles, revenue forecast, performance benchmarks. (Completed 2026-02-23 as Sprint 6 of Elite Overhaul.)
- [ ] Implement AI content generation pipeline for website onboarding.
- [ ] Implement CRM next-best-action service.
- [ ] Add AI result feedback loop and quality scoring.

## Phase 10: AI Copilot (CRM-Wide Assistant)
- [ ] Design AI Copilot conversation persistence model (per-user message history, context window management, tenant-scoped storage).
- [ ] Build context assembly layer — dynamically pull relevant leads/contacts/activities/pipeline state into prompt based on user's current page and query.
- [ ] Build streaming chat UI — persistent floating panel or slide-over accessible from any CRM page, with message history and typing indicators.
- [ ] Build action execution bridge — Copilot can trigger existing CRM actions (set reminder, draft message, schedule showing, send listing, update lead status) through structured tool-use patterns.
- [ ] Build proactive suggestion engine — Copilot surfaces unprompted recommendations ("You haven't contacted Sarah in 12 days — she was actively browsing last week") based on lead signals and user activity patterns.
- [ ] Build user preference/memory layer — learns agent workflow patterns over time (preferred communication channels, follow-up cadence, working hours) to personalize suggestions.
- [ ] Integrate with existing `packages/ai` infrastructure (prompt registry, LLM client, orchestration modules) — Copilot consumes the same next-action, lead-intelligence, message-drafting, and escalation engines already built.
- [ ] Add Google Calendar integration (OAuth consent flow for calendar read/write scope, real-time reminder sync, availability-aware scheduling suggestions).
- **LLM**: 3rd-party model (Claude Sonnet 4.6 via Anthropic API) — not a custom-trained model. All prompts versioned in `packages/ai` prompt registry.
- **Dependencies**: Requires CRM Lead Modal polish completion, existing AI module stabilization, and Google OAuth integration.

## Business / GTM
- [x] Define plan matrix (Starter/Growth/Pro/Team). (Completed 2026-02-20 in `.brain/PRODUCT_SPEC.md` section `5.1` with canonical control-plane plan mapping, pricing targets, and commercial constraints.)
- [x] Define setup package scope and onboarding SLAs. (Completed 2026-02-20 in `.brain/PRODUCT_SPEC.md` section `5.2` with deliverable scope, 15-business-day onboarding timeline, and SLA pause/change-order rules.)
- [x] Define managed services add-ons and operational model. (Completed 2026-02-20 in `.brain/PRODUCT_SPEC.md` section `5.3` with add-on catalog, pod staffing ratios, cadence, contract minimums, and fulfillment SLAs.)

## Portal UI/UX Integration (Section 2 of Integration Plan)
- [x] Port Cormorant Garamond typography from agent website to portal (replace Playfair Display). (Completed 2026-03-01 in `apps/portal/src/app/layout.tsx`.)
- [x] Adopt stone warm-neutral palette across portal (replace blue/teal). (Completed 2026-03-01 in `apps/portal/tailwind.config.js` + `apps/portal/src/app/globals.css`.)
- [x] Restyle SiteHeader to match agent website (stone colors, uppercase tracking nav, scroll-responsive). (Completed 2026-03-01 in `apps/portal/src/components/layout/SiteHeader.tsx`.)
- [x] Redesign portal homepage (stone-900 hero, warm feature cards, new CTA + footer). (Completed 2026-03-01 in `apps/portal/src/app/page.tsx`.)
- [x] Restyle PropertyCard (rounded-2xl, emerald/amber/rose status badges, stone palette). (Completed 2026-03-01 in `apps/portal/src/components/PropertyCard.tsx`.)
- [x] Restyle PropertyDetailModal (stone palette, rounded-2xl, keep multi-tab structure). (Completed 2026-03-01 in `apps/portal/src/components/PropertyDetailModal.tsx`.)
- [x] Restyle ParcelDetailModal (stone palette, rounded-2xl, keep multi-tab structure). (Completed 2026-03-01 in `apps/portal/src/components/ParcelDetailModal.tsx`.)
- [x] Bulk-replace remaining old colors across all 60+ portal files (gray→stone, blue→stone, green→emerald). (Completed 2026-03-01 via Node.js bulk replacement script.)
- [ ] **Deep redesign of portal properties page** (`apps/portal/src/app/properties/page.tsx`) — layout, interactions, and visual polish to match agent website home-search page quality. Session 24 applied colors but the page structure/UX is not yet competitive. **TOP PRIORITY for next session.**
- [ ] Extract shared design tokens FROM agent website (`apps/web`) styles INTO `packages/design-tokens` for portal consumption. Design direction: agent website is the source of truth; portal adopts its patterns. Do NOT modify the agent website home-search page.
- [ ] Upgrade portal from Tailwind CSS v3 to v4 to standardize with SAAS platform.
- [ ] Build shared UI component library in `packages/ui` for portal/CRM visual parity (buttons, cards, modals).

## Portal Property Detail Modal — Tier 1 & 2 Sprint (2026-03-03)
> Full plan: `.brain/PORTAL_DETAIL_MODAL_SPRINT.md`

- [ ] **[P0] Accurate Property Tax + Payment Breakdown Visualization** — CT mill rate lookup for off-market tax calculation, tax display in Property Details, SVG donut payment breakdown in MortgageCalculator. (Phase A)
- [ ] **[P1] Photo Mosaic Grid + Performance Optimization** — Zillow-style 1+4 mosaic layout, `quality` props, image domain whitelist, lazy thumbnails, `onError` fallback. (Phase B)
- [ ] **[P1] Sticky Header on Scroll** — Compact fixed header with address/price/stats/actions when price bar scrolls out of view. (Phase C)
- [ ] **[P1] Share Button** — Copy link / email / SMS dropdown next to heart button. (Phase C)
- [ ] **[P2] Price Change Indicator** — Badge showing price reduction/increase when `listPrice !== originalListPrice`. (Phase C)
- [ ] **[P3] Walk Score Coming Soon** — Placeholder card in Neighborhood section. (Phase D)
- [ ] **[P3] Climate Risk Coming Soon** — Placeholder card in Neighborhood section. (Phase D)
- [ ] **[P2] Listing Activity / Interest Badge** — "New"/"Popular"/"Hot" badges with backend `property_views` analytics tracking. (Phase E)
- [ ] **[P3] Print / PDF Export** — Print-optimized layout via `@media print` CSS with DoorTag branding and QR code. (Phase F)
- [ ] **[P2] Property Comparison Tool** — 2-4 property side-by-side comparison with persistent footer bar and localStorage state. (Phase G)

## Portal Long-Term Roadmap (Tier 3)
- [ ] **AI Property Chatbot** — Conversational AI Q&A on individual properties. *Prerequisite: vector DB (pgvector) + multi-turn AI search infrastructure.*
- [ ] **AI Property Insight Chips** — AI-generated contextual badges ("Great for families", "Below market value"). *Prerequisite: vector DB embeddings + property description analysis.*
- [ ] **Market Temperature Badge** — Real-time market heat indicator per property (hot/warm/cold) based on DOM, inventory, and price trends.
- [ ] **Offer Strength Calculator** — Estimate competitiveness of a given offer based on market conditions, comparable sales, and listing activity.
- [ ] **Expected Proceeds Calculator (Off-Market)** — Zillow-style estimated net proceeds showing AVM value minus estimated closing costs, agent commissions, and estimated remaining loan balance.
- [ ] **"Similar Homes" Retrieval** — Vector-nearest-neighbor property recommendations bounded by structured filters (town, price band, beds).
- [ ] **AI "Why You'll Love This Home" Descriptions** — Personalized property descriptions based on user search history and preferences.
- [ ] **Hybrid Ranking + "Why Matched" Transparency** — Expose semantic match reasons as chips on search result cards.

## Portal Properties Page Performance Follow-Through (2026-03-03)
- [x] Add viewport-shift gating + buffered bbox fetches on properties map pan/zoom to reduce redundant parcel/listing map requests.
- [x] Stop cross-viewport context listing marker accumulation and cap deduped context listings to prevent progressive marker bloat.
- [x] Deduplicate combined map parcel payload (`searchResults` + `listingMarkers` + `mapParcels`) by `parcel_id` before rendering.
- [x] Memoize `LeafletParcelMap` render path (`React.memo`) and cache marker icon objects to reduce rerender CPU cost during map navigation.
- [x] Remove manual Leaflet `map.remove()` calls in portal map components to fix "Map container is being reused by another instance" runtime crash.
- [ ] Run authoritative browser-level smoke/perf check on host runtime after this pass (rapid pan/zoom, zoom 10-18 transitions, map + modal interactions) and capture any remaining hotspots.

## Property Detail Modal Performance Follow-Through (2026-03-03)
- [x] Convert heavy modal subsections to dynamic imports (`next/dynamic`) to reduce initial modal JS/mount pressure.
- [x] Add shared modal section loading fallback component (`SectionLoadingState`) and reuse it across deferred section mounts.
- [x] Add delayed post-open chunk preloading (`component.preload?.()`) for market/neighborhood subsections to smooth scroll-to-section transitions.
- [x] Optimize parcel-first modal fetch path to render base parcel data immediately and run listing enrichment asynchronously (reduces off-market first-open blocking latency).
- [x] Extract modal data-fetch + normalization logic into dedicated hook (`usePropertyModalData`) with shared `PropertyData`/`AvmData` types.
- [x] Add short-lived modal client cache (listing/parcel/AVM, 2-minute TTL) to reduce repeat-open fetch latency.
- [ ] Continue file decomposition of `PropertyDetailModal.tsx` (extract Overview/Details/Market/Neighborhood section renderers into separate files) while preserving current UX behavior.

## Properties Map Interaction Tuning (2026-03-03)
- [x] Replace blocking map loading overlay with non-blocking compact indicator.
- [x] Delay loader activation for viewport fetches to avoid spinner flicker on fast requests.
- [x] Suppress loader during zoom 10-14 listing-only context refreshes.
- [x] Extract map viewport/fetch lifecycle into `useMapViewportFetch` hook to isolate fetch dedupe/abort/loader/viewport-gating behavior from page rendering code.
- [ ] Re-run browser interaction validation (rapid zoom in/out + pan) and capture whether remaining lag is render-bound vs network-bound.

## Properties Page Refactor Follow-Through (2026-03-03)
- [ ] Extract standard property search fetch flow from `apps/portal/src/app/properties/page.tsx` into `usePropertySearch` hook.
- [ ] Extract AI search/rerun filter flow into `useAiSearch` hook.
- [ ] Keep behavior parity while reducing `properties/page.tsx` size and coupling.

## Later
- [ ] Team and brokerage hierarchy model.
- [ ] Marketing attribution dashboard.
- [ ] Listing portal pilot and feasibility analysis.

## Agent Website 4-Phase Roadmap (Canonical Plan Added 2026-03-04)
- [x] Create and save a canonical implementation roadmap for `apps/web` at `project_tracking/agent_website_implementation_roadmap.md`.
- [x] Phase 1 / Security + Stability: add API abuse controls for website public write routes (`/api/lead`, `/api/valuation`, `/api/website-events`). (Completed 2026-03-04 via shared guard utility `apps/web/app/lib/api-security.ts` + route wiring.)
- [x] Phase 1 / Security + Stability: remove plaintext PII logging from website APIs and enforce redacted structured logs. (Completed 2026-03-04 in `/api/lead` and `/api/valuation`.)
- [x] Phase 1 / Security + Stability: standardize website event payload validation via Zod schema (`WebsiteEventRequestSchema`) and remove ad-hoc manual payload checks. (Completed 2026-03-04 in `apps/web/app/lib/validators.ts` + `apps/web/app/api/website-events/route.ts`.)
- [x] Phase 1 / Security + Stability: remove transitional tenant profile fallback query pattern (`!defined(tenantId)`), enforce strict tenant scoping, and backfill legacy docs. (Completed 2026-03-04 via strict tenant lookups + on-access legacy migration helper `apps/web/app/lib/user-profile.ts`.)
- [x] Phase 1 / Security + Stability: restore green website quality baseline (`apps/web` typecheck + lint). (Completed 2026-03-04: `npx tsc --noEmit --project apps/web/tsconfig.json` pass; `npm run lint --workspace @real-estate/web` pass with warnings only.)
- [x] Phase 1 / Security + Stability: add app-level security headers policy for deployed website environments. (Completed 2026-03-04 in `apps/web/proxy.ts`.)
- [x] Phase 1 / Security + Stability: add env validation/fail-fast checks for required website API runtime settings. (Completed 2026-03-04 via `apps/web/app/lib/runtime-env.ts` + proxy fail-fast response path.)
- [x] Phase 2 / Performance + Speed: reduce broad `force-dynamic` usage and implement route-appropriate caching/revalidation. (Completed 2026-03-04 by replacing `force-dynamic` with `revalidate` windows on homepage/towns index/insights/sitemap; retained dynamic on tenant-header-dependent town/neighborhood detail pages.)
- [x] Phase 2 / Performance + Speed: optimize home-search map runtime and reduce modal first-open latency while preserving current UI/UX. (Completed 2026-03-04 in `apps/web/app/home-search/*`: removed per-marker map listeners, memoized map render path, deduped bounds updates, dynamic-loaded `ListingModal` with idle/card-hover prefetch, and stale-search response guards.)
- [x] Phase 2 / Performance + Speed: add cached query layer for Sanity/content fetches with explicit invalidation strategy. (Completed 2026-03-04 via `apps/web/app/lib/sanity.cache.ts`, cached query wiring in `apps/web/app/lib/sanity.queries.ts`, and token-protected `POST /api/sanity/revalidate` endpoint.)
- [x] Phase 2 / Performance + Speed: enable Sanity CDN for eligible public read paths. (Completed 2026-03-04 in `apps/web/app/lib/sanity.client.ts` with production-default CDN behavior and `NEXT_PUBLIC_SANITY_USE_CDN` override.)
- [x] Phase 2 / Performance + Speed: add lightweight home-search timing instrumentation for ongoing tuning. (Completed 2026-03-04 via dev-only `console.info` traces for search duration and first modal-open mount latency in `HomeSearchClient.tsx`.)
- [x] Phase 2 / Performance + Speed: decompose `HomeSearchClient` orchestration into focused modules/hooks (URL state + results orchestration) while preserving UI behavior. (Completed 2026-03-04 via `app/home-search/lib/search-url-state.ts` and `app/home-search/hooks/useHomeSearchResults.ts`.)
- [x] Phase 2 / Performance + Speed: introduce listings provider abstraction to support clean mock-to-IDX cutover. (Completed 2026-03-04 via provider contract expansion (`getListingsByIds`, `listNeighborhoods`), provider selection boundary (`NEXT_PUBLIC_LISTINGS_PROVIDER`), and removal of direct mock-data reads from `HomeSearchClient`.)
- [x] Phase 3 / Multi-Tenant Productization: replace hardcoded single-agent branding/content in shell + core sections with tenant-driven configuration. (Completed 2026-03-04 via tenant website config contract + profile resolver and shell wiring in `layout`, `Header`, `GlobalFooter`, homepage intro/CTA, and home-search/listing inquiry CTA paths.)
- [x] Phase 3 / Multi-Tenant Productization: enforce tenant-owned content scoping (`town`, `neighborhood`, `post`, `userProfile`) and migrate existing content. (Completed 2026-03-04: tenant fields added to Studio schemas + tenant-filtered query boundaries in `apps/web/app/lib/sanity.queries.ts`; authoritative dry-run validated and apply execution patched `97` docs via `apps/web/scripts/backfill-sanity-tenant-content.ts`.)
- [x] Phase 3 / Multi-Tenant Productization: add tenant onboarding seed/template flow for new agent website launches. (Completed 2026-03-04 via per-tenant config registry split in `apps/web/app/lib/tenant/configs/*` and scaffolder command `npm run tenant:onboard:scaffold --workspace @real-estate/web` to generate tenant profile + provisioning/backfill artifacts.)
- [x] Phase 3 / Multi-Tenant Productization: document future enterprise isolation mode (optional dedicated Sanity dataset/project per tenant) and decision gates. (Completed 2026-03-04 via `project_tracking/agent_website_enterprise_isolation_mode.md`.)
- [x] Phase 4 / Maintainability + Launch Ops: complete decomposition of large `apps/web` files and remove duplicate/dead code paths. (Completed 2026-03-04 via `HomeSearchClient` extraction to `SearchToolbar`/`ResultsSidebar` plus warning-driven cleanup.)
- [x] Phase 4 / Maintainability + Launch Ops: add smoke/perf regression checks and environment-gated SEO launch controls. (Completed 2026-03-04 via `apps/web/tests/smoke/*`, `apps/web/tests/perf/*`, `apps/web/app/lib/seo/runtime.ts`, `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`, and `apps/web/app/layout.tsx` metadata gating.)
- [x] Keep roadmap status synchronized in `project_tracking/agent_website_implementation_roadmap.md` as tasks move from planned to done. (Updated 2026-03-04: Phases 3 and 4 marked `Done`.)
- [x] Post-roadmap: add secure IDX bridge execution path (server-only credentials, `/api/listings/provider` proxy, provider contract wiring) for mock-to-live cutover. (Completed 2026-03-05.)
- [x] Post-roadmap: add SEO/AEO AI-discovery surfaces (`/llms.txt`, `/.well-known/llms.txt`, `/.well-known/llm.json`, `/api/content/*.md`) and wire robots/sitemap allowances. (Completed 2026-03-05.)
- [x] Post-roadmap: validate `apps/web` quality/build gates in authoritative runtimes (`npm run check`, host Windows `npm run build`). (Completed 2026-03-05.)
- [x] Post-roadmap: run local runtime HTTP smoke for SEO/AEO endpoints (`robots`, `sitemap`, `llms`, markdown extraction, `home-search`) and fix broken town endpoint path to `/api/content/towns/{townSlug}`. (Completed 2026-03-05.)
- [x] Post-roadmap: add reusable launch verification scripts (`verify:seo-aeo`, `verify:idx-provider`) and validate local execution paths. (Completed 2026-03-05.)
- [ ] Post-roadmap: run staging runtime verification for IDX bridge behavior and AI discovery endpoints with production-like env values.
- [ ] Post-roadmap: complete production launch-gate approvals (`SEO_ENABLE_INDEXING`, `SEO_METADATA_BASE_URL`, monitoring/rollback owner assignment).
