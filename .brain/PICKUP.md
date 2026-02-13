# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Stabilize Prisma full-engine local runtime for ingestion scripts on Windows, then add dead-letter observability/re-drive tooling.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- CRM app skeleton and auth boundary are now in place in `apps/crm`.
- CRM core persistence models (`Contact`, `Lead`, `Activity`, `IngestedEvent`) are now in place in `packages/db`.
- Website lead and valuation endpoints now enqueue CRM events through shared queue helpers.
- CRM tenant-scoped APIs, filtering/pagination contracts, and route-level query validation tests are now in place.
- Retry cadence + dead-letter lifecycle and integration flow are now implemented; the blocking gap is reliable full-engine Prisma runtime for local ingestion script execution.

## Current Snapshot
- Completed: host-based tenant resolver + tenant header stamping in `apps/web/proxy.ts`.
- Completed: tenant context consumption in `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts`.
- Completed: root npm workspace tooling and scripts in top-level `package.json` for `apps/web`, `apps/crm`, and `apps/studio`.
- Completed: `packages/types` with tenant/domain/event contracts and `apps/web` tenant typing migration to `@real-estate/types`.
- Completed: `packages/db` tenant/domain persistence baseline with Fairfield seed data and shared tenant lookup functions.
- Completed: `apps/web/app/lib/tenant/resolve-tenant.ts` now resolves host mappings through `@real-estate/db/tenants`.
- Completed: targeted tenant resolution behavior checks in `apps/web/scripts/check-tenant-resolution.ts`.
- Completed: `apps/web/app/api/user/profile/route.ts` and `apps/web/app/api/user/sync/route.ts` now scope profile reads/writes by tenant context.
- Completed: `walkscore` and `googlePlaces` provider cache variants now include tenant scoping, with tenant context threaded from town pages via request headers.
- Completed: explicit `TenantScope` interfaces across remaining static/client providers (`atAGlance`, `taxes`, `schools`, `listings`) and call sites (`town` pages + `home-search`).
- Completed: `apps/web/next.config.ts` sets `experimental.externalDir` and `turbopack.root` for stable monorepo dev resolution.
- Completed: `packages/db` now includes Prisma schema, initial tenant/domain migration SQL, and seed script (`packages/db/prisma/*`).
- Completed: `apps/web` tenant resolution helpers and key call sites now use async shared db lookups with runtime-safe edge fallback.
- Completed: local dependency install and Prisma setup flow (`db:generate`, `db:migrate:deploy`, `db:seed`) for durable tenant records.
- Completed: shared website/module contracts in `packages/types/src/website-config.ts` and exports via `packages/types/src/index.ts`.
- Completed: tenant website/module config persistence scaffolding in `packages/db` (`src/website-config.ts`, schema + migration `202602120002_add_website_module_config`, SQL seed baseline).
- Completed: tenant-scoped module registry consumption in `apps/web` town and neighborhood pages via `apps/web/app/lib/modules/tenant-modules.ts`.
- Completed: module toggle validation coverage in `apps/web/scripts/check-module-toggles.ts`.
- Completed: runtime-safe Prisma fallback hardening in `packages/db` (`src/prisma-client.ts`, `src/tenants.ts`, `src/website-config.ts`) to prevent page crashes when Prisma runtime lookups fail.
- Completed: `apps/crm` workspace scaffold with Clerk-protected middleware and tenant header stamping (`apps/crm/proxy.ts`), plus auth/session API baseline.
- Completed: shared CRM contracts in `packages/types/src/crm.ts` and `packages/types/src/events.ts` (`WebsiteEvent` union export).
- Completed: CRM persistence models/migration in `packages/db/prisma/schema.prisma` and `packages/db/prisma/migrations/202602130001_add_crm_core_models/migration.sql`.
- Completed: shared CRM ingestion/runtime helpers in `packages/db/src/crm.ts` and exports in `packages/db/src/index.ts`.
- Completed: website-to-CRM ingestion wiring in `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts`.
- Completed: CRM dashboard shell now reads tenant-scoped summary and recent activities from shared db helpers in `apps/crm/app/page.tsx`.
- Completed: tenant-scoped CRM API routes in `apps/crm/app/api/leads/route.ts`, `apps/crm/app/api/leads/[leadId]/route.ts`, `apps/crm/app/api/contacts/route.ts`, and `apps/crm/app/api/activities/route.ts`.
- Completed: CRM dashboard UI modules in `apps/crm/app/components/crm-workspace.tsx` now support lead status updates, manual contact capture, and activity note logging.
- Completed: shared CRM db helpers expanded in `packages/db/src/crm.ts` for tenant-scoped list/mutation operations used by CRM routes.
- Completed: queue-first ingestion helpers (`enqueueWebsiteEvent`, `processWebsiteEventQueueBatch`) in `packages/db/src/crm.ts`.
- Completed: ingestion queue persistence model/migration in `packages/db/prisma/schema.prisma` and `packages/db/prisma/migrations/202602130002_add_ingestion_queue_jobs/migration.sql`.
- Completed: website ingestion endpoints now enqueue events (`apps/web/app/api/lead/route.ts`, `apps/web/app/api/valuation/route.ts`) instead of direct CRM writes.
- Completed: ingestion worker scaffold in `services/ingestion-worker` with drain command and root script `worker:ingestion:drain`.
- Completed: Prisma config migration in `packages/db/prisma.config.ts` and removal of deprecated `packages/db/package.json#prisma`.
- Completed: CRM list route query parsing/pagination utilities and validation tests in `apps/crm/app/api/lib/query-params.ts` and `apps/crm/app/api/lib/query-params.test.ts`.
- Completed: Prisma generate reliability mitigation for Windows lock conditions via `packages/db/scripts/db-generate-safe.mjs` and `@real-estate/db` script updates.
- Completed: ingestion queue retry scheduling and dead-letter lifecycle handling in `packages/db/src/crm.ts`.
- Completed: ingestion queue schema update with `nextAttemptAt` and `deadLetteredAt` via migration `packages/db/prisma/migrations/202602130003_add_ingestion_retry_dead_letter/migration.sql`.
- Completed: ingestion runtime readiness guardrails in `packages/db/src/prisma-client.ts` and consumer scripts (`services/ingestion-worker/scripts/drain-once.ts`, `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts`, `apps/web/scripts/check-crm-ingestion.ts`).
- Completed: integration flow script `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` plus root command `npm run test:ingestion:integration`.
- Completed: dead-letter operator tooling in `packages/db/src/crm.ts` (`listDeadLetterQueueJobs`, `requeueDeadLetterQueueJob`, `requeueDeadLetterQueueJobs`) and worker scripts (`services/ingestion-worker/scripts/dead-letter-list.ts`, `services/ingestion-worker/scripts/dead-letter-requeue.ts`).
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run db:migrate:deploy --workspace @real-estate/db` passes and applies migration `202602130001_add_crm_core_models`; `npm run db:generate --workspace @real-estate/db` completes via safe wrapper; `npm run db:seed --workspace @real-estate/db` passes; `npm run lint --workspace @real-estate/web -- app/api/lead/route.ts app/api/valuation/route.ts scripts/check-crm-ingestion.ts` passes; `npm run build --workspace @real-estate/web` passes; `npm run build --workspace @real-estate/crm` passes; `./node_modules/.bin/tsx.cmd apps/web/scripts/check-crm-ingestion.ts` passes and validates idempotency.
- Validation: `npm run lint --workspace @real-estate/crm` passes after CRM API/UI expansion; `npm run build --workspace @real-estate/crm` passes and includes new CRM API routes.
- Validation: `npm run test:routes --workspace @real-estate/crm` passes (5/5) for route query parser and pagination coverage.
- Validation: `npm run db:migrate:deploy --workspace @real-estate/db` passes and applies `202602130002_add_ingestion_queue_jobs`.
- Validation: `npm run db:migrate:deploy --workspace @real-estate/db` passes and applies `202602130003_add_ingestion_retry_dead_letter`.
- Validation: `npm run db:generate --workspace @real-estate/db` and `npm run db:seed --workspace @real-estate/db` pass and load `prisma.config.ts`.
- Validation: `npm run db:generate --workspace @real-estate/db` falls back to `engine=none` in this environment after Windows engine-lock retries.
- Validation: `npm run db:generate:direct --workspace @real-estate/db` fails in this environment with Windows `EPERM` rename lock on Prisma engine DLL.
- Validation: `npm run lint --workspace @real-estate/web -- app/api/lead/route.ts app/api/valuation/route.ts scripts/check-crm-ingestion.ts` passes.
- Validation: `.\node_modules\.bin\tsc.cmd --noEmit --project apps/web/tsconfig.json` passes.
- Validation: `npm run worker:ingestion:drain`, `npm run test:ingestion:integration`, and `.\node_modules\.bin\tsx.cmd apps/web/scripts/check-crm-ingestion.ts` now fail fast with explicit no-engine runtime guidance.
- Validation: `npm run worker:ingestion:dead-letter:list` and `npm run worker:ingestion:dead-letter:requeue` fail fast with explicit no-engine runtime guidance in this environment.
- Validation note: `./node_modules/.bin/tsx.cmd apps/web/scripts/check-crm-ingestion.ts` currently fails when local Prisma generation falls back to `--no-engine` (datasource requires `prisma://`); direct full-engine generation can still intermittently fail with Windows `EPERM`.
- Validation note: `npm run db:generate:direct --workspace @real-estate/db` can still intermittently fail on Windows with `EPERM` during Prisma engine DLL rename; safe `db:generate` is the default mitigation path.
- Environment note: workspace dependency artifacts (`node_modules/`) are local-only.

## First Actions Next Session
1. Resolve Windows local Prisma engine lock for consistent `npm run db:generate:direct --workspace @real-estate/db` success (or add deterministic operator workaround).
2. Re-run `npm run worker:ingestion:drain` and `npm run test:ingestion:integration` after full-engine generation succeeds and capture passing output.
3. Re-run dead-letter list/requeue commands and capture functional output once full-engine generation succeeds.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
