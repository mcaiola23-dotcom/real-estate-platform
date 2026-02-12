# CURRENT_FOCUS

## Active Objective
Set up the platform foundation so the existing Fairfield site can evolve into a tenant-ready SaaS baseline without disrupting the original prototype.

## In-Progress Workstream
1. Tenant-aware web runtime baseline is in place via host-header tenant resolution in `apps/web/proxy.ts` and tenant-aware `lead`/`valuation` API handling.
2. Root workspace tooling and top-level scripts are in place via npm workspaces and root `dev`/`build`/`lint` commands for `apps/web` and `apps/studio`.
3. Shared `packages/types` contract baseline is in place and active `apps/web` tenant/event typing now imports from the shared package.
4. Prepare persistent tenant/domain model implementation.

## Immediate Next Steps
- Implement tenant/domain persistence layer and replace in-memory host map.
- Complete tenant context threading across remaining API handlers and data providers.
- Expand `packages/types` coverage as additional CRM/control-plane entities are introduced.

## Session Validation (2026-02-12)
- `npm run lint:web` from root now resolves workspace scripts correctly and reports existing `apps/web` lint violations.
- `npm run lint:studio` from root resolves workspace scripts correctly and currently fails because `apps/studio/node_modules` is not installed in this environment.
- `npm run lint --workspace @real-estate/web -- app/lib/tenant/resolve-tenant.ts app/api/lead/route.ts app/api/valuation/route.ts` passes for touched tenant/event files.
- `apps/web/node_modules/.bin/tsc --noEmit --project apps/web/tsconfig.json` passes.

## Do Not Do Yet
- Do not start listing portal product build.
- Do not add enterprise-only complexity before solo-agent MVP is stable.
- Do not perform deep UI redesign before tenant runtime and CRM foundations are stable.
