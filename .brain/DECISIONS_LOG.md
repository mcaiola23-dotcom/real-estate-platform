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

## 2026-02-14
### D-045: Treat this sandbox as non-authoritative for remaining control-plane validation commands
**Decision**: Keep Control Plane MVP validation tasks (`db:migrate:deploy`, `db:seed`, and `@real-estate/admin` route tests) open until rerun in a compatible environment, and record sandbox failures as non-authoritative evidence only.
**Reason**: Current sandbox constraints (Prisma engine DNS fetch failures, WSL `cmd.exe` vsock failure, and `tsx` IPC `EPERM`) prevent reliable validation outcomes for those commands.

### D-046: Use Windows `cmd.exe` as authoritative validation path for current control-plane command checks
**Decision**: Accept Windows `cmd.exe` command results as authoritative for Control Plane MVP validation in this repo layout, and close the pending validation tasks after successful runs of `db:migrate:deploy`, `db:seed`, `@real-estate/admin` route tests, and admin build.
**Reason**: Windows-shell execution completed all blocked validations successfully, while WSL sandbox failures remained environment-specific and non-representative.

### D-047: Enforce admin-only access for control-plane mutations and emit structured audit events at route boundary
**Decision**: Add shared admin mutation access utility in `apps/admin/app/api/lib/admin-access.ts` and apply it to mutation handlers (`tenants POST`, `domains POST`, `domains/[domainId] PATCH`, `settings PATCH`) so only role `admin` can mutate, with audit emission for `allowed`/`denied`/`succeeded`/`failed`.
**Reason**: Closes a production hardening gap where control-plane writes were protected by authentication but not explicit role-based authorization or consistent mutation audit traces.

### D-048: Persist admin mutation audit events through shared db boundary and keep write path fail-open
**Decision**: Add shared `AdminAuditEvent` persistence model/migration (`packages/db/prisma/schema.prisma`, `202602140001_add_admin_audit_events`) plus helper API in `packages/db/src/admin-audit.ts`, then update `apps/admin/app/api/lib/admin-access.ts` to write audit events through shared helper and fail-open on sink errors.
**Reason**: Moves control-plane audit trail from app-log-only telemetry into durable/queryable shared data while preventing audit sink issues from blocking tenant/domain/settings mutation handling.

### D-049: Deliver admin audit timeline read surface via helper-based tenant reads with global aggregation in app layer
**Decision**: Add `apps/admin/app/api/admin-audit/route.ts` to serve audit timeline reads by calling `listControlPlaneAdminAuditEventsByTenant` directly for tenant-scoped requests and by aggregating per-tenant helper reads for the recent global feed, then expose operator filters (tenant/status/action) in `apps/admin/app/components/control-plane-workspace.tsx`.
**Reason**: Provides immediate operator visibility into control-plane mutation history without introducing new app-to-app coupling or bypassing the shared db helper boundary, while keeping tenant-specific reads explicit and preserving MVP delivery momentum.

### D-050: Validate new audit-read surface through route-level dependency-injected tests and Windows-authoritative command runs
**Decision**: Extend `apps/admin/app/api/lib/routes.integration.test.ts` with `/api/admin-audit` cases for tenant-scoped filtering and global recent-feed aggregation/limit, then treat Windows `cmd.exe` runs of `npm run test:routes --workspace @real-estate/admin` and `npm run build --workspace @real-estate/admin` as authoritative validation for this slice.
**Reason**: Keeps route behavior verification deterministic while avoiding known WSL sandbox false negatives (`tsx` IPC and SWC binary mismatch) that do not represent production/local Windows execution outcomes.

## 2026-02-16
### D-051: Treat restart recovery as explicit runtime integrity check before new implementation work
**Decision**: After unexpected session interruption, rerun Windows-authoritative Prisma/runtime commands (`db:generate`, `db:generate:direct`, `worker:ingestion:drain`, and `@real-estate/admin` route tests) before resuming feature work, and only apply additional Prisma safe-generate mitigation if failures are reproduced.
**Reason**: Confirms no partial or inconsistent local state remains after restart, reduces risk of chasing non-reproducible failures, and keeps reliability hardening evidence-driven.

