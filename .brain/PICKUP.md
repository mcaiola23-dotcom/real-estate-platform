# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Define shared domain and event types in `packages/types`, then migrate tenant-facing types to shared contracts.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is complete and unblocks shared package adoption.
- Shared contracts are required before tenant/domain persistence can be implemented cleanly across apps and services.

## Current Snapshot
- Completed: host-based tenant resolver + tenant header stamping in `apps/web/proxy.ts`.
- Completed: tenant context consumption in `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts`.
- Completed: root npm workspace tooling and scripts in top-level `package.json` for `apps/web` + `apps/studio`.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.
- Validation: `npm run lint:web` executes from root and reports pre-existing unrelated `apps/web` lint errors; `npm run lint:studio` executes from root and currently fails due to missing `apps/studio/node_modules`.

## First Actions Next Session
1. Scaffold `packages/types` with shared tenant/domain/event contract files and package metadata.
2. Move current tenant type definitions into `packages/types` and update imports in `apps/web`.
3. Run targeted checks for the affected files/workspaces and capture outcomes.
4. Stand up the tenant/domain schema implementation against those shared contracts.
5. Update `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
