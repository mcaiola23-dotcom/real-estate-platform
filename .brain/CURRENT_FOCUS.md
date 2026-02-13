# CURRENT_FOCUS

## Active Objective
Set up the platform foundation so the existing Fairfield site can evolve into a tenant-ready SaaS baseline without disrupting the original prototype.

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
10. Website event ingestion now flows into CRM persistence via shared db helpers in `packages/db/src/crm.ts`, with lead and valuation events wired from `apps/web` API routes.
11. Local Windows Prisma generate reliability has been hardened with `packages/db/scripts/db-generate-safe.mjs`, including engine-lock retry/cleanup and fallback behavior.

## Immediate Next Steps
- Expand `packages/types` coverage as additional CRM/control-plane entities are introduced.
- Build CRM read/write API routes and UI modules for lead pipeline, contacts, and activity timeline.
- Add ingestion worker/service boundary for website events (decouple direct web->db writes).
- Add Prisma config migration (`prisma.config.ts`) before Prisma 7 to replace deprecated `package.json#prisma`.

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

