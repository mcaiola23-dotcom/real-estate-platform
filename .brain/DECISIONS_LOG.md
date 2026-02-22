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

### D-090: Implement tenant support diagnostics as a dedicated control-plane read/remediation boundary
**Decision**: Add shared diagnostics/remediation helpers in `packages/db/src/control-plane.ts` (`getTenantSupportDiagnosticsSummary`, `runTenantSupportRemediationAction`) and expose them through `apps/admin/app/api/tenants/[tenantId]/diagnostics/route.ts`, with one-click remediation actions for primary-domain verification and ingestion queue recovery.
**Reason**: Operators needed a single tenant-scoped workflow for auth/domain/ingestion health plus guided remediations; embedding this as a first-class API/UI surface reduces troubleshooting latency and keeps tenant-isolated operations explicit.

### D-091: Add first-class billing/subscription model and admin workflow before provider-specific integration
**Decision**: Introduce `TenantBillingSubscription` in Prisma (`packages/db/prisma/schema.prisma`, migration `202602200003_add_tenant_billing_subscriptions`) and add shared db helpers + Admin API/UI controls for plan transitions, payment/trial state visibility, and optional entitlement synchronization.
**Reason**: Control-plane billing operations required durable tenant-scoped state independent of transient UI edits; establishing this baseline now enables provider/webhook integration as a focused follow-up slice without reworking operator workflows.

### D-092: Extend admin audit action taxonomy for diagnostics and billing mutations
**Decision**: Expand `ControlPlaneAdminAuditAction` with `tenant.diagnostics.remediate` and `tenant.billing.update`, wire these into route audit emission/filter parsing, and include them in Admin timeline filter options.
**Reason**: New mutation surfaces must be searchable and attributable in the existing audit workflow to preserve control-plane operability and incident forensics consistency.

### D-093: Normalize external billing events into an idempotent shared reconciliation helper before provider-specific wiring
**Decision**: Add `reconcileTenantBillingProviderEvent` in `packages/db/src/control-plane.ts` that resolves tenant identity from explicit tenant id or persisted provider identifiers (`billingSubscriptionId`/`billingCustomerId`), updates subscription state through shared billing helpers, and persists dedupe status in new Prisma model `TenantBillingSyncEvent`.
**Reason**: Provider webhooks can retry and arrive out of order; an idempotent shared reconciliation boundary reduces duplicate side effects and keeps billing state transitions consistent across webhook/manual sync entry points.

### D-094: Add a dedicated webhook ingestion route for billing provider events with audit visibility
**Decision**: Add `apps/admin/app/api/billing/webhooks/route.ts` as the provider event ingress point, guard with optional `ADMIN_BILLING_WEBHOOK_SECRET`, emit audit events under `tenant.billing.sync`, and return `202` for unresolved tenant mappings while preserving deterministic `200` success for applied/duplicate events.
**Reason**: A separate webhook boundary decouples external provider delivery from operator-authenticated mutation flows and ensures billing sync activity is observable in the existing admin audit timeline.

### D-095: Enforce Stripe-native webhook verification and normalize provider payloads before reconciliation
**Decision**: Update `apps/admin/app/api/billing/webhooks/route.ts` to process Stripe webhooks through strict raw-body signature verification (`stripe-signature` + `ADMIN_BILLING_STRIPE_WEBHOOK_SECRET`) and normalize Stripe event envelopes into `TenantBillingProviderEventInput` before calling `reconcileTenantBillingProviderEvent`; keep the existing secret-gated normalized/manual webhook path for non-Stripe ingress.
**Reason**: Stripe webhook security and payload semantics differ from internal normalized event formats; provider-native verification plus normalization reduces spoofing risk and keeps shared reconciliation inputs deterministic across provider retries and schema variance.

### D-096: Compute entitlement drift summaries during billing provider reconciliation and report them through webhook/audit surfaces
**Decision**: Extend `reconcileTenantBillingProviderEvent` in `packages/db/src/control-plane.ts` to compute tenant-scoped entitlement drift summaries by comparing provider entitlement flags to persisted tenant settings feature flags after reconciliation (including duplicate/unresolved outcomes), return the summary in `TenantBillingProviderEventResult`, and emit drift indicators in webhook audit metadata from `apps/admin/app/api/billing/webhooks/route.ts`.
**Reason**: Operators need deterministic post-sync visibility into entitlement mismatches to act on configuration drift quickly; reporting drift directly in reconciliation outputs and audit logs keeps troubleshooting tenant-scoped and actionable without introducing cross-app coupling.

### D-097: Surface billing drift triage directly in Admin billing workflow with an audit preset handoff
**Decision**: Extend `apps/admin/app/components/control-plane-workspace.tsx` to load tenant-scoped `tenant.billing.sync` drift events (`entitlementDriftDetected`) into a Billing panel triage surface, and add a one-click audit preset that applies billing-drift filters (`action=tenant.billing.sync`, `changedField=entitlementDriftDetected`) while keeping existing audit controls available.
**Reason**: Drift summaries in webhook/audit payloads were present but not operator-friendly to discover during support workflows; surfacing recent drift signals in-context and linking directly to filtered audit investigations reduces triage time and improves remediation consistency.

### D-098: Apply billing entitlement drift corrections through draft-first quick actions in Admin UI
**Decision**: Add per-signal remediation shortcuts in `apps/admin/app/components/control-plane-workspace.tsx` (`Add Missing Flags`, `Remove Extra Flags`, `Apply Both`) that mutate tenant settings feature-flag drafts from drift metadata and automatically arm billing workflow entitlement sync.
**Reason**: Drift triage visibility alone still required manual flag copying and increased operator error risk. Draft-first quick actions make remediation deterministic, faster, and aligned with existing save boundaries (`Save Settings` then `Save Billing Workflow`).

