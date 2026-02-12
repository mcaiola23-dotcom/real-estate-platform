# CURRENT_FOCUS

## Active Objective
Set up the platform foundation so the existing Fairfield site can evolve into a tenant-ready SaaS baseline without disrupting the original prototype.

## In-Progress Workstream
1. Tenant-aware web runtime baseline is in place via host-header tenant resolution in `apps/web/proxy.ts` and tenant-aware `lead`/`valuation` API handling.
2. Root workspace tooling and top-level scripts are in place via npm workspaces and root `dev`/`build`/`lint` commands for `apps/web` and `apps/studio`.
3. Shared `packages/types` contract baseline is in place and active `apps/web` tenant/event typing now imports from the shared package.
4. Tenant/domain persistence baseline now lives in `packages/db`, and `apps/web` host resolution now loads tenant/domain mappings from shared db package lookups.
5. Tenant scoping has been added to `apps/web` user profile sync endpoints and server-side town data providers (`walkscore`/`places`) now receive tenant context with tenant-specific cache variants.
6. Explicit tenant context interfaces are now threaded through remaining client-side/static data providers (`atAGlance`, `taxes`, `schools`, `listings`) and their key call sites (`town` pages and `home-search`).

## Immediate Next Steps
- Evolve `packages/db` from seed-backed module to durable storage integration with migrations.
- Add durable tenant/domain migration + seeding flow for `Tenant` and `TenantDomain`.
- Implement website module registry + tenant module toggle system (`WebsiteConfig`/`ModuleConfig`) to advance Phase 1 exit criteria.
- Expand `packages/types` coverage as additional CRM/control-plane entities are introduced.

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

## Do Not Do Yet
- Do not start listing portal product build.
- Do not add enterprise-only complexity before solo-agent MVP is stable.
- Do not perform deep UI redesign before tenant runtime and CRM foundations are stable.
