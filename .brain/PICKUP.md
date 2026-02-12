# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Stand up tenant/domain schema and replace the in-memory host map used by tenant resolution.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is complete and unblocks shared package adoption.
- Shared contracts now exist in `packages/types`, so tenant persistence can be implemented against a stable contract surface.

## Current Snapshot
- Completed: host-based tenant resolver + tenant header stamping in `apps/web/proxy.ts`.
- Completed: tenant context consumption in `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts`.
- Completed: root npm workspace tooling and scripts in top-level `package.json` for `apps/web` + `apps/studio`.
- Completed: `packages/types` with tenant/domain/event contracts and `apps/web` tenant typing migration to `@real-estate/types`.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts` passes; `apps/web/node_modules/.bin/tsc --noEmit --project apps/web/tsconfig.json` passes.

## First Actions Next Session
1. Implement tenant/domain storage schema (`Tenant`, `TenantDomain`) in the chosen persistence layer package.
2. Seed/migrate the current Fairfield tenant/domain record into persistent storage.
3. Refactor `apps/web/app/lib/tenant/resolve-tenant.ts` to load host mappings from persistence instead of static in-memory records.
4. Add targeted tests or validation checks for host match, localhost fallback, and default fallback behavior.
5. Update `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
