# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Implement root workspace tooling and scripts for the monorepo.

## Why This Is Next
- Tenant-aware request flow is now in place in `apps/web`.
- Root workspace setup is the highest-leverage unblocker for shared package adoption (`packages/types`) and multi-app development.

## Current Snapshot
- Completed: host-based tenant resolver + tenant header stamping in `apps/web/proxy.ts`.
- Completed: tenant context consumption in `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts`.
- Completed: docs updated in `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, `.brain/DECISIONS_LOG.md`.
- Validation: focused lint passes for changed tenant files; full `apps/web` lint still has pre-existing unrelated errors.

## First Actions Next Session
1. Add root `package.json` with workspace configuration (`apps/*`, `packages/*`, `services/*`).
2. Add top-level scripts for core workflows (dev/build/lint for active apps).
3. Ensure `apps/web` and `apps/studio` are runnable from root scripts.
4. Run and record checks for workspace commands.
5. Update `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md`.

## Constraints To Keep
- Maintain tenant isolation assumptions.
- Prefer shared package patterns over app-to-app coupling.
- Do not touch unrelated files.