### D-052: Defer additional safe-generate mitigation unless lock failures reappear under sampled load
**Decision**: After running a Windows loop of 15 consecutive `db:generate:direct` attempts with zero failures, keep the current `db-generate-safe` behavior unchanged for now and shift to periodic reliability sampling + logging.
**Reason**: Current evidence does not reproduce the prior `EPERM` lock condition after restart, so code changes would be speculative; continued measurement gives an objective trigger for future hardening.

### D-053: Add dedicated Prisma reliability sampling command with EPERM-focused diagnostics
**Decision**: Add `packages/db/scripts/db-generate-reliability-sample.mjs` and expose it via `db:generate:sample` scripts (workspace + root) to run repeated generate attempts, emit pass/fail rates, detect Windows `EPERM` lock signatures, and record compact failure samples.
**Reason**: Replaces manual loop checks with a repeatable, documented command surface and makes lock-regression evidence consistent across sessions.

### D-054: Strengthen safe-generate retry envelope before no-engine fallback
**Decision**: Update `packages/db/scripts/db-generate-safe.mjs` to perform multiple cleanup/backoff retries (`PRISMA_GENERATE_LOCK_RETRIES`, `PRISMA_GENERATE_RETRY_BACKOFF_MS`) when Windows lock signatures are detected, then fallback to `--no-engine` only after retries are exhausted.
**Reason**: A single retry was insufficient under recurrent lock conditions; progressive retry pacing increases recovery chance while preserving deterministic fallback behavior when contention persists.

### D-055: Treat Prisma temporary engine rename artifacts as operational noise to clean/ignore
**Decision**: Expand `db-generate-safe` cleanup to remove `query_engine-windows.dll.node.tmp*` files and add the same pattern to `.gitignore`.
**Reason**: Persistent lock retries can leave temp artifacts that pollute repo status without representing source changes; explicit cleanup/ignore keeps session diffs actionable.

## 2026-02-17
### D-056: Route direct full-engine Prisma generation through a dedicated mitigation wrapper and sample that path directly
**Decision**: Add `packages/db/scripts/db-generate-direct.mjs` with Windows rename-lock probe/wait, engine artifact cleanup, and retry/backoff (without `--no-engine` fallback), update `db:generate:direct` to use it, and run `db:generate:sample` via this wrapper for apples-to-apples reliability measurement.
**Reason**: Prior mitigations improved `db:generate` fallback behavior but did not harden the direct full-engine path; direct-path instrumentation and retries are required to isolate whether lock contention can be recovered before introducing deeper process-level mitigations.

### D-057: Allow direct-generate success under lock only when existing generated client proves runtime-healthy
**Decision**: Extend `packages/db/scripts/db-generate-direct.mjs` so persistent rename-lock failures can return success only if an existing generated Prisma client passes a runtime health probe (`SELECT 1`) against the configured database; remove no-engine regeneration fallback from direct path to avoid runtime mode regression.
**Reason**: A no-engine fallback can improve command pass rate while breaking ingestion runtime readiness. Health-checked client reuse preserves runtime correctness and still mitigates lock-holder contention when a valid full-engine client already exists.

### D-058: Standardize CRM UX around a polished two-column operations shell aligned to Matt Caiola brand language
**Decision**: Rework `apps/crm/app/components/crm-workspace.tsx` and `apps/crm/app/globals.css` into a premium, responsive command-center layout with executive KPIs, status distribution strip, lead-first workflow panel, and structured right-rail modules (contact capture, activity logging, timeline, contact snapshot), plus branded auth entry presentation.
**Reason**: The initial CRM UI baseline was functionally correct but visually utilitarian; moving to a clearer hierarchy and refined visual system increases operator readability, perceived product quality, and day-to-day usability without changing API/data contracts.

### D-059: Shift CRM lead editing to draft-first workflow with optimistic saves and inline feedback
**Decision**: Add client-side lead search/filter/status-tab controls, a sticky quick-action draft bar, per-lead unsaved indicators, optimistic lead/contact/activity updates, and lightweight toast feedback in `apps/crm/app/components/crm-workspace.tsx` with matching style primitives in `apps/crm/app/globals.css`.
**Reason**: CRM operators need faster triage and clearer mutation feedback than direct auto-save interactions provide; draft-first editing with optimistic UI behavior improves perceived responsiveness while preserving tenant-scoped API contracts and existing backend boundaries.

