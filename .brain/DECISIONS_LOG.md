# DECISIONS_LOG

## 2026-02-11
### D-001: Use monorepo structure for platform expansion
**Decision**: Adopt parent repository `real-estate-platform` with `apps/`, `packages/`, `services/`, `infra/`, and `docs/brain`.
**Reason**: Enables shared code/contracts while keeping deployable boundaries.

### D-002: Preserve current Fairfield codebase as immutable baseline
**Decision**: Keep existing website folder unchanged; migrate by clone/copy into new monorepo.
**Reason**: Reduces delivery risk and preserves working prototype continuity.

### D-003: Build tenant-aware runtime before broad CRM/portal expansion
**Decision**: Prioritize tenant/domain resolution and config-driven website rendering.
**Reason**: This is foundational to serving multiple customer domains.

### D-004: AI is core product capability, not a bolt-on
**Decision**: Establish dedicated `packages/ai` and AI observability from early phases.
**Reason**: AI-driven site generation and CRM recommendations are strategic differentiators.

## 2026-02-12
### D-005: Resolve tenant at the web edge and stamp tenant headers
**Decision**: Add host-based tenant resolution in `apps/web/proxy.ts` and attach `x-tenant-*` headers to every matched request.
**Reason**: Establishes tenant context early for downstream APIs/data access and provides deterministic behavior for localhost development.

### D-006: Consume tenant context in active web capture endpoints
**Decision**: Update `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts` to read tenant context from request headers (with resolver fallback).
**Reason**: Keeps tenant scope explicit where lead/event data first enters backend logic and reduces cross-tenant data risk during transition.

### D-007: Standardize root workspace orchestration for monorepo workflows
**Decision**: Add a root `package.json` with npm workspaces (`apps/*`, `packages/*`, `services/*`) and top-level scripts for `dev`, `build`, and `lint` targeting `@real-estate/web` and `@real-estate/studio`; rename app package names to those unique workspace identifiers.
**Reason**: Establishes a single command surface for multi-app development and unblocks shared package adoption without app-to-app coupling.

### D-008: Establish `@real-estate/types` as the shared contract source
**Decision**: Create `packages/types` with tenant/domain contracts and versioned website event contracts; migrate active tenant resolution typing in `apps/web` to import from `@real-estate/types`.
**Reason**: Centralized contracts reduce type drift across apps/services and provide a consistent base for tenant persistence and CRM event ingestion work.

### D-009: Route tenant host resolution through shared db package lookups
**Decision**: Introduce `packages/db` with seed-backed `Tenant`/`TenantDomain` records and lookup utilities, then refactor `apps/web/app/lib/tenant/resolve-tenant.ts` to resolve tenants via `@real-estate/db/tenants` instead of local in-memory host maps.
**Reason**: Keeps tenant/domain data access in a shared persistence boundary and creates a direct migration path to durable storage without reworking web runtime resolution logic.

### D-010: Tenant-scope user profile APIs and provider cache keys
**Decision**: Update `apps/web/app/api/user/profile/route.ts` and `apps/web/app/api/user/sync/route.ts` to read tenant context from request headers and scope user profile reads/writes by `tenantId`; update `walkscore` and `googlePlaces` provider cache variants to include tenant identifiers and pass tenant context from town pages via server headers.
**Reason**: Prevents cross-tenant user/profile collisions and shared cached data leakage as multiple tenant domains are introduced.

### D-011: Require explicit tenant context in remaining static/client provider interfaces
**Decision**: Add a shared `TenantScope` type for provider boundaries and update `atAGlance`, `taxes`, `schools`, and `listings` provider signatures (plus key module/page call sites including `home-search`) to accept explicit tenant context parameters instead of relying on implicit single-tenant assumptions.
**Reason**: Keeps tenant scoping explicit at API/provider boundaries across both server and client execution paths, reducing accidental cross-tenant coupling during future provider swaps (e.g., real IDX or tenant-specific content feeds).