### D-099: Centralize billing drift remediation math in a shared helper and regression-test it in the authoritative Admin test command
**Decision**: Extract remediation computation into `apps/admin/app/lib/billing-drift-remediation.ts` and wire `apps/admin/app/components/control-plane-workspace.tsx` to consume it, then add targeted helper assertions to `apps/admin/app/api/lib/routes.integration.test.ts` so `npm run test:routes --workspace @real-estate/admin` validates missing/extra/all drift mutation and entitlement-sync arming behavior.
**Reason**: Remediation behavior previously lived inline in a large UI component and lacked focused coverage. A pure helper plus route-suite execution keeps logic deterministic, reduces regression risk, and aligns with existing Windows-authoritative validation workflow.

### D-100: Aggregate billing drift summary metrics in the shared observability boundary (not UI-local audit parsing)
**Decision**: Extend `getControlPlaneObservabilitySummary` in `packages/db/src/control-plane.ts` and `ControlPlaneObservabilitySummary` contracts in `packages/types/src/control-plane.ts` to include a durable `billingDrift` block (7-day totals, mode counts, missing/extra aggregates, and per-tenant drift rollups with latest timestamp), sourced from persisted `tenant.billing.sync` audit metadata.
**Reason**: Billing drift triage existed only as per-tenant event inspection. A shared observability summary provides a single authoritative operator view for cross-tenant drift volume/trend monitoring and avoids duplicating aggregation logic in the Admin UI layer.

### D-101: Continue reliability sampling as operational maintenance after control-plane feature changes
**Decision**: After delivering new Admin observability surfaces, run another Windows-authoritative Prisma sample (`db:generate:sample -- 12 --json --exit-zero`) plus post-sample `worker:ingestion:drain`, and treat clean results (`12/12` pass, `0` `EPERM`) as no-regression evidence while keeping the periodic sampling task open.
**Reason**: Prisma direct-generation lock behavior has previously regressed after unrelated changes; sampling after each meaningful control-plane update provides quick detection of environment-sensitive regressions without speculative code changes.

### D-102: Adopt a canonical four-tier commercial matrix aligned to control-plane plan codes
**Decision**: Define a concrete commercial plan matrix in `.brain/PRODUCT_SPEC.md` (`5.1`) using plan codes `starter`, `growth`, `pro`, and `team`, each with explicit feature coverage, setup-fee targets, monthly subscription targets, and plan-change billing constraints.
**Reason**: Plan governance and billing workflows already depend on these plan codes operationally; formalizing commercial definitions in project docs closes the GTM ambiguity and keeps product, operations, and admin implementation aligned.

### D-103: Standardize onboarding SLA and managed-services operating model as default go-to-market baseline
**Decision**: Define setup-package deliverables + 15-business-day onboarding SLA in `.brain/PRODUCT_SPEC.md` (`5.2`), and define managed-services catalog + staffing/cadence/fulfillment SLAs in `.brain/PRODUCT_SPEC.md` (`5.3`).
**Reason**: GTM execution required explicit commitments for delivery scope, timing, and post-launch service operations; codifying these now enables consistent sales scoping and predictable operator workflows across new tenant launches.

## 2026-02-21
### D-104: Tackle as many CRM phases as possible per session
**Decision**: No fixed phase-per-session limit. Work through phases sequentially, completing as many as time and complexity allow per session.
**Reason**: Phase duration varies significantly; fixed limits would either under-deliver or force incomplete phases.

### D-105: Use shared package for CRM properties data source
**Decision**: Extract listing types and mock data from `apps/web` into `packages/types` so both `apps/web` and `apps/crm` import from the same source.
**Reason**: Preserves the no-cross-app-imports rule while avoiding data duplication. Sets up clean architecture for when real IDX/MLS data replaces mocks.

### D-106: Use @dnd-kit for drag-and-drop pipeline
**Decision**: Use `@dnd-kit/core` + `@dnd-kit/sortable` for the pipeline board drag-and-drop feature.
**Reason**: Purpose-built for React hooks, excellent keyboard accessibility, small bundle (~10KB), SSR-compatible. Preferred over native HTML5 DnD.

## 2026-02-21

### D-107: Add 5 lead tracking columns via ALTER TABLE migration
**Decision**: Add `lastContactAt`, `nextActionAt`, `nextActionNote`, `priceMin`, `priceMax` as nullable columns to the Lead table via migration `202602210001_add_lead_tracking_fields`.
**Reason**: Enables inline-editable fields in lead modal, contact history logging with timestamp tracking, and urgent follow-ups dashboard widget without breaking existing data.

### D-108: Remove leadBehavior prop from LeadProfileModal
**Decision**: Remove the `leadBehavior` prop from `LeadProfileModal` after replacing the static price range display with editable `priceMin`/`priceMax` draft fields.
**Reason**: The prop's only usage was `leadBehavior?.minPrice` / `leadBehavior?.maxPrice` in a definition grid. With editable fields sourced from the lead draft, the prop became unused. Behavior intelligence data (searches, listings, favorites) uses separate `searchSignals` and `listingSignals` props.

### D-109: Use angular straight-line SVG paths for 7-Day Pulse chart
**Decision**: Replace bezier curves (`C` commands) with straight lines (`L` commands) in the 7-Day Pulse SVG for a heart-rate-monitor aesthetic.
**Reason**: Aligns with the design direction: sharp angular charts, not smooth curves. Combined with `strokeLinejoin="miter"` for consistent sharp angles.

