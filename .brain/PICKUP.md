# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Complete tenant context threading through remaining website APIs/data providers, then upgrade tenant persistence from seed-backed storage to durable DB + migrations.

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
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts scripts/check-tenant-resolution.ts` passes; `apps/web/node_modules/.bin/tsc --noEmit --project apps/web/tsconfig.json` passes; `apps/web/node_modules/.bin/tsx.cmd scripts/check-tenant-resolution.ts` passes.

## First Actions Next Session
1. Inventory remaining `apps/web` API handlers and data providers that still infer tenant context implicitly.
2. Thread explicit tenant context through those handlers/providers using shared contracts.
3. Add targeted checks for updated handlers/providers to guard tenant isolation behavior.
4. Define the durable persistence direction for `packages/db` (schema + migration approach) and replace seed-backed arrays.
5. Update `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