### D-012: Pin Turbopack monorepo root and external workspace imports in `apps/web`
**Decision**: Configure `apps/web/next.config.ts` with `experimental.externalDir: true` and explicit `turbopack.root` to the monorepo root.
**Reason**: Prevents unstable workspace resolution and module-not-found failures when importing shared packages (`@real-estate/db`, `@real-estate/types`) from middleware and runtime code during local development.

### D-013: Add durable tenant/domain persistence scaffolding with runtime-safe resolver fallback
**Decision**: Add Prisma-based durable storage scaffolding in `packages/db` (`prisma/schema.prisma`, initial migration SQL, and seed workflow) and refactor tenant lookup utilities to prefer durable lookups in Node runtime while retaining seed fallback in edge/runtime-constrained contexts.
**Reason**: Establishes a migration-backed persistence path for `Tenant`/`TenantDomain` without breaking edge tenant resolution in `apps/web/proxy.ts`, where direct Node DB clients are not reliably available.

### D-014: Standardize local tenant DB materialization with Prisma generate/deploy/seed workflow
**Decision**: Use `npm install` at root, then run `db:generate`, `db:migrate:deploy`, and `db:seed` scripts in `@real-estate/db` with `DATABASE_URL` explicitly targeting the package-local SQLite file (`packages/db/prisma/dev.db`) for local tenant persistence setup.
**Reason**: Provides a deterministic and repeatable local bootstrap path for durable `Tenant`/`TenantDomain` storage and keeps runtime lookups aligned with migration-managed schema state.

### D-015: Model website/module tenant controls in shared contracts, db schema, and web page registry
**Decision**: Add shared `WebsiteConfig`/`ModuleConfig` contracts in `packages/types`, add Prisma models + migration for `WebsiteConfig` and `ModuleConfig` in `packages/db`, and add tenant module toggle consumption in `apps/web` town/neighborhood pages through a shared server helper (`app/lib/modules/tenant-modules.ts`).
**Reason**: Makes module visibility tenant-configurable through shared package boundaries and keeps module gating deterministic and tenant-scoped as the web runtime transitions to configurable SaaS behavior.

### D-016: Switch db seeding to SQL execution for runtime-agnostic local bootstrap
**Decision**: Change `@real-estate/db` `db:seed` from Node Prisma client script to CLI SQL execution (`prisma db execute --file prisma/seed.sql`) and keep Prisma client generation optional for runtime lookups.
**Reason**: Avoids Node module interop/runtime coupling in seed flow and provides a deterministic seed path even when Prisma client generation is blocked by local Windows file locking.

### D-017: Fail open to seed-backed tenant/module records when Prisma runtime queries fail
**Decision**: Add defensive fallback behavior in `packages/db` tenant/module lookup paths (`tenants.ts`, `website-config.ts`, and shared `prisma-client` URL resolution) so runtime query/init failures return seed-backed tenant and module records instead of throwing.
**Reason**: Prevents frontend/server page crashes from local Prisma runtime instability (e.g., invalid DB path or engine lock issues) and preserves deterministic tenant-isolated behavior while durable DB tooling is stabilized.

## 2026-02-13
### D-018: Establish tenant-aware CRM runtime skeleton with protected auth boundary
**Decision**: Scaffold apps/crm as a Next.js workspace app with monorepo-aware config, host-based tenant resolution/header stamping in apps/crm/proxy.ts, protected Clerk middleware routes (public sign-in/sign-up/health), and initial auth session API scaffolding in apps/crm/app/api/session/route.ts.
**Reason**: Creates the minimum CRM runtime foundation needed for tenant-isolated lead/contact/activity development while keeping auth and tenant context enforcement aligned with shared package boundaries from day one.

### D-019: Add CRM core relational model in shared db package
**Decision**: Extend `packages/db/prisma/schema.prisma` with tenant-scoped `Contact`, `Lead`, `Activity`, and `IngestedEvent` models and apply migration `202602130001_add_crm_core_models`.
**Reason**: Provides durable CRM primitives for lead lifecycle tracking and activity history while preserving strict tenant isolation at the persistence layer.

