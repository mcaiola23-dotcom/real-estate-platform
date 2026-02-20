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
- [ ] Continue periodic Windows reliability sampling (10+ attempts) after restarts/environment changes and track pass/fail trend in `.brain/CURRENT_FOCUS.md`. (Latest 2026-02-20 Windows-authoritative sample after mitigation pass: `12/12` pass, `0` `EPERM` lock failures.)
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
- [ ] Add billing drift reporting summary surface (recent drift counts/modes per tenant) to extend operator visibility beyond per-event triage.
- [ ] Run a final manual local browser click-through for CRM (desktop + smaller laptop viewport) to close the remaining post-polish validation gap after current admin-priority work. (Deferred per product-direction override on 2026-02-20 until additional CRM UI/UX improvements are completed; sandbox remains non-authoritative for local runtime bind checks.)

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

## AI Roadmap
- [ ] Create prompt registry and versioning.
- [ ] Implement AI content generation pipeline for website onboarding.
- [ ] Implement CRM next-best-action service.
- [ ] Add AI result feedback loop and quality scoring.

## Business / GTM
- [ ] Define plan matrix (Starter/Growth/Pro/Team).
- [ ] Define setup package scope and onboarding SLAs.
- [ ] Define managed services add-ons and operational model.

## Later
- [ ] Team and brokerage hierarchy model.
- [ ] Marketing attribution dashboard.
- [ ] Listing portal pilot and feasibility analysis.

