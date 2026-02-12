# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Upgrade tenant persistence from seed-backed storage in `packages/db` to durable DB + migrations.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is complete and unblocks shared package adoption.
- Shared contracts and tenant-context threading are now in place across active website APIs and data providers.
- The highest-value remaining Phase 1 gap is replacing seed-backed persistence with durable storage and adding tenant-configurable module controls.

## Current Snapshot
- Completed: host-based tenant resolver + tenant header stamping in `apps/web/proxy.ts`.
- Completed: tenant context consumption in `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts`.
- Completed: root npm workspace tooling and scripts in top-level `package.json` for `apps/web` + `apps/studio`.
- Completed: `packages/types` with tenant/domain/event contracts and `apps/web` tenant typing migration to `@real-estate/types`.
- Completed: `packages/db` tenant/domain persistence baseline with Fairfield seed data and shared tenant lookup functions.
- Completed: `apps/web/app/lib/tenant/resolve-tenant.ts` now resolves host mappings through `@real-estate/db/tenants`.
- Completed: targeted tenant resolution behavior checks in `apps/web/scripts/check-tenant-resolution.ts`.
- Completed: `apps/web/app/api/user/profile/route.ts` and `apps/web/app/api/user/sync/route.ts` now scope profile reads/writes by tenant context.
- Completed: `walkscore` and `googlePlaces` provider cache variants now include tenant scoping, with tenant context threaded from town pages via request headers.
- Completed: explicit `TenantScope` interfaces across remaining static/client providers (`atAGlance`, `taxes`, `schools`, `listings`) and call sites (`town` pages + `home-search`).
- Completed: `apps/web/next.config.ts` sets `experimental.externalDir` and `turbopack.root` for stable monorepo dev resolution.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts scripts/check-tenant-resolution.ts` passes; `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/user/profile/route.ts app/api/user/sync/route.ts app/lib/data/providers/walkscore.provider.ts app/lib/data/providers/places.provider.ts` passes; `npm run lint --workspace @real-estate/web -- app/lib/data/providers/tenant-context.ts app/lib/data/providers/atAGlance.provider.ts app/lib/data/providers/taxes.provider.ts app/lib/data/providers/schools.provider.ts app/lib/data/providers/listings.types.ts app/components/data/AtAGlanceModule.tsx app/components/data/TaxesModule.tsx app/components/data/SchoolsModule.tsx app/home-search/page.tsx` passes; `npm run build --workspace @real-estate/web` passes.
- Environment note: local untracked artifacts exist at repo root (`node_modules/`, `package-lock.json`) from workspace install; they are intentionally uncommitted.

## First Actions Next Session
1. Choose and scaffold durable storage in `packages/db` (schema + migration workflow) for `Tenant` and `TenantDomain`.
2. Replace in-memory seed arrays in `packages/db/src/tenants.ts` with durable data access queries.
3. Add migration/seed strategy for baseline Fairfield tenant/domain records.
4. Update `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