### D-020: Ingest website lead/valuation events directly into CRM persistence with idempotency keying
**Decision**: Add shared ingestion helpers in `packages/db/src/crm.ts` and wire `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts` to call `ingestWebsiteEvent`, recording deduplicated `IngestedEvent` records plus derived `Lead`/`Activity` (and `Contact` when available).
**Reason**: Establishes an operational website-to-CRM data path immediately, with deterministic idempotency and tenant scoping, before introducing a separate worker/queue layer.

### D-021: Replace fragile direct Prisma generate with safe wrapper for Windows lock conditions
**Decision**: Change `@real-estate/db` `db:generate` to `packages/db/scripts/db-generate-safe.mjs` that retries after engine artifact cleanup and falls back gracefully when Windows DLL lock conditions (`EPERM`) persist; keep `db:generate:direct` for explicit full-engine attempts.
**Reason**: Improves day-to-day reliability of local schema/client generation in this Windows environment while preserving a direct command path for full engine regeneration.

### D-022: Expose CRM operations through tenant-scoped API routes backed by shared db helpers
**Decision**: Add authenticated CRM API routes in `apps/crm/app/api` for lead listing/status updates, contact listing/creation, and activity listing/logging; extend `packages/db/src/crm.ts` with tenant-scoped list/mutation helpers used by those routes and the CRM dashboard UI modules.
**Reason**: Moves CRM runtime beyond scaffold state into an operational baseline while preserving tenant isolation and shared package boundaries (no app-to-app private coupling).

### D-023: Decouple website ingestion path with queue-first contract and worker drain boundary
**Decision**: Replace direct web->CRM persistence writes with queue enqueue in `apps/web` API routes via `enqueueWebsiteEvent`, add `IngestionQueueJob` model/migration (`202602130002_add_ingestion_queue_jobs`), and introduce worker-side queue processing via `processWebsiteEventQueueBatch` with `services/ingestion-worker`.
**Reason**: Removes synchronous CRM table write coupling from website request latency path and establishes a clear worker boundary for retries/scaling.

### D-024: Migrate Prisma package config to `prisma.config.ts`
**Decision**: Add `packages/db/prisma.config.ts` and remove deprecated `package.json#prisma` configuration from `@real-estate/db`.
**Reason**: Aligns with Prisma’s forward path before Prisma 7 and keeps schema/migration/seed config centralized in dedicated Prisma config.

### D-025: Standardize CRM list endpoint query parsing with shared parser + pagination metadata
**Decision**: Add route query parser utilities in `apps/crm/app/api/lib/query-params.ts`, expand lead/contact/activity list filters and `limit`/`offset`, and return pagination metadata from CRM list APIs; add node:test coverage for parser validation.
**Reason**: Keeps route-level input handling deterministic and testable while enabling incremental CRM module growth without ad-hoc query parsing in each route.

### D-026: Add scheduled retries and explicit dead-letter lifecycle to ingestion queue jobs
**Decision**: Extend `IngestionQueueJob` with `nextAttemptAt` and `deadLetteredAt`, add migration `202602130003_add_ingestion_retry_dead_letter`, and update worker batch processing to only pick due jobs, retry with staged backoff cadence, and move terminal failures/invalid payloads to `dead_letter`.
**Reason**: Improves ingestion reliability semantics and creates deterministic separation between retriable failures and terminal dead-letter outcomes.

### D-027: Treat no-engine Prisma generation as unsupported for local ingestion runtime scripts
**Decision**: Add Prisma runtime readiness checks in `packages/db/src/prisma-client.ts` and require worker/check scripts to fail fast with explicit guidance when local Prisma client is generated in no-engine mode.
**Reason**: Prevents ambiguous runtime failures (`P6001` datasource protocol errors) and makes local operational requirements explicit until Windows full-engine generation is stable.

### D-028: Expose dead-letter queue operations through shared db helpers + worker commands
**Decision**: Add dead-letter list/requeue helpers in `packages/db/src/crm.ts` and wire operational commands in `services/ingestion-worker` (`dead-letter:list`, `dead-letter:requeue`) with root script aliases.
**Reason**: Provides a deterministic operator workflow to inspect and re-drive dead-lettered ingestion jobs without ad-hoc DB manipulation.