### D-110: Hydration-safe time greeting via useState + useEffect
**Decision**: Replace `useMemo(() => getTimeGreeting(), [])` with `useState('Welcome')` + `useEffect` for the dashboard greeting.
**Reason**: `getTimeGreeting()` returns different values on server vs client (SSR renders at build time), causing React hydration mismatch. The `useEffect` pattern ensures the time-dependent value only computes client-side.

### D-111: Dark mode via CSS custom property override on `[data-theme="dark"]`
**Decision**: Implement dark mode by overriding CSS variables in a `[data-theme="dark"]` selector rather than a separate stylesheet or CSS-in-JS approach.
**Reason**: The codebase already uses CSS variables extensively. A single override block is minimal, maintainable, and doesn't require any component-level theme awareness.

### D-112: useCrmTheme hook with lazy initializer (not effect-based setState)
**Decision**: Use `useState(() => readStoredTheme(tenantId))` lazy initializer instead of `useState('light')` + `useEffect(setThemeState(...))`.
**Reason**: React strict lint rules flag setState in effects as cascading render trigger. Lazy initializer reads localStorage synchronously during initialization, avoiding the lint error and an extra render cycle.

### D-113: Avoid ref access during render — use mount/unmount for CommandPalette reset
**Decision**: Split CommandPalette into outer guard + inner component that mounts fresh when opened.
**Reason**: React strict lint rules prevent ref access during render body. Mounting the inner component fresh on open naturally resets query/selection state without effects or refs.

### D-114: Pipeline aging thresholds — 7d/14d/30d
**Decision**: Use 7d (warm/amber), 14d (stale/orange), 30d+ (critical/red) for pipeline aging badges.
**Reason**: Real estate deals move on weekly rhythms — 7 days signals attention needed, 14 days signals risk, 30+ signals potential loss.

### D-115: Add analytics as workspace navigation view
**Decision**: Add `'analytics'` to `WorkspaceNav` and `WorkspaceView` types with a dedicated `AnalyticsView` component.
**Reason**: Performance metrics and source ROI analysis deserve their own dedicated view, separate from the dashboard which focuses on daily operational context.

### D-116: React.memo on leaf components, dynamic() for extracted views
**Decision**: Apply `React.memo` to `StatusIcon`, `KpiSparkline`, `PropertyCard`, and `MyDayPanel`. Use `next/dynamic` for `ProfileView`, `SettingsView`, `LeadProfileModal`, `PropertiesView`.
**Reason**: Leaf components receive stable props from parent memos/callbacks — memo prevents unnecessary re-renders. Dynamic imports reduce initial bundle size for views only loaded on navigation.

### D-117: Transaction models as separate tables (not embedded JSON)
**Decision**: Create 4 dedicated Prisma models (Transaction, TransactionParty, TransactionDocument, TransactionMilestone) with foreign keys and indexes.
**Reason**: Transactions have structured sub-resources (parties, documents, milestones) that benefit from relational queries, filtering, and pagination. Embedded JSON would limit queryability and make reporting difficult.

### D-118: Lead tags stored as JSON text column
**Decision**: Store tags as a JSON text array (`tags TEXT DEFAULT '[]'`) on the Lead model rather than a separate TagAssignment junction table.
**Reason**: Tags are simple string labels with low cardinality per lead (max 10). JSON text keeps queries simple (SQLite `contains` for filtering) and avoids join overhead. Tag autocomplete aggregates from all leads in the tenant.

### D-119: Unified Timeline replaces separate behavior + activity sections
**Decision**: Replace the 3 separate sections (behavior intelligence cards, signal lists, activity timeline) in LeadProfileModal with a single `UnifiedTimeline` component that interleaves all event types chronologically.
**Reason**: Separate sections fragmented the lead story. A unified chronological feed with category filters gives agents a complete picture of lead engagement in one scrollable view.

### D-120: Source attribution chain as transit-map visualization
**Decision**: Derive the attribution chain from lead source + activity records chronologically, deduplicate consecutive same-type events, and display as a compact horizontal station-dot chain.
**Reason**: Agents need to quickly understand how a lead was acquired and their journey. The transit-map metaphor is compact, scannable, and fits in the modal header area.

### D-121: Duplicate detection via contact email/phone + address matching
**Decision**: Duplicate detection queries contacts by normalized email/phone and leads by address substring match, excluding the current lead. Results show in a dismissible warning banner.
**Reason**: Real estate CRMs commonly have duplicate leads from the same person submitting multiple inquiries. Early detection prevents wasted effort and data fragmentation.

## 2026-02-22
### D-122: Default Admin portal to Guided mode with progressive disclosure for advanced operations
**Decision**: Add a top-level Guided vs Full workspace mode in `apps/admin`, default to Guided mode, and hide advanced panels (diagnostics, billing, access, platform health, audit log) behind an explicit `Advanced Tools` reveal in Guided mode.
**Reason**: The Admin portal has accumulated many operator surfaces and is difficult to parse at first glance. Progressive disclosure preserves existing functionality while making the primary tenant onboarding/launch workflow more intuitive for day-to-day use.

### D-123: Scaffold packages/ai/ as shared AI orchestration package
**Decision**: Create `packages/ai/` with types, config, prompt templates, LLM client abstraction, and CRM-specific orchestration modules (next-action-engine, lead-intelligence, message-drafting, conversation-extractor).
**Reason**: Centralizes AI logic in a shared package that can be consumed by any app (CRM, admin, web), keeps prompts versioned and testable, and enforces provenance metadata on all AI-generated content per non-negotiable rules.