### D-060: Treat Prisma direct-generation stability as restored with health-checked reuse + extended sample evidence
**Decision**: Keep `db:generate:direct` on `packages/db/scripts/db-generate-direct.mjs` with healthy existing-client reuse checks and continue periodic sampling, after Windows-authoritative runs reached `6/6` and `12/12` pass rates with no `EPERM` failures.
**Reason**: Current evidence shows mitigation effectiveness while preserving runtime readiness, but lock behavior has historically been intermittent; periodic re-sampling remains necessary to detect regressions quickly.

### D-061: Capture home-search browsing intent via website behavior events and persist as CRM activities
**Decision**: Introduce new website behavior contracts (`website.search.performed`, `website.listing.viewed`, `website.listing.favorited`, `website.listing.unfavorited`) in `packages/types/src/events.ts`, emit them from home-search UI flows (`apps/web/app/home-search/HomeSearchClient.tsx` and `apps/web/app/home-search/hooks/useSavedListings.ts`) through `apps/web/app/api/website-events/route.ts`, and ingest them in `packages/db/src/crm.ts` as tenant-scoped `Activity` records with metadata and best-effort lead/contact linking by listing identity.
**Reason**: Lead-intent behavior data is high-value conversion context and must live in CRM persistence (not only client/local or profile-sync surfaces) to support actionable operator workflows and future UI display.

### D-062: Use Lead Profile Modal as the primary CRM behavior-intelligence surface and navigation target
**Decision**: Implement a reusable Lead Profile Modal in `apps/crm/app/components/crm-workspace.tsx` and treat it as the primary lead-context destination from shell search suggestions and existing lead/contact touchpoints (activity feed, lead cards, pipeline cards, contact list), with inline draft status/notes editing and save/discard controls reused from existing mutation flow.
**Reason**: Centralizing lead context in one modal shortens operator navigation loops, makes new website behavior signals immediately actionable, and allows incremental rollout across CRM surfaces before dedicated table/shell navigation slices are completed.

### D-063: Complete CRM checklist in a single integrated workspace refactor
**Decision**: Implement the full CRM checklist in one coordinated pass centered on `apps/crm/app/components/crm-workspace.tsx` + `apps/crm/app/globals.css` instead of splitting by small slices.
**Reason**: The requested scope was interaction-heavy and cross-cutting (modal/table/pipeline/shell/filter states). Delivering in one cohesive pass avoided drift and inconsistent UX behavior between partial slices.

### D-064: Add tenant-scoped lead detail + contact patch route surfaces for modal/table drill-ins
**Decision**: Extend CRM API boundaries with `GET /api/leads/[leadId]`, `PATCH /api/leads/[leadId]` expanded update fields, and new `PATCH /api/contacts/[contactId]`, backed by shared db helpers (`getLeadByIdForTenant`, `updateContactForTenant`).
**Reason**: UI checklist requirements needed authoritative detail drill-in and inline contact/lead editing from the reusable lead profile modal while preserving tenant isolation and shared package boundaries.

### D-065: Centralize CRM operator-facing label mapping
**Decision**: Introduce `apps/crm/app/lib/crm-display.ts` for canonical source/type/status/activity label mapping and route all UI rendering through these helpers.
**Reason**: Prevents drift in display semantics across dashboard, pipeline, table, autocomplete, and modal views; explicitly standardizes `website_valuation` display text to `Valuation Request` while keeping stored values unchanged.

### D-066: Make pipeline filters independent from dashboard filters with explicit conflict notice behavior
**Decision**: Split pipeline filter state from dashboard filter state and add explicit operator notice when status edits move a lead outside active pipeline filters.
**Reason**: Addresses the "lead disappears" confusion and removes hidden coupling between dashboard pills and pipeline board filtering.

