# CURRENT_FOCUS

## Active Objective
Continue Admin control-plane usability and maintainability improvements while preparing the durable onboarding-task persistence MVP, preserving tenant isolation and shared package boundaries.

## In-Progress Workstream
1. Tenant-aware web runtime baseline is in place via host-header tenant resolution in `apps/web/proxy.ts` and tenant-aware `lead`/`valuation` API handling.
2. Root workspace tooling and top-level scripts are in place via npm workspaces and root `dev`/`build`/`lint` commands for `apps/web`, `apps/crm`, and `apps/studio`.
3. Shared `packages/types` contract baseline is in place and active `apps/web` tenant/event typing now imports from the shared package.
4. Durable tenant/domain persistence scaffolding now lives in `packages/db` with Prisma schema/migrations/seed flow, while `apps/web` tenant resolution now uses async shared db lookups with edge-safe seed fallback.
5. Tenant scoping has been added to `apps/web` user profile sync endpoints and server-side town data providers (`walkscore`/`places`) now receive tenant context with tenant-specific cache variants.
6. Explicit tenant context interfaces are now threaded through remaining client-side/static data providers (`atAGlance`, `taxes`, `schools`, `listings`) and their key call sites (`town` pages and `home-search`), with tenant-scoped module toggle gating now applied in town/neighborhood module rendering paths.
7. Prisma runtime hardening is now in place in `packages/db` (`prisma-client`, tenant/module lookup fallbacks), so tenant resolution and module loading degrade to seed-backed behavior instead of failing page renders when local Prisma runtime/state is unavailable.
8. `apps/crm` workspace skeleton and auth boundary baseline are now in place with Clerk middleware protection, tenant header stamping, tenant resolver utilities, and initial auth/session API scaffolding.
9. CRM core persistence is now in place in `packages/db` with `Contact`, `Lead`, `Activity`, and `IngestedEvent` models plus migration `202602130001_add_crm_core_models`.
10. Website event ingestion contracts are wired from `apps/web` lead/valuation API routes into shared db ingestion helpers in `packages/db/src/crm.ts`, now queue-first via enqueue + worker processing.
11. Local Windows Prisma generate reliability has been hardened with `packages/db/scripts/db-generate-safe.mjs`, including engine-lock retry/cleanup and fallback behavior.
12. Tenant-scoped CRM operational baseline is now in place in `apps/crm` with authenticated API routes (`/api/leads`, `/api/leads/[leadId]`, `/api/contacts`, `/api/activities`) and dashboard UI modules for lead updates, contact creation, and activity timeline logging.
13. Website ingestion has been decoupled from direct CRM table writes via a queue boundary in `packages/db/src/crm.ts` (`enqueueWebsiteEvent`, `processWebsiteEventQueueBatch`) plus new queue model/migration `202602130002_add_ingestion_queue_jobs`.
14. Ingestion worker runtime boundary is now scaffolded in `services/ingestion-worker` with `drain:once` worker command and root orchestration script `worker:ingestion:drain`.
15. Prisma configuration migration is now in place with `packages/db/prisma.config.ts`, and deprecated `package.json#prisma` has been removed from `@real-estate/db`.
16. CRM API filtering/pagination contracts are now expanded for lead/contact/activity list endpoints with shared query parsing (`apps/crm/app/api/lib/query-params.ts`) and route-level validation tests.
17. Ingestion queue reliability hardening is now in place with retry cadence scheduling and explicit dead-letter lifecycle handling in `packages/db/src/crm.ts`, plus schema/migration updates in `packages/db/prisma/schema.prisma` and `packages/db/prisma/migrations/202602130003_add_ingestion_retry_dead_letter/migration.sql`.
18. Ingestion runtime readiness checks are now explicit in `packages/db/src/prisma-client.ts` and exposed via `getIngestionRuntimeReadiness`, so worker and validation scripts fail fast with actionable messaging when Prisma is generated in no-engine mode.
19. Integration test flow for enqueue -> worker -> CRM persistence is now in place in `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` with root orchestration command `npm run test:ingestion:integration`, now including invalid payload dead-letter/requeue lifecycle assertions, retry/backoff cadence assertions (`nextAttemptAt` gating + attempt progression), and terminal max-attempt transition assertions into `dead_letter`.
20. Dead-letter queue operator tooling is now in place with shared list/requeue helpers in `packages/db/src/crm.ts` and worker commands `worker:ingestion:dead-letter:list` / `worker:ingestion:dead-letter:requeue`.
21. Prisma client generation/runtime loading now targets package-local output (`packages/db/generated/prisma-client`) via `packages/db/prisma/schema.prisma`, `packages/db/src/prisma-client.ts`, and `packages/db/scripts/db-generate-safe.mjs` to reduce shared engine-lock contention on Windows.
22. CRM route handlers now expose dependency-injected factory exports (`createLeadsGetHandler`, `createContactsGetHandler`, `createContactsPostHandler`, `createActivitiesGetHandler`, `createActivitiesPostHandler`, `createLeadPatchHandler`) so route behavior can be tested deterministically without runtime module mocking.
23. Shared ingestion test helpers now live in `services/ingestion-worker/scripts/test-helpers.ts`, and both `test-enqueue-worker-flow.ts` and `test-dead-letter-commands.ts` now consume them for fixture lifecycle setup/cleanup and forced retry progression without changing assertion coverage.
24. Control Plane MVP scaffold is now in place via new `apps/admin` runtime (Clerk-protected proxy boundary, provisioning/dashboard UI, and admin API routes), plus shared control-plane contracts/helpers in `packages/types` and `packages/db` (`control-plane.ts`) with `TenantControlSettings` persistence scaffolding in Prisma schema/migration.
25. Admin route-level test coverage is now scaffolded in `apps/admin/app/api/lib/routes.integration.test.ts`, and tenant/domain/settings route handlers now expose dependency-injectable factories to support deterministic route validation similar to CRM patterns.
26. Admin control-plane mutation hardening is now in place via shared route utility `apps/admin/app/api/lib/admin-access.ts`, enforcing admin-only mutation access (`tenant.provision`, `tenant.domain.add`, `tenant.domain.update`, `tenant.settings.update`) and structured audit event emission for allowed/denied/succeeded/failed mutation outcomes.
27. Durable control-plane audit persistence boundary is now scaffolded in shared db packages via Prisma model/migration `AdminAuditEvent` (`packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/202602140001_add_admin_audit_events/migration.sql`) and helper surface `packages/db/src/admin-audit.ts` (`createControlPlaneAdminAuditEvent`, `listControlPlaneAdminAuditEventsByTenant`), with admin route audit sink updated to use the shared helper and fail-open if audit persistence write fails.
28. Operator-facing control-plane audit timeline read surface is now in place in `apps/admin` with API route `apps/admin/app/api/admin-audit/route.ts` (tenant-filtered feed + recent global feed aggregation) and dashboard UI filters/timeline module in `apps/admin/app/components/control-plane-workspace.tsx`.
29. Direct full-engine Prisma generation now has a dedicated mitigation wrapper in `packages/db/scripts/db-generate-direct.mjs` (rename-lock probe/wait + cleanup + retry/backoff + healthy full-engine client reuse check), and both `db:generate:direct` plus reliability sampling now run through this path for deterministic lock diagnostics.
30. Full CRM checklist scope in `apps/crm` is complete (modal/table/pipeline/settings/header-footer/behavior intelligence/API enhancements), and the latest UI pass added tenant-scoped branding controls plus readability-focused hover-state corrections in shared CRM styles.
31. Second-pass CRM UI refinement is now complete in `apps/crm` with tightened typography hierarchy/line-height rhythm, normalized focus-visible accessibility affordances, improved table/pipeline text legibility, and extracted/tested dashboard-pipeline interaction helpers in `apps/crm/app/lib/workspace-interactions.ts`.
32. Admin mutation error transparency is now in place in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/lib/mutation-error-guidance.ts`, with scoped RBAC/duplicate/validation parsing, inline field-level hints, and actionable next-step guidance across onboarding/domain/settings flows.
33. Domain operations automation is now in place in `apps/admin/app/components/control-plane-workspace.tsx` with operator polling controls, auto-poll intervals, retry verification checks, and SSL/certificate readiness indicators tied to primary-domain verification state.
34. Plan/feature governance UX is now in place in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/lib/plan-governance.ts` with per-plan templates, required/allowed feature guardrails, inline governance warnings, override toggles, and enforce-template actions for onboarding + tenant settings.
35. Backend-driven domain verification/certificate probe flow is now in place via `apps/admin/app/api/lib/domain-probe.ts` and `apps/admin/app/api/tenants/[tenantId]/domains/probe/route.ts` (DNS + TLS checks) with `apps/admin/app/components/control-plane-workspace.tsx` Domain Ops polling/retry/readiness wired to authoritative probe payloads.
36. Prisma direct-generation lock mitigation is now expanded in `packages/db/scripts/db-generate-direct.mjs` with preflight rename-lock reuse, default `DATABASE_URL` resolution, existing-engine preservation during cleanup, and load-probe fallback so persistent `EPERM` lock contention can reuse a verified full-engine client.
37. Admin RBAC management + support-session workflows are now in place via new actor routes (`apps/admin/app/api/tenants/[tenantId]/actors/route.ts`, `apps/admin/app/api/tenants/[tenantId]/actors/[actorId]/route.ts`, `apps/admin/app/api/tenants/[tenantId]/actors/[actorId]/support-session/route.ts`), shared persistence helpers in `packages/db/src/control-plane.ts`, schema/migration updates for `TenantControlActor`, and operator UI controls in `apps/admin/app/components/control-plane-workspace.tsx`.
38. Control-plane observability dashboard is now in place via `apps/admin/app/api/observability/route.ts`, shared summary helper `getControlPlaneObservabilitySummary` in `packages/db/src/control-plane.ts`, and new Admin workspace observability surfaces for mutation trends, ingestion runtime/queue health, and tenant readiness scoring.
39. Advanced Admin audit timeline UX is now in place via expanded filter/query surface in `apps/admin/app/api/admin-audit/route.ts`, richer request/change metadata capture in `apps/admin/app/api/lib/admin-access.ts` + mutation routes, and timeline/export UX updates in `apps/admin/app/components/control-plane-workspace.tsx` with supporting route tests in `apps/admin/app/api/lib/routes.integration.test.ts`.
40. Data safety/recovery controls are now in place in Admin via status-based soft-delete/restore flows for tenant/domain/settings (`apps/admin/app/api/tenants/[tenantId]/status/route.ts`, status-aware updates in settings/domain routes, and lifecycle persistence in `packages/db/src/control-plane.ts`) plus destructive confirmation UX in `apps/admin/app/components/control-plane-workspace.tsx`.
41. Tenant support diagnostics toolkit is now in place via shared db helpers (`getTenantSupportDiagnosticsSummary`, `runTenantSupportRemediationAction`) plus Admin API/UI surfaces (`apps/admin/app/api/tenants/[tenantId]/diagnostics/route.ts`, `apps/admin/app/components/control-plane-workspace.tsx`) covering auth/domain/ingestion health checks and one-click remediation actions.
42. Billing/subscription operations baseline is now in place via new Prisma model/migration `TenantBillingSubscription`, shared db helper surfaces (`getTenantBillingSubscription`, `updateTenantBillingSubscription`), Admin API route `apps/admin/app/api/tenants/[tenantId]/billing/route.ts`, and operator UI controls in `apps/admin/app/components/control-plane-workspace.tsx` for plan transitions, payment/trial status visibility, and optional entitlement sync.
43. Billing-provider reconciliation baseline is now in place via idempotent shared helper `reconcileTenantBillingProviderEvent` (`packages/db/src/control-plane.ts`), new webhook route `apps/admin/app/api/billing/webhooks/route.ts`, persisted sync-event model/migration `TenantBillingSyncEvent`, and audit visibility support for `tenant.billing.sync`.
44. Billing webhook provider-native hardening (phase 1) is now in place in `apps/admin/app/api/billing/webhooks/route.ts` with strict Stripe signature verification (`stripe-signature` + `ADMIN_BILLING_STRIPE_WEBHOOK_SECRET`) and Stripe payload normalization into `TenantBillingProviderEventInput` before reconciliation.
45. Entitlement drift detection/reporting is now in place in shared billing reconciliation via tenant-scoped provider-vs-settings comparisons in `packages/db/src/control-plane.ts`, with drift summary reporting in webhook responses and audit metadata from `apps/admin/app/api/billing/webhooks/route.ts`.
46. Operator-facing billing drift triage surfaces are now in place in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/globals.css`, with per-tenant drift signal cards, one-click audit preset loading, and audit timeline drift guidance/chips for billing sync investigations.
47. Operator remediation shortcuts from billing drift triage are now in place in `apps/admin/app/components/control-plane-workspace.tsx`, including one-click missing/extra/all flag correction actions that update settings drafts, arm billing entitlement sync, and surface save-order guidance.
48. Focused automated regression coverage for billing drift remediation is now in place via pure helper tests in `apps/admin/app/api/lib/routes.integration.test.ts` + shared helper `apps/admin/app/lib/billing-drift-remediation.ts`, validating missing/extra/all draft mutation behavior and entitlement-sync arming semantics.
49. Cross-tenant billing drift reporting summary is now in place in shared observability contracts/aggregation (`packages/types/src/control-plane.ts`, `packages/db/src/control-plane.ts`) and exposed in Admin workspace observability (`apps/admin/app/components/control-plane-workspace.tsx`) with recent totals, drift modes, and per-tenant breakdowns.
50. AI Integration Foundation (Phase 8) is now in place via `packages/ai/` shared package with types/config/LLM-client/prompt-templates and 4 CRM orchestration modules (next-action-engine, lead-intelligence, message-drafting, conversation-extractor), 5 factory-pattern AI API routes in `apps/crm/app/api/ai/`, 4 AI UI components (AiActionCard, AiLeadSummary, AiNextActions, AiScoreExplanation), and 12 route integration tests (37 total).
51. Admin task-tab decomposition is now materially advanced in `apps/admin` with extracted navigation surfaces (`ActionCenterPanel`, `WorkspaceTaskTabs`) plus `support`, `health`, `billing`, `access`, and `audit` tab-body components, reducing `control-plane-workspace.tsx` inline rendering complexity without changing tenant-scoped behavior.

## Immediate Next Steps
- First next session: implement the durable onboarding-task persistence MVP in Admin control plane using `project_tracking/admin_onboarding_task_persistence_design.md`, starting with shared contracts + Prisma schema/models/helpers before UI mutation wiring.
- Continue periodic Windows-authoritative Prisma reliability sampling (`db:generate:sample -- 10+`) after restarts/environment changes and record trend deltas in this file.
- Keep manual browser click-through for Admin and CRM deferred until buildout stabilizes (per current user override); do not spend time on manual QA next session unless the user explicitly changes direction.
- Continue Admin decomposition only as needed to support onboarding-task persistence UI integration (prefer targeted extraction over broad rewrites).

## Session Validation (2026-02-12)
- `npm run lint:web` from root now resolves workspace scripts correctly and reports existing `apps/web` lint violations.
- `npm run lint:studio` from root resolves workspace scripts correctly and currently fails because `apps/studio/node_modules` is not installed in this environment.
- `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts` passes for touched tenant/event files.
- `apps/web/node_modules/.bin/tsc --noEmit --project apps/web/tsconfig.json` passes.
- `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts scripts/check-tenant-resolution.ts` passes.
- `apps/web/node_modules/.bin/tsx.cmd scripts/check-tenant-resolution.ts` passes with `Tenant resolution checks passed.`
- `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/user/profile/route.ts app/api/user/sync/route.ts app/lib/data/providers/walkscore.provider.ts app/lib/data/providers/places.provider.ts` passes.
- `npm run build --workspace @real-estate/web` passes after tenant threading updates and Turbopack workspace root configuration.
- `npm run lint --workspace @real-estate/web -- app/lib/data/providers/tenant-context.ts app/lib/data/providers/atAGlance.provider.ts app/lib/data/providers/taxes.provider.ts app/lib/data/providers/schools.provider.ts app/lib/data/providers/listings.types.ts app/components/data/AtAGlanceModule.tsx app/components/data/TaxesModule.tsx app/components/data/SchoolsModule.tsx app/home-search/page.tsx` passes.
- `npm run build --workspace @real-estate/web` passes after client/static provider tenant-context threading.
- `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts proxy.ts app/api/lead/route.ts app/api/valuation/route.ts app/api/user/profile/route.ts app/api/user/sync/route.ts scripts/check-tenant-resolution.ts` passes after async tenant resolver/db integration updates.
- `npm run build --workspace @real-estate/web` passes after async tenant-resolution updates and `packages/db` durable persistence scaffolding.
- `npm install` completes successfully at repository root and installs Prisma tooling for `@real-estate/db`.
- `npm run db:generate --workspace @real-estate/db` passes.
- `npm run db:migrate:deploy --workspace @real-estate/db` passes and applies migration `202602120001_init_tenant_tables` to `packages/db/prisma/dev.db`.
- `npm run db:seed --workspace @real-estate/db` passes and seeds baseline Fairfield tenant/domain records.
- `npm run lint --workspace @real-estate/web -- app/lib/modules/tenant-modules.ts scripts/check-module-toggles.ts app/lib/tenant/resolve-tenant.ts proxy.ts` passes.
- `npm run build --workspace @real-estate/web` passes after introducing tenant module toggle registry consumption in town/neighborhood pages.
- `./node_modules/.bin/tsx.cmd apps/web/scripts/check-module-toggles.ts` passes with `Tenant module toggle checks passed.`
- `./node_modules/.bin/tsx.cmd apps/web/scripts/check-tenant-resolution.ts` passes with `Tenant resolution checks passed.`
- `npm run db:migrate:deploy --workspace @real-estate/db` passes after applying migration `202602120002_add_website_module_config`.
- `npm run db:seed --workspace @real-estate/db` passes with SQL seed flow for tenant website/module config baseline.
- `npm run db:generate --workspace @real-estate/db` currently fails in this environment with Windows file-lock `EPERM` on Prisma engine DLL rename (`node_modules/.prisma/client/query_engine-windows.dll.node`).
- Browser runtime regression resolved: Prisma client/query init failures in tenant lookup paths now fall back safely to seed-backed tenant/module config data instead of throwing server-render errors.
- `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/lib/modules/tenant-modules.ts scripts/check-tenant-resolution.ts scripts/check-module-toggles.ts` passes after runtime hardening updates.
- `npm run build --workspace @real-estate/web` passes after Prisma fallback and DB URL resolution updates.

## Do Not Do Yet
- Do not start listing portal product build.
- Do not add enterprise-only complexity before solo-agent MVP is stable.
- Do not perform deep UI redesign before tenant runtime and CRM foundations are stable.

## Session Validation (2026-02-13)
- npm install passes after adding @real-estate/crm workspace dependencies.
- npm run lint --workspace @real-estate/crm passes.
- npm run build --workspace @real-estate/crm passes after adding Clerk env-key fallback behavior for non-configured environments.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db passes and applies migration `202602130001_add_crm_core_models`.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:generate --workspace @real-estate/db completes using new safe generate flow; direct engine generation still intermittently hits Windows `EPERM` lock.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:seed --workspace @real-estate/db passes.
- npm run lint --workspace @real-estate/web -- app/api/lead/route.ts app/api/valuation/route.ts scripts/check-crm-ingestion.ts passes.
- npm run build --workspace @real-estate/web passes after ingestion wiring.
- npm run build --workspace @real-estate/crm passes after CRM summary/activity integration.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db ./node_modules/.bin/tsx.cmd apps/web/scripts/check-crm-ingestion.ts passes with idempotency validation (duplicate lead event recognized and skipped).
- npm run lint --workspace @real-estate/crm passes after adding tenant-scoped CRM API routes and UI modules.
- npm run build --workspace @real-estate/crm passes and includes `/api/leads`, `/api/leads/[leadId]`, `/api/contacts`, and `/api/activities`.
- npm install passes after adding `@real-estate/ingestion-worker` workspace and CRM route-test tooling (`tsx`).
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db passes and applies migration `202602130002_add_ingestion_queue_jobs`.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:generate --workspace @real-estate/db passes via safe wrapper and loads `prisma.config.ts`.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:seed --workspace @real-estate/db passes and loads `prisma.config.ts`.
- npm run worker:ingestion:drain passes and executes `@real-estate/ingestion-worker` queue drain command.
- npm run test:routes --workspace @real-estate/crm passes (5 tests) for route query parsing/pagination validation.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db ./node_modules/.bin/tsx.cmd apps/web/scripts/check-crm-ingestion.ts currently fails in this environment because no-engine Prisma client generation yields datasource validation requiring `prisma://`/`prisma+postgres://` for runtime DB calls; `npm run db:generate:direct --workspace @real-estate/db` still intermittently fails with Windows `EPERM` lock.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db passes and applies migration `202602130003_add_ingestion_retry_dead_letter`.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:generate --workspace @real-estate/db falls back to `engine=none` after Windows lock retry in safe wrapper.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:generate:direct --workspace @real-estate/db fails in this environment with Windows `EPERM` rename lock on `query_engine-windows.dll.node`.
- npm run lint --workspace @real-estate/web -- app/api/lead/route.ts app/api/valuation/route.ts scripts/check-crm-ingestion.ts passes.
- .\node_modules\.bin\tsc.cmd --noEmit --project apps/web/tsconfig.json passes.
- npm run worker:ingestion:drain now fails fast with explicit runtime message when Prisma is generated in no-engine mode.
- npm run test:ingestion:integration now fails fast with explicit runtime message when Prisma is generated in no-engine mode.
- DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db .\node_modules\.bin\tsx.cmd apps/web/scripts/check-crm-ingestion.ts now fails fast with explicit runtime message when Prisma is generated in no-engine mode.
- Updated `packages/db/prisma/schema.prisma` to generate Prisma client into `packages/db/generated/prisma-client` and updated runtime import/engine detection in `packages/db/src/prisma-client.ts` to load from generated output instead of `@prisma/client`.
- Updated `packages/db/scripts/db-generate-safe.mjs` cleanup candidates to include `packages/db/generated/prisma-client` engine artifacts before retry/fallback.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:direct --workspace @real-estate/db"` passes and generates Prisma Client to `packages/db/generated/prisma-client`.
- `cmd.exe /c "... && npm run worker:ingestion:drain"` passes with empty-drain summary (`totalProcessed: 0`, no failures).
- `cmd.exe /c "... && npm run test:ingestion:integration"` passes with enqueue->worker->CRM persistence validation (`processedCount: 2`, `failedCount: 0`, tenant-scoped record growth confirmed).
- `cmd.exe /c "... && npm run worker:ingestion:dead-letter:list"` passes with zero dead-letter jobs.
- `cmd.exe /c "... && npm run worker:ingestion:dead-letter:requeue -- --all"` passes with zero requeued/skipped in current dataset.
- `cmd.exe /c "... && npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts"` passes.
- `cmd.exe /c "... && npm run lint --workspace @real-estate/crm"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/crm"` passes with 14/14 tests after adding route integration suite (`apps/crm/app/api/lib/routes.integration.test.ts`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after extending script coverage for invalid payload dead-letter + requeue flow (`deadLetteredCount` increments before and after requeue).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/crm"` passes with 16/16 tests after adding activity mutation failure coverage for tenant-scoped invalid `leadId`/`contactId` linkage.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after adding retry/backoff assertions (`requeuedCount` increments on attempt 1 and 2, immediate subsequent drain picks 0 due to `nextAttemptAt`, then forced schedule resumes processing).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after extending max-attempt coverage (forced attempts 3/4 requeue; forced attempt 5 transitions to `dead_letter` with `attemptCount=5` and `lastError=ingestion_failed`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:dead-letter-commands"` passes for command-level dead-letter operator coverage (`dead-letter:list`, single-job requeue via `INGESTION_DEAD_LETTER_JOB_ID`, and tenant-filtered batch requeue via `INGESTION_DEAD_LETTER_TENANT_ID`) using isolated temporary tenant fixture cleanup.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after adding explicit ingestion payload validation guards for malformed lead/valuation events in `packages/db/src/crm.ts`, removing expected runtime stack-trace noise from integration output while preserving retry/dead-letter assertions.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:dead-letter-commands"` passes after adding JSON-mode command output (`INGESTION_OUTPUT_JSON=1`) and asserting machine-readable payload shape for list/single-requeue/batch-requeue command paths.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after extending malformed valuation payload assertions to mirror malformed lead semantics (requeue on attempts 1-4 and `dead_letter` transition on attempt 5 with `lastError=ingestion_failed`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after switching to temporary tenant fixture lifecycle (`tenant_ingestion_<runId>`) with deterministic zero-baseline summary and guaranteed cleanup in `finally` (no shared `tenant_fairfield` growth).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes after shared test-helper extraction (`services/ingestion-worker/scripts/test-helpers.ts`) and retry-loop refactor in `test-enqueue-worker-flow.ts`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:dead-letter-commands"` passes after migrating command integration fixture/retry setup to shared helpers and enforcing explicit post-cleanup tenant/domain deletion assertions.
- `npm run lint --workspace @real-estate/admin` passes after control-plane app scaffold and API/UI wiring.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `node --import tsx --test apps/admin/app/api/lib/routes.integration.test.ts` fails in this WSL-mounted workspace because `esbuild` platform binary mismatch (`@esbuild/win32-x64` present, linux binary required).
- `npm run test:routes --workspace @real-estate/admin` fails in this sandbox due `tsx` IPC socket permission constraint (`listen EPERM /tmp/tsx-1000/*.pipe`).
- `DATABASE_URL=file:/mnt/c/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db` fails in this sandbox due Prisma engine download DNS resolution error (`getaddrinfo EAI_AGAIN binaries.prisma.sh`).
- `DATABASE_URL=file:/mnt/c/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:seed --workspace @real-estate/db` fails in this sandbox for the same Prisma engine download DNS resolution issue.
- `npm run build --workspace @real-estate/admin` fails in this sandbox due Next SWC runtime/cache constraints (`EACCES /home/mc23/.cache/next-swc` and fallback `SyntaxError: Invalid regular expression` after cache override).

## Session Validation (2026-02-14)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` cannot execute in this sandbox (`WSL UtilBindVsockAnyPort socket failed 1`).
- `DATABASE_URL=file:/mnt/c/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db` fails in this sandbox with Prisma engine DNS resolution error (`getaddrinfo EAI_AGAIN binaries.prisma.sh`).
- `DATABASE_URL=file:/mnt/c/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:seed --workspace @real-estate/db` fails in this sandbox with Prisma engine DNS resolution error (`getaddrinfo EAI_AGAIN binaries.prisma.sh`).
- `npm run test:routes --workspace @real-estate/admin` fails in this sandbox due `tsx` IPC socket permission (`listen EPERM /tmp/tsx-1000/1271.pipe`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` passes and applies migration `202602130004_add_tenant_control_settings`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:seed --workspace @real-estate/db"` passes (`Script executed successfully`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes with 8/8 tests.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` initially failed due stale Prisma client metadata (`Unknown field controlSettings`), then passes after `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate --workspace @real-estate/db"` regenerated client.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes with 10/10 tests after adding admin mutation authz/audit coverage (`tenants POST` and `settings PATCH` non-admin denial assertions plus mutation-path admin header coverage).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes after adding shared admin mutation access utility and route-level audit logging hooks.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` passes and applies migration `202602140001_add_admin_audit_events`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate --workspace @real-estate/db"` passes via safe wrapper with `engine=none` fallback after Windows lock retry.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes with 11/11 tests after durable audit helper wiring and audit-sink failure tolerance coverage (`settings PATCH succeeds even when audit sink throws`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes after durable audit persistence wiring.
- `npm run test:routes --workspace @real-estate/admin` fails in this sandbox due `tsx` IPC socket permission (`listen EPERM /tmp/tsx-1000/4839.pipe`).
- `npm run build --workspace @real-estate/admin` fails in this sandbox due missing Linux SWC binary (`Failed to load SWC binary for linux/x64`) in this mixed Windows/WSL dependency state.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes after audit timeline API/UI changes.
- `npm run lint --workspace @real-estate/admin` does not return diagnostics in this sandbox session (command hangs after `eslint` startup), so no authoritative lint result was captured here.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes with 13/13 tests after adding `/api/admin-audit` route integration coverage (tenant-filtered feed + recent global feed aggregation/limit).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes after audit timeline API/UI additions and includes route output for `/api/admin-audit`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` could not execute in this sandbox (`WSL UtilBindVsockAnyPort socket failed 1`), so no additional authoritative lint result was captured this session.

## Session Validation (2026-02-16)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate --workspace @real-estate/db"` passes and generates Prisma client with query engine artifacts (no fallback to `--no-engine` observed in this run).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:direct --workspace @real-estate/db"` passes with full-engine client generation.
- `cmd.exe /v:on /c "... && for /l %i in (1,1,15) do npm run db:generate:direct --workspace @real-estate/db"` passes for all attempts (`15/15`, `0` failures), so no reproducible post-restart `EPERM` lock regression was observed in this sampling run.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes with clean summary (`totalProcessed: 0`, `totalFailed: 0`, `totalDeadLettered: 0`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (13/13), confirming control-plane route behavior remains intact after restart recovery.
- Added reliability sampler script `packages/db/scripts/db-generate-reliability-sample.mjs` and command `npm run db:generate:sample --workspace @real-estate/db` to capture repeat-attempt pass/fail metrics and EPERM failure samples.
- `cmd.exe /c "... && npm run db:generate:sample --workspace @real-estate/db -- 6"` fails (`0/6` pass, `6/6` `EPERM` lock failures) with reproducible rename lock on `query_engine-windows.dll.node`.
- Hardened safe generate flow in `packages/db/scripts/db-generate-safe.mjs` to apply multi-retry cleanup/backoff (`3` retries by default) before fallback.
- `cmd.exe /c "... && npm run db:generate --workspace @real-estate/db"` now shows retry envelope and then falls back to `engine=none` when lock persists across retries.
- `cmd.exe /c "... && npm run db:generate:sample --workspace @real-estate/db -- 2 --json --exit-zero"` exits `0` and emits machine-readable failure samples for lock monitoring workflows.
- Added temp-artifact hygiene for lock retries: safe-generate cleanup now removes `query_engine-windows.dll.node.tmp*`, and `.gitignore` now excludes those transient files.

## Session Validation (2026-02-17)
- Added full-engine direct mitigation wrapper `packages/db/scripts/db-generate-direct.mjs` and switched `packages/db/package.json` `db:generate:direct` to this script.
- Updated `packages/db/scripts/db-generate-reliability-sample.mjs` to execute the direct mitigation wrapper per attempt (instead of raw `prisma generate`) so sampling reflects current direct-generation mitigation behavior.
- `node --check packages/db/scripts/db-generate-direct.mjs` passes.
- `node --check packages/db/scripts/db-generate-reliability-sample.mjs` passes.
- `npm run db:generate:direct --workspace @real-estate/db` passes in this environment.
- Initial run of `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:sample --workspace @real-estate/db -- 6 --json --exit-zero"` after first wrapper revision still reported `0/6` pass with `6/6` `EPERM` lock failures.
- Revised direct-wrapper mitigation to avoid no-engine regression and instead allow lock-time success only when an existing generated client passes a runtime health probe (`SELECT 1`) via `PRISMA_GENERATE_DIRECT_ALLOW_HEALTHY_CLIENT_REUSE`.
- Re-ran the same Windows-authoritative sample command and now observed `6/6` pass (`100%`, `0` `EPERM` failures).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes after mitigation update (`totalProcessed: 0`, no failures), confirming runtime readiness remained intact.
- Extended Windows-authoritative sample `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` passes with `12/12` success (`100%`, `0` `EPERM` failures).
- Post-sample runtime check `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes (`totalProcessed: 0`, no failures).

## CRM UI Slice (2026-02-17)
- `apps/crm` workspace UI has been elevated from baseline scaffolding to a polished operations layout aligned with Matt Caiola brand language (stone-neutral palette, serif heading accents, refined spacing/borders/shadows, and responsive behavior).
- `apps/crm/app/components/crm-workspace.tsx` now provides a professional two-column experience with:
  - executive KPI cards and status-strip summary,
  - prioritized lead-management panel with richer contextual details and clearer save flow,
  - right-rail modules for contact capture, activity logging, recent activity timeline, and contact directory snapshot.
- `apps/crm/app/globals.css` now defines the expanded CRM design system primitives and responsive layout rules used by the new workspace shell and auth pages.
- CRM auth entry pages (`apps/crm/app/sign-in/[[...sign-in]]/page.tsx`, `apps/crm/app/sign-up/[[...sign-up]]/page.tsx`) now render branded, polished fallback and container states instead of plain text-only output.

## Session Validation (2026-02-17 CRM UI)
- `../../node_modules/.bin/eslint app/components/crm-workspace.tsx app/layout.tsx app/sign-in/[[...sign-in]]/page.tsx app/sign-up/[[...sign-up]]/page.tsx` passes when executed from `apps/crm`.
- `./node_modules/.bin/eslint app/globals.css` reports config-level warning only (`File ignored because no matching configuration was supplied`), no CRM TypeScript lint errors in touched files.
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` fails due pre-existing route-test typing issue in `apps/crm/app/api/lib/routes.integration.test.ts` (`string | undefined` not assignable to `string | null`), unrelated to this UI slice.

## CRM Workflow Refinements (2026-02-17)
- Implemented lead workflow controls in `apps/crm/app/components/crm-workspace.tsx`:
  - status-tab filtering and quick lead search/source/type filters,
  - sticky quick-action bar for bulk save/discard of lead drafts,
  - draft-based status/notes editing flow that no longer auto-saves on status select change.
- Added UX polish behaviors:
  - optimistic lead/contact/activity mutation handling with rollback on API failure,
  - inline per-lead unsaved draft indicators and aggregate pending-change count,
  - lightweight toast notifications for success/error outcomes.
- Added supporting UI styles in `apps/crm/app/globals.css` for filters, sticky quick actions, warning chips, and toast stack presentation.

## Session Validation (2026-02-17 CRM Workflow Refinements)
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` still fails on the pre-existing route-test typing mismatch in `apps/crm/app/api/lib/routes.integration.test.ts` (`string | undefined` -> `string | null`), not introduced by this CRM UI work.
- `../../node_modules/.bin/eslint app/components/crm-workspace.tsx` from `apps/crm` did not return diagnostics in this sandbox session (process remained open without output), so no authoritative lint result was captured for this refinement slice.

## CRM Website Behavior Ingestion (2026-02-17)
- Added new website behavior event contracts in `packages/types/src/events.ts`:
  - `website.search.performed`
  - `website.listing.viewed`
  - `website.listing.favorited`
  - `website.listing.unfavorited`
- Added web tracking API `apps/web/app/api/website-events/route.ts` that resolves tenant context, enriches actor context (`clerkUserId` when available), and enqueues behavior events through the shared ingestion queue.
- Wired website-side event emission:
  - home-search result activity and listing opens in `apps/web/app/home-search/HomeSearchClient.tsx`,
  - favorite/unfavorite interactions in `apps/web/app/home-search/hooks/useSavedListings.ts`,
  - shared client tracking helper in `apps/web/app/lib/analytics/website-events.ts`.
- Extended CRM ingestion in `packages/db/src/crm.ts` to validate/accept new event types and persist them as tenant-scoped `Activity` rows (`website_search_performed`, `website_listing_viewed`, `website_listing_favorited`, `website_listing_unfavorited`) with payload metadata, linking to existing leads/contacts when listing identity matches.

## Session Validation (2026-02-17 Website Behavior Ingestion)
- `./node_modules/.bin/tsc --noEmit --project apps/web/tsconfig.json` passes after wiring website behavior event capture + route handling.
- `./node_modules/.bin/tsc --noEmit --project packages/types/tsconfig.json` passes after event contract expansion.
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` still fails due pre-existing route-test typing mismatch in `apps/crm/app/api/lib/routes.integration.test.ts` (`string | undefined` -> `string | null`), unrelated to this work.
- `./node_modules/.bin/tsc --noEmit --project packages/db/tsconfig.json` still reports pre-existing `@real-estate/types/website-config` import resolution errors in `packages/db/src/seed-data.ts` and `packages/db/src/website-config.ts`, unrelated to this work.

## CRM Lead Profile Modal + Search Autocomplete (2026-02-17 Resume)
- Added reusable lead-profile workflow in `apps/crm/app/components/crm-workspace.tsx`:
  - New Lead Profile Modal with inline status/notes edit + save/discard using existing draft mutation flow.
  - Website behavior-intelligence surface in modal (search, view, favorite, unfavorite summaries + recent signal list + timeline).
  - Modal-open touchpoints now wired from Recent Activity, lead queue cards, contact list records with linked leads, pipeline card contact/address links, and shell search suggestion selections.
- Added CRM shell search autocomplete in `apps/crm/app/components/crm-workspace.tsx` with lead/contact suggestions, status badges, outside-click close, and click-through into Lead Profile Modal.
- Added supporting styles in `apps/crm/app/globals.css` for search suggestions, inline profile links, and responsive modal layout/components.

## Session Validation (2026-02-17 CRM Modal Resume)
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` still fails only on pre-existing route-test typing mismatch in `apps/crm/app/api/lib/routes.integration.test.ts` (`string | undefined` -> `string | null`), unrelated to this modal/autocomplete work.
- `cd apps/crm && timeout 25s ../../node_modules/.bin/eslint app/components/crm-workspace.tsx` exits with timeout (`124`) in this sandbox session (no diagnostics emitted), so no authoritative lint result was captured here.


## Session Update (2026-02-17 CRM Checklist Completion)

### Active Objective Status
- Completed the full CRM UI checklist for dashboard, pipeline, lead profile modal, leads table, settings/navigation shell behavior, and website behavior-intelligence surfaces in `apps/crm` while preserving tenant-scoped API boundaries.

### Completed This Session
1. Delivered complete CRM shell + navigation upgrades in `apps/crm/app/components/crm-workspace.tsx` and `apps/crm/app/globals.css`:
- stronger top header bar and consistent footer,
- functional sidebar `Settings` destination,
- functional bell control and avatar dropdown (`Profile`, `Settings`, `Logout`),
- clickable KPI cards with lead-table drill-through presets.
2. Delivered reusable Lead Profile Modal upgrades:
- modal opens from activity feed, lead cards, contacts list, search autocomplete, leads table rows, and pipeline cards,
- full lead/contact detail surface with inline edits and save actions,
- unsaved-change close guard,
- explicit `Last Contact` and editable `Next Action` field handling,
- integrated notes/activity timeline with website behavior events.
3. Added dedicated sortable Leads Table view/tab with required columns:
- `Name`, `Lead Type`, `Status`, `Price Range`, `Location`, `Last Contact`, `Beds/Baths/Size desired`, `Source`, `Updated At`.
4. Completed pipeline-specific interaction fixes:
- sticky top-aligned lane headers and reduced empty lane gaps,
- explicit independent pipeline filters with clear-all `All` behavior,
- status-change filter-conflict notice,
- visible left/right lane scroll arrow controls,
- actionable pipeline save behavior.
5. Added CRM API/data enhancements for modal/table drill-in and inline editing:
- `GET /api/leads/[leadId]` for lead detail,
- `PATCH /api/contacts/[contactId]` for tenant-scoped inline contact edits,
- expanded `PATCH /api/leads/[leadId]` field support for lead inline updates,
- shared db helpers in `packages/db/src/crm.ts`: `getLeadByIdForTenant`, `updateContactForTenant`.
6. Centralized CRM display label mapping in `apps/crm/app/lib/crm-display.ts` including `website_valuation` => `Valuation Request`.

### Immediate Next Steps
- Run browser-level UX QA pass across dashboard/pipeline/leads/settings flows and record any final defects.
- Add focused regression tests for newly added CRM route surfaces and high-value UI interaction logic.
- Continue periodic Windows-authoritative Prisma reliability sampling as maintenance (`db:generate:sample -- 10+`) after environment restarts.

### Session Validation (2026-02-17 CRM Checklist Completion)
- `npm run lint --workspace @real-estate/crm` passes with pre-existing warnings only in `apps/crm/scripts/seed-mock-data.ts` (unused eslint-disable directives).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/crm"` passes (`18/18` tests).
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` passes.
- `npm run test:routes --workspace @real-estate/crm` from WSL sandbox remains non-authoritative/fails due `tsx` IPC permission (`listen EPERM /tmp/tsx-1000/*.pipe`).
- `npm run build --workspace @real-estate/crm` from WSL sandbox remains non-authoritative/fails due missing Linux SWC binary in this mixed Windows/WSL dependency state.
- `cmd.exe /c "... npm run build --workspace @real-estate/crm"` could not be executed from this sandbox due WSL vsock bridge failure (`UtilBindVsockAnyPort socket failed 1`).

## Session Update (2026-02-17 CRM Visual Polish + End-Session Handoff)

### Completed This Session
1. Updated CRM hover readability by softening dark highlight behavior in shared CRM styles:
- KPI cards no longer darken text/background on hover.
- Inline lead/address links and sortable table header buttons now use subtle, readable hover treatment via shared tokenized style.
2. Added first-wave CRM visual uplift in `apps/crm/app/components/crm-workspace.tsx` and `apps/crm/app/globals.css`:
- tenant-scoped branding controls (brand name, logo source, accent/tint, texture toggle) persisted per tenant in local workspace preferences,
- stronger shell presentation (brand lockups in sidebar/header/footer, greeting context),
- dashboard liveliness improvements (KPI sparklines, weekly rhythm strip, richer empty states).
3. Prepared next-session priority for second-pass UI cleanup:
- typography hierarchy refinement is now the explicit first task in `.brain` docs to run immediately after `platform-session-bootstrap`.

### Session Validation (2026-02-17 CRM Visual Polish + End-Session Handoff)
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` passes.
- `npm run lint --workspace @real-estate/crm` passes with pre-existing warnings only in `apps/crm/scripts/seed-mock-data.ts` (unused eslint-disable directives).
- `npm run test:routes --workspace @real-estate/crm` from this WSL/Linux shell fails due environment mismatch: installed `@esbuild/win32-x64` but runtime expects `@esbuild/linux-x64` for this shell context.

## Session Update (2026-02-18 CRM Typography + QA + Regression Coverage)

### Completed This Session
1. Completed second-pass CRM typography and readability polish in `apps/crm/app/globals.css`:
- tightened heading/body line-height rhythm and scale consistency across dashboard, pipeline, table, modal, and settings surfaces,
- increased dense table/pipeline text legibility,
- normalized interactive focus-visible states and hover contrast for keyboard/pointer readability.
2. Added reusable dashboard/pipeline interaction helpers in `apps/crm/app/lib/workspace-interactions.ts` and wired `apps/crm/app/components/crm-workspace.tsx` to consume them for:
- lead table preset filtering behavior,
- pipeline move notice behavior under active filters,
- navigation-to-view resolution,
- table sort toggle state transitions.
3. Expanded CRM regression coverage:
- added new route edge-case tests for lead-detail/contact-patch surfaces in `apps/crm/app/api/lib/routes.integration.test.ts` (invalid JSON, empty updates, not-found behavior, and status-activity side-effect guard),
- added new interaction-logic tests in `apps/crm/app/lib/workspace-interactions.test.ts`.

### Session Validation (2026-02-18 CRM Typography + QA + Regression Coverage)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/crm"` passes (only pre-existing warnings in `apps/crm/scripts/seed-mock-data.ts`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/crm"` passes (`25/25` tests).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:workspace --workspace @real-estate/crm"` passes (`4/4` tests).
- `./node_modules/.bin/tsc --noEmit --project apps/crm/tsconfig.json` passes in this shell.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && .\node_modules\.bin\tsc.cmd --noEmit --project apps\crm\tsconfig.json"` passes.
- `npm run build --workspace @real-estate/crm` from this WSL/Linux shell remains non-authoritative/fails due missing Linux SWC binary in mixed Windows/WSL dependency state.

## Session Update (2026-02-18 Admin Onboarding UX)

### Completed This Session
1. Reworked `apps/admin/app/components/control-plane-workspace.tsx` into a high-usability operator flow:
- multi-step Guided Tenant Onboarding wizard (Tenant Basics -> Primary Domain -> Plan & Features -> Review & Provision),
- KPI summary cards and tenant directory with explicit Domain Ops entry,
- selected-tenant Domain Operations panel with readiness checklist, domain status actions, and settings save flow,
- preserved existing control-plane API integration boundaries (`/api/tenants`, `/domains`, `/settings`, `/admin-audit`).
2. Upgraded admin visual polish in `apps/admin/app/globals.css`:
- cohesive design tokens, elevated card/surface hierarchy, refined spacing/typography,
- responsive layout behavior for desktop/tablet/mobile,
- clearer affordances for stepper, plan/feature selection, readiness checks, and status chips.
3. Updated admin typography stack and auth shells:
- added `Manrope` + `Fraunces` in `apps/admin/app/layout.tsx`,
- styled sign-in/sign-up wrappers in `apps/admin/app/sign-in/[[...sign-in]]/page.tsx` and `apps/admin/app/sign-up/[[...sign-up]]/page.tsx`.

### Session Validation (2026-02-18 Admin Onboarding UX)
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`13/13`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- Workspace-level lint currently reports a pre-existing unrelated error in `apps/admin/app/api/lib/admin-access.ts` (`@typescript-eslint/no-explicit-any` at line 54).
- Targeted lint for touched admin UX files passes:
  - `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin -- app/components/control-plane-workspace.tsx app/layout.tsx app/sign-in/[[...sign-in]]/page.tsx app/sign-up/[[...sign-up]]/page.tsx"`.

## Session Update (2026-02-18 Admin Mutation Error Transparency)

### Completed This Session
1. Added centralized admin mutation error interpretation in `apps/admin/app/lib/mutation-error-guidance.ts`:
- parses mutation scope + HTTP status + backend error text,
- maps RBAC-denied, duplicate slug/domain collisions, and required/validation failures into operator-friendly guidance,
- returns field-level hints plus next-step actions and onboarding step focus metadata.
2. Wired scoped mutation guidance into `apps/admin/app/components/control-plane-workspace.tsx`:
- replaced global raw error strings with structured error panel (`summary`, `detail`, `next steps`),
- added inline field-level errors for onboarding (`name`, `slug`, `primaryDomain`), domain attach (`hostname`), and settings (`planCode`, `featureFlags`),
- auto-focuses wizard step when onboarding failures map to earlier required fields.
3. Extended admin UI styling in `apps/admin/app/globals.css` for error affordances:
- highlighted invalid inputs/selects,
- compact inline error copy treatment,
- structured top-level error panel styling for operator guidance readability.

### Session Validation (2026-02-18 Admin Mutation Error Transparency)
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`13/13`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- Targeted `npm run lint --workspace @real-estate/admin -- app/components/control-plane-workspace.tsx app/lib/mutation-error-guidance.ts` is non-authoritative in this sandbox (bash lint process timed out; Windows cmd lint path failed with WSL vsock bridge error).

## Session Update (2026-02-19 Admin Domain Automation + Plan Governance)

### Completed This Session
1. Delivered domain-operations automation controls in `apps/admin/app/components/control-plane-workspace.tsx`:
- added `Poll Domain Status Now` and optional auto-polling with interval controls,
- added per-domain `Retry Verification` controls with retry-count visibility,
- added explicit DNS + SSL readiness indicator cards for selected-tenant launch posture.
2. Delivered plan/feature governance UX in admin onboarding + tenant settings:
- added shared governance helper `apps/admin/app/lib/plan-governance.ts` with per-plan template/required/allowed rule sets,
- enforced guardrail checks before provisioning/settings save when overrides are not enabled,
- added operator-facing governance summaries (`missing required`, `outside plan`, `recommended`) and explicit override toggles,
- added `Enforce Guardrails` action to normalize tenant feature flags to plan policy.
3. Preserved existing tenant-scoped control-plane boundaries (`/api/tenants`, `/domains`, `/settings`, `/admin-audit`) while improving operator guidance/consistency.

### Session Validation (2026-02-19 Admin Domain Automation + Plan Governance)
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`13/13`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- Manual browser click-through remains pending/non-authoritative in this sandbox session:
  - `npm run dev:admin` failed to bind local port in this environment (`listen EPERM 0.0.0.0:3002`), so desktop/laptop viewport interaction checks could not be executed here.

## Session Update (2026-02-19 Admin Backend Domain Probe Integration)

### Completed This Session
1. Added backend-driven domain probe surface in admin API:
- new shared probe helper `apps/admin/app/api/lib/domain-probe.ts` now performs DNS checks (`A`, `AAAA`, `CNAME`) plus TLS certificate probes for domain readiness,
- new route `apps/admin/app/api/tenants/[tenantId]/domains/probe/route.ts` returns tenant-scoped authoritative probe payloads (`dnsStatus`, `certificateStatus`, messages, cert validity, observed records),
- `.localhost` domains are handled with explicit development-safe probe semantics.
2. Wired Domain Ops UI to authoritative probe results in `apps/admin/app/components/control-plane-workspace.tsx`:
- `Poll Domain Status Now` and `Retry Verification` now call backend probes (not refresh-only),
- readiness checks and DNS/SSL cards now prefer probe statuses/messages when available,
- per-domain cards now show DNS/TLS states, probe guidance, observed DNS records, and certificate expiry when present.
3. Added route-level regression coverage for domain probe endpoint in `apps/admin/app/api/lib/routes.integration.test.ts`:
- tenant-missing 404 behavior,
- domain-filtered probe behavior + payload shape assertions.

### Session Validation (2026-02-19 Admin Backend Domain Probe Integration)
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `npm run test:routes --workspace @real-estate/admin` in this WSL sandbox remains non-authoritative/fails due `tsx` IPC pipe permissions (`listen EPERM /tmp/tsx-1000/*.pipe`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`15/15`, includes new domain probe route tests).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes new route `/api/tenants/[tenantId]/domains/probe`.
- Manual browser validation tasks remain blocked in this sandbox:
  - `npm run dev:admin` fails bind with `listen EPERM 0.0.0.0:3002`,
  - `npm run dev:crm` fails bind with `listen EPERM 0.0.0.0:3001` (and non-authoritative Linux SWC mismatch in this mixed Windows/WSL dependency state).

## Session Update (2026-02-20 Prisma Reliability Sampling + Priority Reset)

### Completed This Session
1. Ran Windows-authoritative Prisma reliability sampling per open maintenance task using 12 attempts.
2. Recorded a sharp reliability regression (`0/12` pass, all failures `EPERM` lock) and elevated Prisma stability work back to active priority.
3. Deferred both manual full-browser review tasks (Admin + CRM) until post-improvement UI/UX passes are complete per current product direction.

### Session Validation (2026-02-20 Prisma Reliability Sampling + Priority Reset)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` returns JSON summary with `passed: 0`, `failed: 12`, `passRate: 0`, `failureRate: 100`, and `epermLockFailures: 12`.
- All 12 attempts reported Prisma engine rename-lock failure (`EPERM: operation not permitted, rename ... query_engine-windows.dll.node`), including after built-in direct-wrapper retries.

## Session Update (2026-02-20 Prisma Recovery + RBAC + Observability Delivery)

### Completed This Session
1. Implemented next Prisma Windows lock mitigation in `packages/db/scripts/db-generate-direct.mjs`:
- preflight rename-lock detection with existing-client reuse checks,
- default `DATABASE_URL` resolution when unset,
- preservation of current generated engine artifact during cleanup to avoid destroying reusable healthy client,
- runtime load-probe fallback when query probe cannot be established.
2. Implemented Admin RBAC management and support-session workflows:
- added persistence model/migration `TenantControlActor` (`packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/202602200001_add_tenant_control_actors/migration.sql`),
- added shared db helper surface in `packages/db/src/control-plane.ts` for actor list/upsert/update/remove and support session state transitions,
- added Admin API routes for actor lifecycle and support sessions in `apps/admin/app/api/tenants/[tenantId]/actors/*`,
- added full operator UI in `apps/admin/app/components/control-plane-workspace.tsx` for actor onboarding, role/permission matrix controls, and support-session start/end actions.
3. Implemented control-plane observability dashboard:
- added shared summary helper `getControlPlaneObservabilitySummary` in `packages/db/src/control-plane.ts`,
- added API route `apps/admin/app/api/observability/route.ts`,
- added Admin UI surfaces for mutation trend counts, ingestion runtime/queue health, and tenant readiness scoreboards in `apps/admin/app/components/control-plane-workspace.tsx`.
4. Extended admin route integration coverage in `apps/admin/app/api/lib/routes.integration.test.ts` for actors, support sessions, and observability endpoint behavior.

### Session Validation (2026-02-20 Prisma Recovery + RBAC + Observability Delivery)
- `node --check packages/db/scripts/db-generate-direct.mjs` passes.
- `./node_modules/.bin/tsc --noEmit --project packages/types/tsconfig.json` passes.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`22/22`, includes new actor/support-session/observability route tests).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes new routes:
  - `/api/observability`
  - `/api/tenants/[tenantId]/actors`
  - `/api/tenants/[tenantId]/actors/[actorId]`
  - `/api/tenants/[tenantId]/actors/[actorId]/support-session`
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` passes and applies migration `202602200001_add_tenant_control_actors`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` now passes with `12/12` success (`passRate: 100`, `epermLockFailures: 0`).

## Session Update (2026-02-20 Admin Audit Timeline UX Expansion)

### Completed This Session
1. Expanded audit read/filter API in `apps/admin/app/api/admin-audit/route.ts`:
- added richer query filters (`actorRole`, `actorId`, `requestId`, `changedField`, `search`, `from`, `to`, `errorsOnly`) while preserving tenant/global scope behavior.
- improved global feed retrieval depth by increasing per-tenant upstream fetch window before filter/slice.
2. Added stronger actor/request attribution metadata capture across admin mutation paths:
- added `buildAuditRequestMetadata` + metadata pass-through in `apps/admin/app/api/lib/admin-access.ts`,
- wired mutation route success/failure logs to include request attribution and structured `changes` metadata in:
  - `apps/admin/app/api/tenants/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/domains/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/domains/[domainId]/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/settings/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/actors/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/actors/[actorId]/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/actors/[actorId]/support-session/route.ts`
3. Delivered advanced audit timeline UX in `apps/admin/app/components/control-plane-workspace.tsx` and `apps/admin/app/globals.css`:
- new filter controls for actor/request/date/change-field/search/error-only plus adjustable result limit,
- stronger attribution chips (request id/method/path),
- diff-style change detail rendering from audit metadata,
- operator export controls for filtered CSV and JSON output.
4. Extended admin route integration tests in `apps/admin/app/api/lib/routes.integration.test.ts`:
- updated global aggregation expectation for deeper upstream fetch window,
- added coverage for combined advanced filter behavior (actor/request/date/change-field/error/search).

### Session Validation (2026-02-20 Admin Audit Timeline UX Expansion)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`23/23`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.

## Session Update (2026-02-20 Admin Data Safety/Recovery Controls)

### Completed This Session
1. Added status-based soft-delete/restore persistence for control-plane entities:
- schema/migration updates in `packages/db/prisma/schema.prisma` and `packages/db/prisma/migrations/202602200002_add_control_plane_soft_delete_status/migration.sql` add `status` to `TenantDomain` and `TenantControlSettings`,
- shared lifecycle support in `packages/db/src/control-plane.ts` (`updateTenantLifecycleStatus`, status-aware domain/settings updates, readiness logic updates),
- tenant resolution guard updated in `packages/db/src/tenants.ts` to ignore archived domains in hostname resolution.
2. Added Admin API lifecycle control-plane endpoints/behavior:
- new tenant lifecycle route `apps/admin/app/api/tenants/[tenantId]/status/route.ts`,
- extended `apps/admin/app/api/tenants/[tenantId]/domains/[domainId]/route.ts` and `apps/admin/app/api/tenants/[tenantId]/settings/route.ts` to accept status updates,
- updated `apps/admin/app/api/tenants/[tenantId]/domains/probe/route.ts` to probe only active domains,
- audit action support extended for `tenant.status.update` in `apps/admin/app/api/admin-audit/route.ts`.
3. Delivered Admin UI safety/recovery controls and destructive confirmations in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/globals.css`:
- archive/restore tenant actions in Tenant Directory,
- archive/restore domain actions in Domain Ops cards,
- archive/restore settings actions and edit-lock behavior while archived,
- stronger status visibility across tenant/domain/settings chips and readiness gating,
- confirmation prompts for destructive lifecycle actions.
4. Expanded route integration coverage in `apps/admin/app/api/lib/routes.integration.test.ts`:
- added tenant status route tests,
- added domain/settings lifecycle status mutation tests,
- updated fixtures for new status fields.

### Session Validation (2026-02-20 Admin Data Safety/Recovery Controls)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` passes and applies migration `202602200002_add_control_plane_soft_delete_status`.
- `npm run db:generate:direct --workspace @real-estate/db` required a forced non-reuse regeneration path in this shell to refresh generated client metadata for the new schema fields.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`27/27`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes route `/api/tenants/[tenantId]/status`.

## Session Update (2026-02-20 Admin Diagnostics + Billing Workflow Baseline)

### Completed This Session
1. Delivered tenant support diagnostics toolkit:
- added shared diagnostics/remediation helpers in `packages/db/src/control-plane.ts`,
- added Admin diagnostics API route `apps/admin/app/api/tenants/[tenantId]/diagnostics/route.ts`,
- added diagnostics UI section in `apps/admin/app/components/control-plane-workspace.tsx` with tenant-scoped auth/domain/ingestion checks and one-click remediation actions.
2. Delivered billing/subscription control-plane baseline:
- added Prisma model + migration `TenantBillingSubscription` (`packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/202602200003_add_tenant_billing_subscriptions/migration.sql`) and seed baseline update,
- added shared helpers `getTenantBillingSubscription` / `updateTenantBillingSubscription` in `packages/db/src/control-plane.ts`,
- added Admin billing API route `apps/admin/app/api/tenants/[tenantId]/billing/route.ts`,
- added Admin billing workflow UI controls in `apps/admin/app/components/control-plane-workspace.tsx` for plan transitions, payment/trial state visibility, and optional entitlement sync.
3. Expanded route-level regression coverage and audit plumbing:
- extended `apps/admin/app/api/lib/routes.integration.test.ts` with diagnostics and billing GET/PATCH coverage (including non-admin guard assertions),
- extended audit action handling/filtering for `tenant.billing.update` and `tenant.diagnostics.remediate` in `packages/types/src/control-plane.ts`, `apps/admin/app/api/admin-audit/route.ts`, and Admin timeline filter options.

### Session Validation (2026-02-20 Admin Diagnostics + Billing Workflow Baseline)
- `./node_modules/.bin/tsc --noEmit --project packages/types/tsconfig.json` passes.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`33/33`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes new routes:
  - `/api/tenants/[tenantId]/diagnostics`
  - `/api/tenants/[tenantId]/billing`
- Known unrelated baseline issue remains in shared db typecheck:
  - `./node_modules/.bin/tsc --noEmit --project packages/db/tsconfig.json` fails due existing unresolved import path `@real-estate/types/website-config` in `packages/db/src/seed-data.ts` and `packages/db/src/website-config.ts`.

## Session Update (2026-02-20 Billing Provider Reconciliation Hook)

### Completed This Session
1. Added provider-event reconciliation boundary in shared db layer:
- added `reconcileTenantBillingProviderEvent` in `packages/db/src/control-plane.ts` with tenant resolution by explicit tenant id or persisted provider/customer identifiers,
- added idempotent sync-event persistence model `TenantBillingSyncEvent` via schema/migration updates (`packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/202602200004_add_tenant_billing_sync_events/migration.sql`),
- preserved entitlement sync behavior through existing `updateTenantBillingSubscription` path.
2. Added webhook ingestion route for provider billing events:
- new route `apps/admin/app/api/billing/webhooks/route.ts` accepts normalized provider events (`provider`, `eventId`, `eventType`, subscription state payload),
- optional secret-gate support via `ADMIN_BILLING_WEBHOOK_SECRET`,
- emits audit records under `tenant.billing.sync` and returns `200` for applied/duplicate events and `202` for unresolved tenant mappings.
3. Expanded audit/read/test coverage:
- extended audit action parsing and UI filter options to include `tenant.billing.sync`,
- added route integration tests in `apps/admin/app/api/lib/routes.integration.test.ts` for webhook auth guard, successful reconcile flow, and unresolved-tenant reconciliation behavior.

### Session Validation (2026-02-20 Billing Provider Reconciliation Hook)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` passes and applies migrations:
  - `202602200003_add_tenant_billing_subscriptions`
  - `202602200004_add_tenant_billing_sync_events`
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:direct --workspace @real-estate/db"` completes (lock-reuse fallback path) and generated client includes `TenantBillingSyncEvent`.
- `./node_modules/.bin/tsc --noEmit --project packages/types/tsconfig.json` passes.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`36/36`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes route `/api/billing/webhooks`.

## Session Update (2026-02-20 Billing Webhook Signature + Payload Normalization Hardening)

### Completed This Session
1. Implemented strict provider-native Stripe webhook verification in `apps/admin/app/api/billing/webhooks/route.ts`:
- added raw-body signature verification using `stripe-signature` HMAC checks,
- introduced configurable Stripe secret/tolerance support (`ADMIN_BILLING_STRIPE_WEBHOOK_SECRET`, optional tolerance override),
- preserved existing secret-gated normalized/manual webhook path (`ADMIN_BILLING_WEBHOOK_SECRET`) for non-Stripe/manual events.
2. Implemented Stripe payload normalization into shared reconciliation input in `apps/admin/app/api/billing/webhooks/route.ts`:
- mapped Stripe event envelope/object fields into `TenantBillingProviderEventInput`,
- normalized tenant/customer/subscription identifiers plus subscription status/payment/period data,
- extracted metadata-based plan/entitlement hints and synchronized entitlement flags when present.
3. Expanded route-level hardening coverage in `apps/admin/app/api/lib/routes.integration.test.ts`:
- added regression coverage for normalized-Stripe rejection without provider-native signature path,
- added invalid-signature rejection coverage,
- added verified Stripe normalization flow assertions before reconciliation,
- preserved unresolved-tenant reconciliation behavior using provider-native signed payload flow.

### Session Validation (2026-02-20 Billing Webhook Signature + Payload Normalization Hardening)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`38/38`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes route `/api/billing/webhooks`.

## Session Update (2026-02-20 Billing Entitlement Drift Detection + Reporting)

### Completed This Session
1. Added entitlement drift summary contracts in `packages/types/src/control-plane.ts`:
- introduced `TenantBillingEntitlementDriftSummary` and attached it to `TenantBillingProviderEventResult`.
2. Implemented shared drift detection during billing reconciliation in `packages/db/src/control-plane.ts`:
- compares provider entitlement flags against persisted tenant settings feature flags after reconciliation,
- reports deterministic drift states across applied, duplicate, and unresolved-tenant outcomes,
- preserves tenant isolation by scoping all comparisons to resolved tenant ids only.
3. Extended webhook reporting in `apps/admin/app/api/billing/webhooks/route.ts`:
- includes drift summary details in webhook response result payloads,
- emits drift indicators in `tenant.billing.sync` audit metadata (`mode`, drift detected flag, missing/extra counts).
4. Expanded route-level coverage in `apps/admin/app/api/lib/routes.integration.test.ts`:
- added explicit drift-report assertion coverage for signed Stripe webhook flows,
- preserved existing signature verification/normalization and unresolved-tenant behaviors.

### Session Validation (2026-02-20 Billing Entitlement Drift Detection + Reporting)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`39/39`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes route `/api/billing/webhooks`.

## Session Update (2026-02-20 Billing Drift Operator Triage Surfaces)

### Completed This Session
1. Added billing drift triage UX in Admin workspace (`apps/admin/app/components/control-plane-workspace.tsx`):
- added per-tenant entitlement drift signal surface in Billing & Subscription Operations,
- added latest drift event summaries (mode, missing/extra counts, request/status context),
- added one-click `Open in Audit Timeline` preset for `tenant.billing.sync` + `entitlementDriftDetected` investigation.
2. Added audit-focused drift investigation guidance in Admin audit timeline (`apps/admin/app/components/control-plane-workspace.tsx`):
- added drift-preset contextual guidance copy,
- surfaced drift chips directly on matching `tenant.billing.sync` audit rows for faster triage.
3. Added supporting Admin UI styling in `apps/admin/app/globals.css` for drift triage cards/list/guidance states.

### Session Validation (2026-02-20 Billing Drift Operator Triage Surfaces)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`39/39`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.

## Session Update (2026-02-20 Billing Drift Remediation Shortcuts)

### Completed This Session
1. Added operator remediation shortcuts in billing drift triage UI (`apps/admin/app/components/control-plane-workspace.tsx`):
- surfaced missing/extra entitlement flag names per drift signal,
- added one-click actions for `Add Missing Flags`, `Remove Extra Flags`, and `Apply Both`,
- wired actions to update tenant settings feature-flag drafts and automatically arm billing entitlement sync.
2. Added explicit operator save-order guidance in drift remediation flows:
- workspace notices now instruct operators to `Save Settings` and then `Save Billing Workflow` after quick actions.
3. Extended billing sync audit drift metadata payload shape in `apps/admin/app/api/billing/webhooks/route.ts`:
- now includes `entitlementMissingFlags` and `entitlementExtraFlags` arrays for actionable remediation context.

### Session Validation (2026-02-20 Billing Drift Remediation Shortcuts)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`39/39`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.

## Session Update (2026-02-20 Billing Drift Remediation Regression Coverage)

### Completed This Session
1. Extracted pure remediation computation helper in `apps/admin/app/lib/billing-drift-remediation.ts`:
- centralizes missing/extra/all entitlement drift flag reconciliation logic,
- returns deterministic mutation counts and entitlement-sync arming signals.
2. Wired Admin billing remediation UI to the shared helper in `apps/admin/app/components/control-plane-workspace.tsx`:
- preserves existing operator behavior while reducing inline state-mutation complexity.
3. Added focused automated coverage in `apps/admin/app/api/lib/routes.integration.test.ts`:
- validates missing-mode add behavior + sync arming,
- validates extra-mode removal behavior + sync arming,
- validates combined all-mode add/remove behavior + sync arming,
- validates non-actionable input behavior (no sync arming).

### Session Validation (2026-02-20 Billing Drift Remediation Regression Coverage)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`43/43`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.

## Session Update (2026-02-20 Billing Drift Observability Summary + Prisma Reliability Sampling)

### Completed This Session
1. Added observability-level billing drift summary reporting across tenants:
- expanded shared contracts in `packages/types/src/control-plane.ts` (`ControlPlaneBillingDriftSummary`, `ControlPlaneBillingDriftTenantSummary`, mode-count types) and attached them to `ControlPlaneObservabilitySummary`,
- extended `getControlPlaneObservabilitySummary` in `packages/db/src/control-plane.ts` to aggregate 7-day `tenant.billing.sync` drift signals from durable audit metadata (`entitlementDriftDetected`, mode, missing/extra counts) and emit tenant-level drift rollups,
- added Admin observability UI surfaces in `apps/admin/app/components/control-plane-workspace.tsx` (new KPI card + `Billing Drift Summary` panel with totals/mode counts/per-tenant latest-drift rows),
- updated responsive KPI layout in `apps/admin/app/globals.css` for the added observability metric card.
2. Executed the periodic Windows-authoritative Prisma reliability sample and recorded trend evidence:
- `db:generate:sample -- 12 --json --exit-zero` returned `passed: 12`, `failed: 0`, `passRate: 100`, `epermLockFailures: 0`,
- post-sample ingestion runtime check via `worker:ingestion:drain` completed clean with zero processed/failed/dead-lettered jobs.

### Session Validation (2026-02-20 Billing Drift Observability Summary + Prisma Reliability Sampling)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`43/43`) after observability summary payload/UI updates.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` passes (`12/12`, `0` `EPERM` failures).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes (`totalProcessed: 0`, `totalFailed: 0`, `totalDeadLettered: 0`).
- `./node_modules/.bin/tsc --noEmit --project packages/types/tsconfig.json` passes.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes after tightening webhook test capture typing in `apps/admin/app/api/lib/routes.integration.test.ts`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes and includes route `/api/observability`.

## Session Update (2026-02-20 GTM Baseline Definition + Reliability Maintenance)

### Completed This Session
1. Closed remaining Business/GTM definition backlog for the current phase in `.brain/PRODUCT_SPEC.md`:
- defined canonical four-tier plan matrix (`starter`, `growth`, `pro`, `team`) with feature coverage and commercial targets in section `5.1`,
- defined setup package scope and onboarding SLA policy in section `5.2`,
- defined managed services catalog and operating model (staffing/cadence/fulfillment SLA) in section `5.3`.
2. Continued periodic Windows-authoritative Prisma reliability maintenance:
- re-ran `db:generate:sample -- 12 --json --exit-zero` and recorded stable outcomes (`12/12` pass, `0` `EPERM` failures),
- re-ran post-sample ingestion runtime check with clean drain summary.
3. Removed the last blocking Admin typecheck regression from route tests:
- tightened Stripe webhook capture typing in `apps/admin/app/api/lib/routes.integration.test.ts` so `apps/admin` `tsc --noEmit` is now clean again.

### Session Validation (2026-02-20 GTM Baseline Definition + Reliability Maintenance)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` passes (`12/12`, `0` `EPERM` failures).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes (`totalProcessed: 0`, `totalFailed: 0`, `totalDeadLettered: 0`).
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes after route-test typing fix.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`43/43`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.

## Session Update (2026-02-22 Admin Workspace UX Clarity Pass)

### Completed This Session
1. Improved Admin portal information architecture in `apps/admin/app/components/control-plane-workspace.tsx`:
- renamed core sections in operator language (`Create a Tenant`, `Choose a Tenant`, `Launch Setup`, etc.),
- added a top-level `Start Here` workspace guide with guided/full workspace mode selection,
- added a selected-tenant status summary with readiness percentage and plain-language next-step guidance.
2. Reduced initial operator overwhelm with progressive disclosure:
- added Guided mode default that hides advanced panels (diagnostics, billing, access, platform health, audit log) until explicitly shown,
- added a dedicated `Advanced Tools` toggle card to reveal hidden operational panels when needed.
3. Added supporting Admin UI styles in `apps/admin/app/globals.css` for workspace guide cards, mode controls, and guided-mode panel visibility behavior.
4. Manual browser QA remains intentionally deferred while active buildout continues (per current product-direction/user override).

### Session Validation (2026-02-22 Admin Workspace UX Clarity Pass)
- `timeout 60s ./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json --pretty false` passes (no diagnostics emitted).
- WSL direct ESLint invocation remains non-authoritative here (`ESLint` root config discovery mismatch when not using workspace command).
- Windows-authoritative `cmd.exe` lint invocation from this sandbox could not run due WSL vsock bridge failure (`UtilBindVsockAnyPort socket failed 1`).

## Session Update (2026-02-22 Admin Task Tabs + Action Center + GTM Baseline Propagation)

### Completed This Session
1. Expanded Admin portal usability in `apps/admin/app/components/control-plane-workspace.tsx` + `apps/admin/app/globals.css`:
- added task-based workspace tabs (`Create & Launch`, `Support`, `Billing`, `Access`, `Platform Health`, `Audit Log`) to reduce cognitive load,
- added a tenant `Action Center` with prioritized blocker/warning/info items and one-click navigation into the relevant tab/section,
- added inline glossary/help tooltips for key operator terms (`guardrails`, `entitlement drift`, `support session`, `observability`, `audit actions`).
2. Propagated GTM plan/onboarding/service baselines into Admin onboarding defaults/help surfaces:
- centralized canonical plan pricing/ICP/setup scope/SLA/managed-service references in `apps/admin/app/lib/commercial-baselines.ts`,
- enriched onboarding plan cards + review/provision step with pricing targets, ICP summaries, setup package scope, SLA timeline/policy notes, and managed-service cross-sell references.
3. Added operator-facing enablement artifact `project_tracking/operator_onboarding_runbook.md` covering the high-touch sales -> ops -> build -> launch workflow, canonical plan matrix usage, onboarding SLA, change-order triggers, and post-launch managed-services expansion.
4. Continued Prisma reliability maintenance:
- re-ran Windows-authoritative `db:generate:sample -- 12 --json --exit-zero` and observed `12/12` pass (`0` `EPERM` lock failures).

### Session Validation (2026-02-22 Admin Task Tabs + Action Center + GTM Baseline Propagation)
- `timeout 90s ./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json --pretty false` passes (no diagnostics emitted) after Admin UI + commercial baseline updates.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` passes (`12/12`, `0` `EPERM` failures).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` fails in this mixed WSL/Windows dependency state due `esbuild` platform binary mismatch (`@esbuild/linux-x64` vs `@esbuild/win32-x64`); treat as non-authoritative for Windows runtime health.

## Session Update (2026-02-22 Admin Workspace Decomposition + Action Center Tests + GTM Defaults)

### Completed This Session
1. Started Admin workspace component decomposition by extracting new task-navigation surfaces out of `control-plane-workspace.tsx`:
- `apps/admin/app/components/control-plane/ActionCenterPanel.tsx`
- `apps/admin/app/components/control-plane/WorkspaceTaskTabs.tsx`
2. Extracted Action Center prioritization into a pure helper with focused automated tests:
- helper: `apps/admin/app/lib/action-center.ts`
- tests: `apps/admin/app/lib/action-center.test.ts`
3. Converted GTM baseline propagation from reference-only guidance into operator-usable defaults:
- added plan-tier onboarding checklist templates and actor seed presets in `apps/admin/app/lib/commercial-baselines.ts`,
- wired plan-tier onboarding checklist template display into Launch Setup,
- wired plan-based actor seed preset buttons into Access tab to prefill add-actor drafts.
4. Continued preserving non-CRM/no-manual-QA scope per current user directive.

### Session Validation (2026-02-22 Admin Workspace Decomposition + Action Center Tests + GTM Defaults)
- `node --import tsx --test apps/admin/app/lib/action-center.test.ts` passes.
- `timeout 90s ./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json --pretty false` passes after helper extraction/component split and GTM default wiring.

## Session Update (2026-02-22 Admin Panel Body Extraction + Tab Metrics Helper + Onboarding Task Persistence Design)

### Completed This Session
1. Continued Admin workspace decomposition by extracting additional tab bodies out of `control-plane-workspace.tsx`:
- `apps/admin/app/components/control-plane/SupportTabBody.tsx`
- `apps/admin/app/components/control-plane/PlatformHealthTabBody.tsx`
2. Extracted workspace task-tab metric computation into a tested pure helper:
- helper: `apps/admin/app/lib/workspace-task-metrics.ts`
- tests: `apps/admin/app/lib/workspace-task-metrics.test.ts`
3. Added a durable onboarding-task persistence design proposal for future Admin workflow state:
- `project_tracking/admin_onboarding_task_persistence_design.md` (schema/API/UI rollout proposal for `TenantOnboardingPlan` + `TenantOnboardingTask`)

### Session Validation (2026-02-22 Admin Panel Body Extraction + Tab Metrics Helper + Onboarding Task Persistence Design)
- `node --import tsx --test apps/admin/app/lib/action-center.test.ts apps/admin/app/lib/workspace-task-metrics.test.ts` passes.
- `timeout 90s ./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json --pretty false` passes after support/health body extraction and tab-metrics helper wiring.

## Session Update (2026-02-22 Admin Billing/Access/Audit Body Extraction Completion)

### Completed This Session
1. Continued Admin workspace decomposition by extracting the remaining task-tab bodies out of `apps/admin/app/components/control-plane-workspace.tsx`:
- `apps/admin/app/components/control-plane/BillingTabBody.tsx`
- `apps/admin/app/components/control-plane/AccessTabBody.tsx`
- `apps/admin/app/components/control-plane/AuditTabBody.tsx`
2. Rewired `apps/admin/app/components/control-plane-workspace.tsx` to consume the new tab-body components while preserving tenant-scoped operator behavior:
- billing/subscription editing and entitlement-drift triage/remediation remain tenant-scoped,
- access/RBAC and support-session controls remain tenant-scoped,
- audit timeline filters and event rendering/export wiring remain tenant-scoped and behaviorally unchanged.
3. Preserved current execution constraints per user direction:
- no CRM work in this stream,
- manual browser walkthroughs remain deferred until additional buildout is complete.

### Session Validation (2026-02-22 Admin Billing/Access/Audit Body Extraction Completion)
- `node --import tsx --test apps/admin/app/lib/action-center.test.ts apps/admin/app/lib/workspace-task-metrics.test.ts` passes.
- `timeout 120s ./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json --pretty false` passes after billing/access/audit body extraction wiring.