### D-124: Rule-based next-action engine with optional AI enhancement
**Decision**: Next Best Action engine uses 6 deterministic rule-based patterns (overdue_followup, active_browser_no_contact, multi_favorite_same_area, declining_frequency, price_range_shift, repeated_listing_views) that always work, with optional AI enhancement via LLM when API key is configured.
**Reason**: Ensures the feature delivers value immediately without requiring AI service setup. Rule-based patterns cover the highest-impact real estate agent workflows. AI enrichment adds natural language context when available but is never required.

### D-125: AI provenance metadata on all AI-generated content
**Decision**: Every AI response carries `AiProvenance` metadata: source (ai/rule_engine/fallback), model, promptVersion, generatedAt, latencyMs, cached.
**Reason**: Required by non-negotiable rules. Enables agents to distinguish AI-generated vs rule-based content, track prompt versions for debugging, and measure AI service latency.

### D-126: Graceful AI degradation — never-throw LLM client
**Decision**: The LLM client (`packages/ai/src/llm-client.ts`) returns `null` on any failure (rate limit, timeout, network error, missing API key). All orchestration modules fall back to deterministic behavior when AI returns null.
**Reason**: AI features must never break the CRM workflow. A failed AI call should be invisible to the agent — they get rule-based suggestions instead of an error message.

### D-127: CRM AI routes use factory pattern with dependency injection
**Decision**: All 5 AI API routes (lead-score-explain, next-action, lead-summary, draft-message, extract-insights) use `create*Handler` factory functions with injectable dependencies, matching the existing CRM route pattern.
**Reason**: Enables deterministic testing without module mocking, consistent with all other CRM routes (D-034).

## 2026-02-22
### D-128: Use task-based tabs + Action Center to manage Admin control-plane complexity
**Decision**: Add task-based Admin workspace tabs (`launch`, `support`, `billing`, `access`, `health`, `audit`) and a prioritized tenant Action Center with one-click navigation into tabbed sections, while keeping Guided mode progressive disclosure.
**Reason**: The Admin portal now spans many operator workflows; task-focused navigation plus prioritized actions reduces cognitive overload and helps operators focus on the next blocking step for a tenant.

### D-129: Centralize GTM commercial/onboarding baselines for Admin onboarding guidance
**Decision**: Create `apps/admin/app/lib/commercial-baselines.ts` as the Admin-facing canonical source for plan commercial targets, setup scope/SLA baselines, and managed-service references, and surface these directly in the onboarding wizard/review step.
**Reason**: GTM definitions in `.brain/PRODUCT_SPEC.md` need to be operationalized in the control plane so plan selection and onboarding expectations stay aligned without repeating hardcoded values across UI sections.

### D-130: Make Admin Action Center prioritization a tested pure helper
**Decision**: Extract Action Center item prioritization into `apps/admin/app/lib/action-center.ts` with node:test coverage (`action-center.test.ts`) and keep the workspace component responsible only for deriving current tenant/runtime state and rendering.
**Reason**: Action Center logic will grow as more operational signals are added. A pure helper with focused tests reduces regression risk and decouples prioritization policy from the large workspace UI component.

### D-131: Use plan-tier checklist templates and actor seed presets as operator defaults (not persisted workflow state)
**Decision**: Add GTM-driven plan-tier onboarding checklist templates and actor seed presets in `apps/admin/app/lib/commercial-baselines.ts`, and surface them in Launch/Access tabs as operator defaults that prefill drafts/reference tasks without introducing new persistence models yet.
**Reason**: This operationalizes GTM baselines immediately while avoiding a premature database/task-model design. Operators get actionable defaults now, and durable onboarding task persistence can be designed later.

### D-132: Continue Admin decomposition via body-component extraction for lower-risk tab panels first
**Decision**: Extract `support` and `health` tab bodies into dedicated components (`SupportTabBody`, `PlatformHealthTabBody`) while leaving more prop-heavy `launch`/`billing`/`access`/`audit` panels in the main workspace component for a later pass.
**Reason**: This preserves delivery momentum and reduces risk during refactor by starting with high-value, lower-coupling sections before tackling the heaviest panels.

### D-133: Define durable onboarding task persistence as a design artifact before schema implementation
**Decision**: Create `project_tracking/admin_onboarding_task_persistence_design.md` to define the proposed `TenantOnboardingPlan` / `TenantOnboardingTask` schema, API surface, UI rollout, and Action Center integration before adding new Prisma models/routes.
**Reason**: The current plan-tier checklists are useful as operator defaults, but durable task state introduces new persistence and workflow complexity. A design-first pass reduces rework and clarifies rollout sequencing.

### D-134: Smart reminder engine uses rule-based patterns with optional AI enhancement
**Decision**: Reminder engine in `packages/ai/src/crm/reminder-engine.ts` uses 5 deterministic rule-based patterns (overdue_followup, due_today, no_contact_7d, active_browsing_no_scheduled, declining_engagement) with optional AI enhancement for top 2 suggestions, matching the next-action engine pattern.
**Reason**: Consistent with D-124. Rule-based patterns ensure reminders work without AI service setup. AI enhancement adds natural language context when available.

### D-135: Progressive escalation levels (0-4) with score decay for overdue follow-ups
**Decision**: Escalation engine defines 5 levels: 0 (on-time), 1 (1-3d amber), 2 (4-7d red), 3 (8-14d red banner), 4 (14d+ critical with pulse). Score decay applies progressively: 5% at 1d, 10% at 3d, 20% at 7d, 35% at 14d, 50% at 14d+.
**Reason**: Real estate follow-up urgency scales with time elapsed. Progressive levels give agents clear visual hierarchy. Score decay ensures overdue leads surface prominently in scoring-based views.

