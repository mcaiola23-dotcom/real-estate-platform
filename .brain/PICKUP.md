# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Create CRM app skeleton and auth integration.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is complete and unblocks shared package adoption.
- Shared contracts and tenant-context threading are now in place across active website APIs and data providers.
- Durable tenant persistence scaffolding and local Prisma generate/migrate/seed flow are now in place.
- Tenant-configurable website module controls are now in place via shared type/db scaffolding and town/neighborhood module gating.
- The highest-value remaining Phase 1 gap is CRM runtime foundation (`apps/crm` skeleton + auth + core data model).

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
- Completed: shared website/module contracts in `packages/types/src/website-config.ts` and exports via `packages/types/src/index.ts`.
- Completed: tenant website/module config persistence scaffolding in `packages/db` (`src/website-config.ts`, schema + migration `202602120002_add_website_module_config`, SQL seed baseline).
- Completed: tenant-scoped module registry consumption in `apps/web` town and neighborhood pages via `apps/web/app/lib/modules/tenant-modules.ts`.
- Completed: module toggle validation coverage in `apps/web/scripts/check-module-toggles.ts`.
- Completed: runtime-safe Prisma fallback hardening in `packages/db` (`src/prisma-client.ts`, `src/tenants.ts`, `src/website-config.ts`) to prevent page crashes when Prisma runtime lookups fail.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint --workspace @real-estate/web -- app/lib/modules/tenant-modules.ts scripts/check-module-toggles.ts app/lib/tenant/resolve-tenant.ts proxy.ts` passes; `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/lib/modules/tenant-modules.ts scripts/check-tenant-resolution.ts scripts/check-module-toggles.ts` passes; `npm run build --workspace @real-estate/web` passes; `./node_modules/.bin/tsx.cmd apps/web/scripts/check-module-toggles.ts` passes; `./node_modules/.bin/tsx.cmd apps/web/scripts/check-tenant-resolution.ts` passes; `npm run db:migrate:deploy --workspace @real-estate/db` passes with new module-config migration; `npm run db:seed --workspace @real-estate/db` passes with SQL seed flow.
- Validation blocker: `npm run db:generate --workspace @real-estate/db` currently fails in this environment with Windows file lock (`EPERM`) on Prisma engine DLL rename under `node_modules/.prisma/client`.
- Environment note: workspace dependency artifacts (`node_modules/`) are local-only.

## First Actions Next Session
1. Scaffold `apps/crm` as a Next.js workspace app aligned with monorepo naming and root scripts.
2. Integrate auth boundary patterns for CRM runtime using shared tenant context assumptions.
3. Define initial CRM domain contracts (`Lead`, `Contact`, `Activity`) in `packages/types`.
4. Add initial CRM persistence models in `packages/db` and wire tenant-scoped access helpers.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