### D-067: Standardize CRM hover states around readable, low-contrast highlight treatments
**Decision**: Replace dark hover overlays on key CRM interactive surfaces (lead/address inline links, KPI cards, sortable table headers) with subtle shared tokenized hover styles in `apps/crm/app/globals.css`.
**Reason**: Dark hover states were reducing text readability and degrading usability; subtle highlight treatment preserves affordance without obscuring content.

### D-068: Prioritize typography refinement as the immediate post-checklist UI pass
**Decision**: Make second-pass typography cleanup the first task for the next session (after `platform-session-bootstrap`), ahead of additional feature expansion.
**Reason**: Core CRM checklist functionality is complete; the highest-value next step is improving hierarchy legibility and visual consistency to increase day-to-day operator usability and adoption.

## 2026-02-18
### D-069: Centralize CRM dashboard/pipeline interaction state transitions into reusable helpers
**Decision**: Add `apps/crm/app/lib/workspace-interactions.ts` and route `apps/crm/app/components/crm-workspace.tsx` through it for nav-to-view resolution, lead-table preset filtering, pipeline move-notice semantics, and table sort toggle state transitions; add coverage in `apps/crm/app/lib/workspace-interactions.test.ts`.
**Reason**: Interaction behavior had become spread across inline branches in the large workspace component, increasing regression risk for dashboard/pipeline changes. A shared helper boundary makes behavior deterministic, easier to test, and safer to evolve.

### D-070: Standardize CRM typography rhythm and keyboard-focus affordances as the default readability baseline
**Decision**: Apply second-pass typography normalization in `apps/crm/app/globals.css` (consistent text scale/line-height across panel/table/pipeline/modal/settings surfaces), reduce heavy hover contrast, and introduce broad `:focus-visible` treatment for interactive controls.
**Reason**: Checklist functionality was complete but readability/accessibility consistency still lagged across dense operator surfaces; standardizing typographic rhythm and focus visibility improves everyday usability without altering tenant-scoped behavior or API contracts.

### D-071: Make the Admin Portal onboarding flow wizard-first to accelerate operator usability
**Decision**: Rework `apps/admin/app/components/control-plane-workspace.tsx` around a 4-step guided provisioning wizard (Tenant Basics -> Primary Domain -> Plan & Features -> Review & Provision), followed by selected-tenant Domain Ops and readiness controls.
**Reason**: Existing admin controls were functional but fragmented. A guided operator workflow reduces cognitive load and speeds tenant launch actions without waiting for deeper hardening phases.

### D-072: Establish a premium visual baseline for admin-facing control-plane surfaces
**Decision**: Replace utilitarian admin styling with a cohesive visual system in `apps/admin/app/globals.css` (design tokens, richer cards, stepper/plan/feature controls, responsive hierarchy), and align typography via `Manrope` + `Fraunces` in `apps/admin/app/layout.tsx` plus styled auth shells.
**Reason**: Production readiness requires strong operator trust and clarity. Visual hierarchy and interaction polish materially improve usability and perceived platform quality before additional validation/hardening work.

### D-073: Prioritize admin usability roadmap slices before additional validation/hardening work
**Decision**: Sequence the next admin roadmap work as: (1) mutation error transparency, (2) domain operations automation, then (3) plan/feature governance UX, while deferring remaining CRM manual click-through to after these admin slices.
**Reason**: Highest-impact operator usability gains now come from reducing onboarding/domain workflow friction in the admin portal; this ordering improves day-to-day launch velocity before deeper hardening phases.

### D-074: Normalize admin mutation failures into scoped operator guidance with inline field hints
**Decision**: Add shared UI-side mutation error parsing in `apps/admin/app/lib/mutation-error-guidance.ts` and wire `apps/admin/app/components/control-plane-workspace.tsx` to use scoped guidance objects (summary/detail/next-steps/field-hints/focus-step) for onboarding, domain attach/update, and settings mutations.
**Reason**: Raw backend error strings were not actionable during operator workflows. Structured guidance reduces onboarding/domain stalls by mapping RBAC, duplicate slug/domain, and validation failures directly to the fields and next actions operators need.