### D-136: Message templates use merge-field syntax with context-based resolution
**Decision**: Templates use `{{field.name}}` merge-field syntax (e.g., `{{lead.name}}`, `{{agent.name}}`, `{{property.address}}`). Resolution via `resolveMergeFields()` replaces known fields and marks unknown ones visually. Templates categorized by purpose (outreach, follow_up, update, milestone) and channel (email, sms).
**Reason**: Merge fields are familiar from CRM/email-marketing tools. Category/channel taxonomy enables quick filtering. Visual markers for unresolved fields prevent agents from sending incomplete messages.

### D-137: Add `nextActionChannel` and `reminderSnoozedUntil` to Lead model
**Decision**: Add two nullable columns to the Lead table via migration `202602220001_add_reminder_fields`: `nextActionChannel TEXT` (preferred follow-up channel) and `reminderSnoozedUntil DATETIME` (snooze expiry timestamp).
**Reason**: Channel preference enables reminder suggestions to recommend the right communication method. Snooze support prevents reminder fatigue by allowing agents to temporarily suppress follow-up prompts.

### D-134: Extract Admin `billing` / `access` / `audit` tab bodies as body-only components before persistence MVP work
**Decision**: Decompose `apps/admin/app/components/control-plane-workspace.tsx` further by extracting `BillingTabBody`, `AccessTabBody`, and `AuditTabBody` into `apps/admin/app/components/control-plane/`, while keeping existing state, helpers, and mutation orchestration in the parent workspace component for now.
**Reason**: This finishes the highest-noise rendering extraction before onboarding-task persistence implementation, reducing UI-file cognitive load and merge risk without changing tenant-scoped workflow behavior or forcing a larger state-management rewrite.

### D-138: Seed durable tenant onboarding tasks from Admin plan-tier templates while keeping shared DB helpers template-agnostic
**Decision**: Keep canonical onboarding checklist templates in `apps/admin/app/lib/commercial-baselines.ts` for now, and have the Admin onboarding `POST` route transform those templates into shared task-seed inputs for `createTenantOnboardingPlanFromTemplate(...)` in `packages/db`.
**Reason**: This ships durable onboarding task persistence quickly without violating shared package boundaries (`packages/db` does not import app code), while preserving a clean path to move templates into a shared/db-backed source later.

### D-139: Enforce one active onboarding plan per tenant in shared control-plane helper logic
**Decision**: Implement active-plan uniqueness for onboarding in `packages/db/src/control-plane.ts` application logic (reject create/plan-status updates that would result in multiple `active` plans for the same tenant) instead of relying on a DB-level partial unique index in the initial SQLite Prisma schema.
**Reason**: Prisma/SQLite schema support for conditional unique constraints is limited for this use case; app-layer enforcement keeps the MVP deterministic and portable while the onboarding workflow model evolves.

### D-140: Use task-local drafts + targeted PATCH saves for onboarding checklist edits in Admin Launch tab
**Decision**: Implement onboarding checklist task editing in `apps/admin` with per-task local draft/saving/error state and targeted `PATCH /onboarding/tasks/[taskId]` saves that update the local onboarding bundle on success, instead of forcing a full tenant refresh after every task change.
**Reason**: Task editing is a high-frequency operator workflow. Task-local drafts preserve responsiveness, reduce API/load churn, and keep the large Admin workspace state stable while the onboarding persistence MVP is still being integrated.

### D-141: Add onboarding plan lifecycle controls to Launch tab before full workflow reporting integration
**Decision**: Surface `Pause Plan`, `Resume Plan`, and `Complete Plan` actions directly in the Launch checklist panel, backed by `PATCH /api/tenants/[tenantId]/onboarding/[planId]`, rather than deferring plan lifecycle state changes to a separate admin sub-panel.
**Reason**: Plan lifecycle state is operationally coupled to checklist task progress and blockers. Keeping lifecycle controls in the Launch checklist reduces operator context switching and makes paused/completed states visible where task work is actually managed.

### D-142: Feed persisted onboarding-task blockers/overdue state into Action Center and readiness checks immediately (without waiting for deeper reporting)
**Decision**: Extend Admin Action Center prioritization and launch readiness checks to consume persisted onboarding task signals (missing plan, paused plan, blocked required tasks, overdue required tasks) from the newly persisted onboarding bundle.
**Reason**: Persisted onboarding tasks become most valuable when they affect operator prioritization, not just checklist display. Early signal integration improves day-to-day workflow value while broader observability/readiness scoring integrations are still pending.

### D-143: Use separate tenant-scoped plan draft state for onboarding plan metadata edits in Launch checklist
**Decision**: Store onboarding plan field edits (`targetLaunchDate`, `pauseReason`) in a tenant-scoped local plan draft map in `apps/admin/app/components/control-plane-workspace.tsx` and save via an explicit `Save Plan` action, rather than patching plan metadata on every input change.
**Reason**: Keeps the Launch panel responsive, avoids noisy audit/event writes while operators type, and matches the local-draft pattern already used across other Admin workflows (settings, billing, actor edits).