### D-029: Generate Prisma client to package-local output to reduce Windows engine lock contention
**Decision**: Configure Prisma client generation output to `packages/db/generated/prisma-client` and update runtime loading/engine checks in `packages/db/src/prisma-client.ts` plus cleanup targets in `packages/db/scripts/db-generate-safe.mjs` to prioritize that path.
**Reason**: Avoids shared `node_modules/.prisma/client` engine artifact collisions that were causing intermittent Windows `EPERM` rename locks during full-engine generation.

### D-030: Validate Prisma ingestion operations from Windows-native shell in this repo setup
**Decision**: Run Prisma full-engine generation and ingestion worker validation commands via Windows `cmd.exe` with explicit `DATABASE_URL=file:C:/.../packages/db/prisma/dev.db` when working from this mixed WSL/Windows environment.
**Reason**: Linux-shell execution on the Windows-mounted workspace attempted Linux engine refresh paths and hit filesystem/network sandbox constraints, while Windows-native execution successfully generated engine-backed client and ran ingestion tooling end-to-end.

### D-031: Make CRM route handlers dependency-injectable for deterministic route-level tests
**Decision**: Refactor CRM API handlers (`leads`, `contacts`, `activities`, `leads/[leadId]`) to export `create*Handler` factories with default production dependencies, then add `apps/crm/app/api/lib/routes.integration.test.ts` to exercise auth/tenant guards, payload validation, pagination responses, and lead status activity side effects.
**Reason**: Enables reliable route behavior testing without brittle module mocking while preserving current runtime behavior through default dependency wiring.

### D-032: Extend ingestion integration script to cover dead-letter and requeue lifecycle
**Decision**: Update `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` to enqueue an intentionally invalid website event, assert dead-letter placement with `invalid_payload`, requeue the dead-letter job, and assert it dead-letters again on reprocessing.
**Reason**: Provides deterministic end-to-end validation for operator dead-letter flows (not just happy-path enqueue->process persistence), reducing regression risk in ingestion reliability behavior.

### D-033: Add explicit CRM activity mutation failure coverage for tenant-scoped linkage validation
**Decision**: Extend `apps/crm/app/api/lib/routes.integration.test.ts` with activity POST cases that send lead/contact IDs and assert 400 responses when `createActivityForTenant` rejects tenant-scoped linkage.
**Reason**: Makes tenant-isolation failure behavior explicit at route level for activity mutations and prevents regressions where invalid cross-tenant IDs could be handled inconsistently.

### D-034: Add queue job inspection/scheduling helpers to support deterministic retry cadence integration coverage
**Decision**: Add `getIngestionQueueJobById` and `scheduleIngestionQueueJobNow` in `packages/db/src/crm.ts`, and extend `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` to assert retry requeue behavior, `nextAttemptAt` gating, and attempt count progression across repeated failures.
**Reason**: Enables stable integration verification of retry/backoff transitions without depending on wall-clock wait times, while keeping queue behavior observable and operator-friendly.

### D-035: Extend ingestion integration coverage to assert dead-letter transition at max retry attempts
**Decision**: Update `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` to force retry attempts 3-5 on a deterministic `ingestion_failed` fixture and assert final queue state (`status=dead_letter`, `attemptCount=5`, `deadLetteredAt` set, `lastError=ingestion_failed`).
**Reason**: Closes the reliability-test gap between retry/backoff behavior and terminal dead-letter semantics, ensuring max-attempt transition logic remains correct across future changes.

### D-036: Add command-level dead-letter operator integration script with isolated tenant fixture
**Decision**: Add `services/ingestion-worker/scripts/test-dead-letter-commands.ts` and script entry `test:dead-letter-commands`, creating an isolated temporary tenant fixture to validate `dead-letter:list`, single-job `dead-letter:requeue` (`INGESTION_DEAD_LETTER_JOB_ID`), and tenant-filtered batch requeue (`INGESTION_DEAD_LETTER_TENANT_ID`) command flows end-to-end.
**Reason**: Provides deterministic command-surface validation for operator tooling without mutating shared tenant data, and verifies env-driven command branches beyond function-level helpers.