### D-075: Add operator-facing domain automation controls with polling/retry and SSL readiness indicators
**Decision**: Extend `apps/admin/app/components/control-plane-workspace.tsx` with Domain Ops automation controls (`poll now`, auto-poll interval, per-domain retry verification checks) plus readiness cards that expose DNS verification and SSL/certificate status based on selected primary-domain state.
**Reason**: Manual one-off domain status actions were insufficient for launch operations. Polling/retry controls and explicit readiness indicators reduce operator uncertainty and make domain go-live state more actionable during onboarding.

### D-076: Enforce plan governance guardrails in admin onboarding/settings with override-aware workflow
**Decision**: Introduce shared helper `apps/admin/app/lib/plan-governance.ts` to define plan templates + required/allowed feature sets, then apply it in `apps/admin/app/components/control-plane-workspace.tsx` for onboarding/settings validation, governance summaries, `Enforce Guardrails`, and explicit temporary override toggles.
**Reason**: Free-form feature-flag editing created inconsistent tenant entitlements. Centralized guardrails keep plan assignments consistent at scale while still permitting explicit, operator-visible exceptions when needed.

### D-077: Keep admin manual click-through as a required next-step when sandbox cannot host local UI runtime
**Decision**: Treat manual admin onboarding/domain browser validation as pending when this sandbox cannot bind local dev ports (`listen EPERM 0.0.0.0:3002`), and carry it forward as the first task in `.brain/PICKUP.md` for a non-sandboxed environment.
**Reason**: UI automation substitutes in this environment are insufficient for full interaction/layout validation across desktop/smaller-laptop workflows; deferring this specific check preserves validation quality without inventing false confidence.

## 2026-02-19
### D-078: Drive Domain Ops polling/retry from backend DNS/TLS probes instead of refresh-only UI semantics
**Decision**: Add backend probe helper `apps/admin/app/api/lib/domain-probe.ts` plus route `apps/admin/app/api/tenants/[tenantId]/domains/probe/route.ts`, and wire `apps/admin/app/components/control-plane-workspace.tsx` Domain Ops polling/retry/readiness cards to consume probe payloads (`dnsStatus`, `certificateStatus`, messages, observed records, certificate validity).
**Reason**: UI refresh-only polling did not provide authoritative verification/certificate signal. Backend probe execution gives operator actions actionable infrastructure state without adding cross-app coupling or breaking tenant-scoped boundaries.

### D-079: Keep probe results read-only and separate from persisted `isVerified` mutation flow
**Decision**: Return probe findings as authoritative operational status in Domain Ops UI while preserving existing explicit domain mutation actions (`Mark Verified`, `Set Primary`) and not auto-writing probe outcomes into tenant domain persistence.
**Reason**: Avoids implicit side-effect writes during polling, prevents audit-noise inflation, and keeps control-plane mutation semantics explicit while still delivering provider-backed launch readiness visibility.

## 2026-02-20
### D-080: Defer full Admin/CRM manual browser reviews until next UI/UX improvement passes complete
**Decision**: Defer both pending manual click-through tasks (Admin onboarding/domain ops and CRM post-polish validation) until additional planned UI/UX improvements are implemented, rather than running full validation now.
**Reason**: Running full manual QA before upcoming UI/UX changes would create duplicate validation effort with low decision value; deferral keeps review effort aligned to a more stable UI baseline.

### D-081: Elevate Prisma Windows lock regression back to active stabilization priority
**Decision**: Treat the latest Windows-authoritative reliability sample result (`db:generate:sample -- 12 --json --exit-zero` => `0/12` pass, `12/12` `EPERM`) as an active reliability regression and prioritize another direct-generation lock mitigation pass before resuming lower-priority validation work.
**Reason**: Reliability trend reversed from prior stable samples, indicating current mitigation is not consistently effective; continued failures risk blocking local runtime/tooling workflows that depend on full-engine Prisma generation.

### D-082: Preserve reusable full-engine client artifacts and add preflight lock-reuse in direct Prisma generation
**Decision**: Update `packages/db/scripts/db-generate-direct.mjs` to (a) resolve a default local `DATABASE_URL` when unset, (b) preflight-check rename-lock state and short-circuit to existing-client reuse when healthy, (c) preserve current generated engine artifacts during cleanup retries, and (d) allow load-probe reuse fallback when query probe cannot be established under lock contention.
**Reason**: Prior retry/cleanup logic still produced `0/12` sample reliability under recurring Windows rename locks; preserving and validating an existing full-engine client is safer and more reliable than repeatedly destroying/regenerating artifacts under active lock-holder contention.