### D-144: Treat most-relevant non-archived onboarding plan as current plan for refresh/readiness views
**Decision**: Update shared onboarding plan lookup helpers in `packages/db/src/control-plane.ts` to prefer `active`, then `paused`, `draft`, `completed` plans (excluding `archived`) when determining the tenant’s current onboarding plan, instead of only returning `active`.
**Reason**: Operators need paused/completed plans to persist across refreshes for lifecycle management, reporting, and historical context. Returning only `active` caused the Launch checklist to appear empty after pausing/completing a plan.

### D-145: Implement onboarding bulk task actions as repeated task PATCH mutations with local bundle sync
**Decision**: Add bulk onboarding actions in Admin Launch (`mark done`, bulk owner-role apply) by iterating selected task IDs through the existing task PATCH path and updating local onboarding state incrementally, rather than introducing a new bulk API endpoint in the MVP.
**Reason**: Reuses existing validation/audit logic, keeps the API surface smaller while workflows are still evolving, and is sufficient for current checklist sizes without premature backend complexity.

### D-146: Add onboarding metrics to shared observability summary contract and tenant readiness scoring
**Decision**: Extend `ControlPlaneObservabilitySummary` with an `onboarding` aggregate block and compute onboarding-based readiness constraints (missing plan, paused plan, blocked/overdue/unassigned required tasks) server-side in `getControlPlaneObservabilitySummary(...)`.
**Reason**: Onboarding status is now persisted and operationally significant. Computing these signals server-side keeps observability/readiness consistent across Admin surfaces and avoids duplicating aggregation logic in UI components.

### D-147: Enforce onboarding bulk actor-assignment guardrails in Admin UI using owner-role compatibility checks
**Decision**: Add a UI-side compatibility helper for bulk onboarding owner-actor assignment in `apps/admin/app/components/control-plane-workspace.tsx` that blocks client-role actor assignment, filters incompatible actors by selected onboarding owner role, and skips selected tasks whose current owner role does not match the chosen bulk owner role.
**Reason**: Tenant control-plane actor roles (`admin`/`operator`/`support`/`viewer`) do not map 1:1 to onboarding owner roles (`sales`/`ops`/`build`/`client`). Guardrails reduce accidental assignment errors while keeping the MVP on the existing task PATCH API (no new bulk endpoint).

### D-148: Surface onboarding observability aggregates in Platform Health dashboard via KPI cards and summary panel
**Decision**: Display `observability.onboarding` metrics in `PlatformHealthTabBody` as additional KPI cards plus a dedicated `Onboarding Rollout Health` panel, instead of deferring onboarding metrics to a separate dashboard tab.
**Reason**: Onboarding readiness is now a first-class operational signal and should be visible in the existing cross-tenant Platform Health view alongside ingestion and billing drift, minimizing navigation overhead for operators.

### D-149: Extend tenant readiness scoreboard entries with onboarding triage counts
**Decision**: Add a nested `onboarding` summary block to each `ControlPlaneTenantReadinessScore` entry (`planStatus`, blocked/overdue/unassigned required task counts) and compute it server-side in `getControlPlaneObservabilitySummary(...)`.
**Reason**: Operators need per-tenant onboarding risk context directly in the readiness scoreboard to triage which low-scoring tenants are blocked vs overdue vs simply unassigned, without opening each tenant’s Launch tab.

### D-150: Enforce onboarding owner-actor compatibility in Admin Launch UI for per-task edits
**Decision**: Filter per-task `Owner Actor` dropdown options by onboarding owner-role compatibility and add inline guidance/save-time validation for stale or incompatible actor selections in `apps/admin/app/components/control-plane-workspace.tsx`.
**Reason**: Bulk owner-assignment guardrails (D-147) reduced assignment errors; applying the same compatibility rules to per-task edits keeps operator behavior consistent and prevents invalid/stale selections from being PATCHed.

### D-151: Add combined bulk onboarding owner role + actor action as UI orchestration (no new API route)
**Decision**: Implement `Apply Role + Actor` in the Launch checklist by iterating selected tasks through the existing onboarding task PATCH route with both `ownerRole` and `ownerActorId`, rather than adding a new bulk backend endpoint.
**Reason**: This gives operators a faster triage workflow immediately while preserving the MVP’s small API surface and reusing existing audit/validation behavior. Checklist task volumes remain small enough that repeated PATCH calls are acceptable.

### D-152: Extend tenant readiness entries with onboarding progress counts (completed/required) in addition to risk counts
**Decision**: Add onboarding required-task progress counts (`requiredTaskCount`, `completedRequiredTaskCount`, `incompleteRequiredTaskCount`) to `ControlPlaneTenantReadinessScore.onboarding` and compute them server-side in `getControlPlaneObservabilitySummary(...)`.
**Reason**: Risk counts alone (blocked/overdue/unassigned) don’t tell operators how far along a tenant is. Progress counts give immediate context in scoreboard/triage views without opening the tenant Launch checklist.

### D-153: Enforce onboarding owner-actor compatibility in shared DB helper, not only Admin UI
**Decision**: Validate `ownerActorId` existence + actor-role compatibility inside `updateTenantOnboardingTask(...)` in `packages/db/src/control-plane.ts` whenever owner role/actor changes, and normalize `client` owner-role tasks to `ownerActorId = null`.
**Reason**: UI guardrails improve UX but are not sufficient for data integrity. Shared helper enforcement ensures compatibility rules hold across all current/future callers of the onboarding task update API and prevents invalid persisted assignments.

### D-154: Add cross-tenant onboarding triage panel to Platform Health instead of creating a separate Admin tab
**Decision**: Implement an `Onboarding Triage Queue` panel in `PlatformHealthTabBody` with local filter/sort controls over `tenantReadiness` onboarding signals, rather than introducing another top-level workspace tab.
**Reason**: Operators already use Platform Health for cross-tenant triage. Keeping onboarding triage in the same surface reduces navigation friction and leverages the server-computed readiness/onboarding metrics already available in the observability summary payload.