### D-037: Validate ingestion payloads before transactional processing to suppress expected error noise
**Decision**: Add explicit runtime payload validation guards in `packages/db/src/crm.ts` for `website.lead.submitted` and `website.valuation.requested` events before calling `resolveOrCreateContact`/transaction logic, returning deterministic ingestion failure results for malformed payloads.
**Reason**: Prevents repeated stack-trace logging for intentionally malformed test fixtures while preserving retry/dead-letter semantics and improving signal quality in ingestion test output.

### D-038: Add optional JSON-mode output contract for dead-letter operator commands
**Decision**: Extend `services/ingestion-worker/scripts/dead-letter-list.ts` and `services/ingestion-worker/scripts/dead-letter-requeue.ts` with env-flagged JSON output (`INGESTION_OUTPUT_JSON=1`) and event-labeled payload envelopes, then assert response shape in `services/ingestion-worker/scripts/test-dead-letter-commands.ts`.
**Reason**: Creates a stable machine-readable command output surface for operational tooling integrations while retaining human-readable default output.

### D-039: Align malformed valuation payload semantics with malformed lead payload retry/dead-letter behavior
**Decision**: Extend `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` to enqueue malformed `website.valuation.requested` payloads and assert identical queue lifecycle semantics: initial requeue with `ingestion_failed`, repeated forced retries, and terminal `dead_letter` transition at attempt 5.
**Reason**: Ensures ingestion reliability behavior is consistent across website event types and prevents divergence between lead and valuation failure handling paths.

### D-040: Use temporary tenant fixture + guaranteed cleanup in ingestion integration flow
**Decision**: Refactor `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` to create a run-scoped tenant/domain fixture (`tenant_ingestion_<runId>`) and clean it up in `finally` via cascading tenant delete.
**Reason**: Prevents ongoing growth of shared tenant fixture data across local test runs, improves baseline determinism (`before` starts at zero), and reduces cross-run coupling in integration assertions.

### D-041: Centralize ingestion integration fixture/retry helpers and enforce cleanup assertions
**Decision**: Add `services/ingestion-worker/scripts/test-helpers.ts` for reusable tenant fixture lifecycle setup/cleanup and forced queue retry progression, then refactor `test-enqueue-worker-flow.ts` and `test-dead-letter-commands.ts` to consume those helpers with explicit post-cleanup assertions that tenant and domain rows are removed.
**Reason**: Reduces repeated test boilerplate while preserving explicit reliability assertions, and makes test isolation guarantees verifiable in every run.

### D-042: Move delivery focus to Control Plane MVP while keeping critical reliability guardrails
**Decision**: Prioritize implementation of `apps/admin` + shared control-plane provisioning/domain/settings flows next, and constrain additional CRM/ingestion hardening to blocking or production-critical gaps (tenant isolation, auth/RBAC boundaries, ingestion operability).
**Reason**: Foundation reliability is now sufficient to unblock broader platform delivery; continuing reliability-first iteration without control-plane progress creates roadmap drift away from production-ready platform goals.

### D-043: Model tenant plan/feature control-plane settings in dedicated persistence boundary
**Decision**: Add `TenantControlSettings` model in Prisma (tenant-unique `planCode` + `featureFlagsJson`) and expose shared helpers in `packages/db/src/control-plane.ts` for tenant provisioning, domain lifecycle operations, and settings updates consumed by new `apps/admin` API/UI flows.
**Reason**: Keeps control-plane concerns explicit and centrally managed without overloading CRM/web runtime models, while enabling immediate production-oriented admin workflows for onboarding/provisioning.

### D-044: Apply dependency-injected route-handler pattern to admin control-plane APIs
**Decision**: Refactor `apps/admin` tenant/domain/settings route files to export `create*Handler` factories with default production dependencies and add route integration coverage in `apps/admin/app/api/lib/routes.integration.test.ts`.
**Reason**: Keeps testing strategy consistent with CRM route coverage, enabling deterministic request validation/mutation behavior checks without brittle runtime module mocking.