### D-083: Model tenant-scoped operator RBAC + support session state in a dedicated control-plane table
**Decision**: Add Prisma model/migration `TenantControlActor` with tenant-scoped actor identity, role, permissions JSON, and support-session lifecycle fields, plus shared helper APIs in `packages/db/src/control-plane.ts` for actor list/upsert/update/remove and support-session start/end.
**Reason**: Admin RBAC management requirements need durable, tenant-isolated actor state with auditable support-session controls; this cannot be represented cleanly as transient UI state or overloaded plan/feature settings.

### D-084: Deliver RBAC and observability through explicit admin API boundaries and route-tested handlers
**Decision**: Add Admin API routes for actor lifecycle and support-session workflows under `apps/admin/app/api/tenants/[tenantId]/actors/*`, add `apps/admin/app/api/observability/route.ts` for monitoring summaries, and extend `apps/admin/app/api/lib/routes.integration.test.ts` coverage for all new handlers.
**Reason**: Keeps control-plane mutation/read surfaces explicit and testable, preserves tenant-scoped boundaries, and ensures new operator tooling can evolve without coupling UI directly to persistence internals.

### D-085: Treat control-plane observability as a first-class operator surface in the Admin workspace
**Decision**: Extend `apps/admin/app/components/control-plane-workspace.tsx` with an observability section (mutation trends, ingestion runtime/queue health, tenant readiness scoreboard) backed by shared summary helper `getControlPlaneObservabilitySummary`.
**Reason**: Operational reliability is now a primary delivery risk area (Prisma lock behavior + ingestion readiness); putting these signals directly in Admin improves operator response time and makes launch-readiness status actionable without separate tooling.

### D-086: Expand Admin audit timeline around server-side advanced filtering with request/change attribution
**Decision**: Extend `apps/admin/app/api/admin-audit/route.ts` with richer query filters (`actorRole`, `actorId`, `requestId`, `changedField`, `search`, `from`, `to`, `errorsOnly`) and increase global-feed upstream fetch depth before final filtered slicing; add request/change metadata emission via `buildAuditRequestMetadata` in `apps/admin/app/api/lib/admin-access.ts` and all admin mutation routes.
**Reason**: Basic tenant/status/action filtering was insufficient for operator troubleshooting; server-side attribution-aware filtering makes audit investigations faster and more reliable at control-plane scale.

### D-087: Provide exportable audit output directly from Admin timeline using filtered in-memory event set
**Decision**: Add CSV/JSON export actions in `apps/admin/app/components/control-plane-workspace.tsx` that export the currently filtered audit event set, including request attribution and changed-field summaries.
**Reason**: Operators need to share and archive incident timelines without manual copy/paste or ad-hoc scripts; in-UI export keeps workflows fast while preserving tenant-scoped query context.

### D-088: Model domain/settings soft-delete as explicit lifecycle status and expose tenant lifecycle controls
**Decision**: Add `status` lifecycle columns (`active`/`archived`) to `TenantDomain` and `TenantControlSettings`, add shared lifecycle helpers in `packages/db/src/control-plane.ts`, and add tenant lifecycle route `apps/admin/app/api/tenants/[tenantId]/status/route.ts` with status-aware domain/settings route updates.
**Reason**: Data safety/recovery requirements need reversible soft-delete semantics without destructive row deletes, while keeping tenant isolation and auditable operator flows explicit at shared package boundaries.

### D-089: Enforce destructive lifecycle confirmations and archived-state edit locks in Admin UI
**Decision**: Add confirmation-gated archive/restore actions for tenant/domain/settings in `apps/admin/app/components/control-plane-workspace.tsx`, disable settings edits while tenant/settings are archived, and restrict active domain operations to active domains/tenants.
**Reason**: Control-plane destructive actions should require explicit operator intent and safe defaults; archived-state locks reduce accidental mutations and make recovery posture predictable.