### D-155: Reuse the onboarding owner-actor compatibility matrix across UI and DB by extracting a focused DB helper module
**Decision**: Extract the compatibility matrix into `packages/db/src/onboarding-owner-assignment.ts` and have `updateTenantOnboardingTask(...)` consume that helper, with direct unit tests in `packages/db/src/onboarding-owner-assignment.test.ts`.
**Reason**: The compatibility rules now matter for persisted data integrity (server-side enforcement) and UI guidance. A focused helper with direct tests reduces drift between call sites without requiring a full Prisma-backed DB test harness.

### D-156: Add Platform Health onboarding triage quick actions as tenant+tab navigation (not deep-link scroll yet)
**Decision**: Add `Open Launch` actions in Platform Health readiness/triage rows that set the selected tenant and switch the Admin workspace tab to `launch`, without implementing panel scroll/focus deep-links yet.
**Reason**: This delivers immediate operator workflow improvement with minimal coupling. Deep-linking/scroll targeting can be added later if the current tab switch still leaves too much searching in the Launch panel.

### D-157: Use browser-local telemetry for onboarding triage/bulk actions before adding a backend bulk mutation endpoint
**Decision**: Add best-effort browser-local telemetry (`localStorage` key `admin-usage-telemetry.v1`) for onboarding triage navigation and bulk task actions (batch sizes, durations, success/failure counts), and defer a dedicated bulk API endpoint until telemetry indicates repeated PATCH orchestration is a real bottleneck.
**Reason**: The current UI orchestration is simpler and reuses existing audited task PATCH behavior. Telemetry gives evidence for when API complexity is justified instead of prematurely expanding the backend surface.

### D-158: Upgrade Platform Health onboarding quick actions to deep-link/scroll-focus the Launch checklist panel
**Decision**: Extend `Open Launch` actions in Platform Health readiness/triage rows to select the tenant, switch to the `launch` tab, and scroll/focus the `#launch-onboarding-checklist` section.
**Reason**: Operators need to land directly on the persisted onboarding checklist after triaging risk signals. Deep-link focus reduces hunting inside the Launch tab and improves the triage-to-action loop.

### D-159: Keep onboarding bulk mutations on repeated task PATCH calls until telemetry indicates a bottleneck
**Decision**: After adding local telemetry instrumentation, continue using repeated onboarding task PATCH calls for bulk actions and do not add a backend bulk mutation endpoint yet.
**Reason**: The current flow reuses existing validation/audit behavior and is simpler to maintain. The new telemetry inspector now provides concrete evidence (batch size, duration, failure rate) to justify a backend bulk endpoint later if needed.

### D-160: Expose browser-local onboarding usage telemetry in Platform Health as a debug/inspection panel
**Decision**: Add an `Onboarding Usage Telemetry (Local)` panel to `PlatformHealthTabBody` that reads `admin-usage-telemetry.v1`, supports refresh/clear actions, and shows event counts, recent events, bulk-action aggregates, and a lightweight endpoint recommendation.
**Reason**: Operators/developers need visibility into triage/bulk-action usage without opening DevTools. In-app inspection makes the telemetry immediately actionable for deciding whether to invest in backend bulk mutation APIs.

### D-161: Promote onboarding usage telemetry to server-side only via manual aggregate publish into Admin audit log
**Decision**: Add an admin-only route `POST /api/observability/usage-telemetry` that accepts a sanitized aggregate telemetry snapshot (counts + bulk-action stats + policy metadata) and records it as an Admin audit event (`tenant.observability.telemetry.publish`), instead of automatically streaming client telemetry or persisting raw event detail.
**Reason**: This provides a privacy-aware server-side trail and supports operational review without adding high-volume telemetry ingestion complexity. Manual aggregate publish keeps the feature low risk and aligned with the evidence-first approach for backend expansion.

### D-162: Exclude tenant IDs and raw recent events from promoted onboarding telemetry payloads
**Decision**: Define explicit telemetry promotion policy constants in `apps/admin/app/lib/admin-usage-telemetry.ts` and build publish payloads with aggregate counts/statistics only; do not include raw `recentEvents` entries or tenant IDs in the server-published payload.
**Reason**: The telemetry is intended to inform UX/performance decisions (e.g., bulk endpoint justification), not to capture operator behavior exhaustively. Aggregate-only promotion minimizes privacy risk and retention burden while preserving the useful decision signals.

### D-163: Roll up published onboarding telemetry aggregates into observability summary from audit events (14-day window)
**Decision**: Extend `ControlPlaneObservabilitySummary` with `onboardingUsageTelemetry` and compute it server-side in `getControlPlaneObservabilitySummary(...)` by aggregating successful `tenant.observability.telemetry.publish` audit events over a 14-day window.
**Reason**: Audit-only persistence is useful for traceability, but operators also need a current summary view in Platform Health. Re-aggregating from sanitized audit payloads avoids a new telemetry storage pipeline while preserving the aggregate-only privacy boundary.

### D-164: Keep local vs published telemetry visually separated in Platform Health inspector
**Decision**: Show server-side published telemetry rollup and browser-local telemetry as separate sections/signals within the `Onboarding Usage Telemetry (Local)` panel, rather than merging them into a single number.
**Reason**: The two sources have different scopes and trust semantics (local browser snapshot vs manually published server aggregate). Keeping them distinct avoids accidental overinterpretation and makes debugging/publishing behavior clearer.

