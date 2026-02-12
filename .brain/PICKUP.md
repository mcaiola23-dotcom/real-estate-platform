# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Complete tenant context threading for remaining client-side/static data providers, then upgrade tenant persistence from seed-backed storage to durable DB + migrations.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is complete and unblocks shared package adoption.
- Shared contracts and a persistence baseline now exist (`packages/types` + `packages/db`), so remaining tenant-isolation gaps are primarily endpoint/data-provider threading and durable storage hardening.

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
- Completed: `apps/web/next.config.ts` sets `experimental.externalDir` and `turbopack.root` for stable monorepo dev resolution.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts scripts/check-tenant-resolution.ts` passes; `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/user/profile/route.ts app/api/user/sync/route.ts app/lib/data/providers/walkscore.provider.ts app/lib/data/providers/places.provider.ts` passes; `npm run build --workspace @real-estate/web` passes.

## First Actions Next Session
1. Thread explicit tenant context through remaining client-side/static provider interfaces (`atAGlance`, `taxes`, `schools`, `listings`) and their module call sites.
2. Add targeted checks for updated provider interfaces and ensure no tenant context is implicitly inferred.
3. Define the durable persistence direction for `packages/db` (schema + migration approach) and replace seed-backed arrays.
4. Add migration/seed strategy for `Tenant` + `TenantDomain` records in durable storage.
5. Update `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
