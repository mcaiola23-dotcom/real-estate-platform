# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Implement website module registry + tenant module toggle system in shared packages (`WebsiteConfig` / `ModuleConfig`).

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is complete and unblocks shared package adoption.
- Shared contracts and tenant-context threading are now in place across active website APIs and data providers.
- Durable tenant persistence scaffolding and local Prisma generate/migrate/seed flow are now in place.
- The highest-value remaining Phase 1 gap is tenant-configurable website module controls.

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
- Completed: `packages/db` now includes Prisma schema, initial tenant/domain migration SQL, and seed script (`packages/db/prisma/*`).
- Completed: `apps/web` tenant resolution helpers and key call sites now use async shared db lookups with runtime-safe edge fallback.
- Completed: local dependency install and Prisma setup flow (`db:generate`, `db:migrate:deploy`, `db:seed`) for durable tenant records.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts proxy.ts app/api/lead/route.ts app/api/valuation/route.ts app/api/user/profile/route.ts app/api/user/sync/route.ts scripts/check-tenant-resolution.ts` passes; `npm run build --workspace @real-estate/web` passes; `npm run db:generate --workspace @real-estate/db` passes; `npm run db:migrate:deploy --workspace @real-estate/db` passes; `npm run db:seed --workspace @real-estate/db` passes.
- Environment note: workspace dependency artifacts (`node_modules/`) are local-only.

## First Actions Next Session
1. Define shared module-config contracts in `packages/types` for `WebsiteConfig` and `ModuleConfig`.
2. Add durable persistence models and access utilities in `packages/db` for tenant module toggles.
3. Implement module-registry consumption path in `apps/web` with tenant-scoped module enable/disable behavior.
4. Add validation coverage for module toggle behavior and update `.brain` tracking docs.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