### D-165: Centralize bulk-endpoint recommendation thresholds and recommendation logic in telemetry helper
**Decision**: Move onboarding bulk-endpoint recommendation thresholds and decision logic into `apps/admin/app/lib/admin-usage-telemetry.ts` (`ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS`, `buildAdminBulkEndpointRecommendation(...)`) and have Platform Health use the shared helper for both local and published telemetry sources.
**Reason**: Threshold tuning should be a single-point change, not duplicated UI logic. Reusing one helper ensures local-vs-published recommendations stay consistent and makes future calibration based on real usage data easier.

### D-166: Surface rollup-window vs retention alignment note in Platform Health telemetry inspector
**Decision**: Add a helper-driven alignment note (`buildAdminUsageTelemetryRollupAlignmentNote(...)`) that compares the server telemetry rollup window to the recommended retention policy and displays the result in the Platform Health telemetry panel.
**Reason**: Operators/developers need immediate visibility into whether the current rollup window is coherent with the retention policy guidance before telemetry settings are revisited or expanded.

### D-155: Implement CRM remaining polish as five parallel client-side modules
**Decision**: Implement #62 (Mobile-First Actions), #63 (Offline Note Capture), #65 (MLS/IDX Feed Status), #66 (Document Management), and #61 (Export & Reporting) as parallel self-contained modules — `MobileActionBar.tsx`, `use-offline-queue.ts`, `FeedStatusChip.tsx`, enhanced `DocumentsPane`, and `crm-export.ts` — integrated into `crm-workspace.tsx`.
**Reason**: These features are independent, client-side-heavy, and can share the existing factory-pattern API routes and workspace state without new data models.

### D-156: Use localStorage-based offline queue with background sync for CRM notes
**Decision**: Implement offline note capture via a `useOfflineQueue` hook using `localStorage` with `navigator.onLine` detection and periodic `/api/activities` sync on reconnect, using idempotency keys to prevent duplicates.
**Reason**: Avoids service worker complexity for the MVP; localStorage persistence is sufficient for note buffering and the existing activities API already handles creation.

### D-157: Document management uses click-to-advance status cycling with stage-based checklists
**Decision**: Enhanced `DocumentsPane` in `TransactionDetailModal` uses `DOC_STATUS_ORDER` cycling (pending → received → reviewed → approved), `REQUIRED_DOCS_BY_STAGE` checklists, and PATCH `/api/transactions/[id]/documents/[docId]` for status updates.
**Reason**: Operators need quick status toggling without modal dialogs; stage-based checklists make missing documents immediately visible.

### D-158: MLS feed status derived from ingestion job timestamps
**Decision**: The `/api/properties/feed-status` route derives feed health from the most recent processed `IngestionQueueJob` record via `getLatestProcessedIngestionJob()`, using a 24-hour staleness threshold.
**Reason**: Reuses existing ingestion queue data without requiring a separate feed-health table; gives operators immediate visibility into data freshness.

### D-163: AI Market Digest uses listing aggregate stats with narrative + AI enhancement
**Decision**: Implement `generateMarketDigest()` in `packages/ai/src/crm/market-analysis.ts` with deterministic `computeMarketStats()` (median price, $/sqft, new this week, status distribution) plus rule-based narrative fallback and optional AI-enhanced narrative/highlights/takeaway via `callAiCompletion`.
**Reason**: Agents need market context alongside lead data. Deterministic stats are always available; AI adds natural language insights when configured. Follows the established rule-based + AI enhancement pattern (D-124).

### D-164: AI Listing Description Generator supports 4 tones with feature-phrase mapping
**Decision**: Implement `generateListingDescription()` in `packages/ai/src/crm/listing-description.ts` with tone-specific AI prompting (luxury, family-friendly, investment-focused, first-time-buyer) and a rule-based fallback that uses `FEATURE_PHRASES` mapping to generate tone-appropriate descriptions from property attributes.
**Reason**: MLS descriptions need tone control for different buyer audiences. Feature-phrase mapping ensures coherent fallback descriptions without AI. Four tones cover the primary real estate marketing segments.

### D-165: Predictive Lead Scoring uses Naive Bayes over historical closed leads
**Decision**: Implement `predictLeadConversion()` in `packages/ai/src/crm/predictive-scoring.ts` using Naive Bayes classification with Laplace smoothing over 9 bucketed features extracted from historical Won/Lost leads. Minimum threshold: 50 closed leads (10+ per outcome). In-memory distribution cache with 1-hour TTL per tenant. AI enhancement provides natural-language explanation of top contributing factors.
**Reason**: Naive Bayes works well with small categorical datasets, is interpretable (per-feature log-odds contributions), and needs no external ML runtime. The 50-lead minimum prevents unreliable predictions with sparse data. Follows the established rule-based + AI enhancement pattern (D-124).

### D-166: Smart Lead Routing uses 5-factor weighted composite scoring
**Decision**: Implement `computeLeadRouting()` in `packages/ai/src/crm/lead-routing.ts` with 5 weighted routing factors: geographic specialization (25%), property type expertise (20%), pipeline load (20%), historical conversion rate (20%), and response time (15%). Supports team mode (2+ actors, ranked recommendations) and solo mode (self-assessment). Uses `TenantControlActor` as agent identity. AI enhancement provides rationale for top recommendation.
**Reason**: Multi-factor composite scoring provides transparent, explainable agent-lead matching. Weight distribution balances specialization signals with operational capacity. Solo mode enables value even before team expansion. Actor model reuse avoids new identity infrastructure.
