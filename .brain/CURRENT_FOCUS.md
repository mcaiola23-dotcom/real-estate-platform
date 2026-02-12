# CURRENT_FOCUS

## Active Objective
Set up the platform foundation so the existing Fairfield site can evolve into a tenant-ready SaaS baseline without disrupting the original prototype.

## In-Progress Workstream
1. Tenant-aware web runtime baseline is in place via host-header tenant resolution in `apps/web/proxy.ts` and tenant-aware `lead`/`valuation` API handling.
2. Root workspace tooling and top-level scripts are in place via npm workspaces and root `dev`/`build`/`lint` commands for `apps/web` and `apps/studio`.
3. Shared `packages/types` contract baseline is in place and active `apps/web` tenant/event typing now imports from the shared package.
4. Durable tenant/domain persistence scaffolding now lives in `packages/db` with Prisma schema/migrations/seed flow, while `apps/web` tenant resolution now uses async shared db lookups with edge-safe seed fallback.
5. Tenant scoping has been added to `apps/web` user profile sync endpoints and server-side town data providers (`walkscore`/`places`) now receive tenant context with tenant-specific cache variants.
6. Explicit tenant context interfaces are now threaded through remaining client-side/static data providers (`atAGlance`, `taxes`, `schools`, `listings`) and their key call sites (`town` pages and `home-search`), with tenant-scoped module toggle gating now applied in town/neighborhood module rendering paths.
7. Prisma runtime hardening is now in place in `packages/db` (`prisma-client`, tenant/module lookup fallbacks), so tenant resolution and module loading degrade to seed-backed behavior instead of failing page renders when local Prisma runtime/state is unavailable.

## Immediate Next Steps
- Expand `packages/types` coverage as additional CRM/control-plane entities are introduced.
- Create CRM app skeleton and auth integration.
- Build lead/contact/activity database model for CRM runtime.
- Resolve local Prisma engine file-lock issue blocking consistent `db:generate` runs on this Windows environment.

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
