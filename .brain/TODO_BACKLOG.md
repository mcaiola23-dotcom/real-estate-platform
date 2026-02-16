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
- [ ] Identify and implement one additional mitigation for persistent Windows Prisma engine rename lock when direct generation repeatedly fails (`query_engine-windows.dll.node` EPERM), then re-run reliability sample to verify improved full-engine success rate.

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

