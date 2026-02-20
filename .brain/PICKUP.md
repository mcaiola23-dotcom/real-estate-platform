# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Run `platform-session-bootstrap`, then execute the next control-plane roadmap slice: tenant support diagnostics toolkit (auth/domain/ingestion health checks + operator remediation actions).

## Why This Is Next
- The current session completed Admin data safety/recovery controls (tenant/domain/settings soft-delete + restore workflows with confirmation UX).
- The highest-leverage pending control-plane work is now tenant support diagnostics depth so operators can run guided auth/domain/ingestion checks from one workflow.

## Current Snapshot
- Completed in this session:
  - Implemented status-based soft-delete/restore persistence for control-plane entities:
    - schema + migration updates for `TenantDomain.status` and `TenantControlSettings.status`,
    - shared lifecycle helpers in `packages/db/src/control-plane.ts` including `updateTenantLifecycleStatus`.
  - Added Admin API lifecycle endpoints/updates:
    - new `PATCH /api/tenants/[tenantId]/status`,
    - extended domain/settings PATCH routes for lifecycle status updates,
    - domain probe route now scopes probes to active domains.
  - Delivered Admin UI safety/recovery controls in `apps/admin/app/components/control-plane-workspace.tsx`:
    - archive/restore controls for tenant/domain/settings,
    - destructive confirmation prompts,
    - archived-state edit locks and status chips/readiness gating updates.
  - Extended route integration coverage in `apps/admin/app/api/lib/routes.integration.test.ts` for tenant/domain/settings lifecycle status behavior.
  - Updated `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md` with completed work and decisions.
- In progress / pending:
  - Manual full-browser review for Admin and CRM remains intentionally deferred until additional UI/UX improvement passes are complete.
  - Next control-plane roadmap items: tenant support diagnostics toolkit, then billing/subscription workflow integration.

## Validation (Most Recent)
- `node --check packages/db/scripts/db-generate-direct.mjs` passes.
- `./node_modules/.bin/tsc --noEmit --project packages/types/tsconfig.json` passes.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`27/27`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"` passes and applies migration `202602200002_add_control_plane_soft_delete_status`.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` passes (`12/12`, `0` `EPERM` failures).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes.
- `npm run db:generate:direct --workspace @real-estate/db` required a forced non-reuse regeneration path in this shell to refresh generated client metadata after the new migration.
- Known unrelated baseline issue remains in `packages/db` typecheck:
  - `./node_modules/.bin/tsc --noEmit --project packages/db/tsconfig.json` fails due existing unresolved import path `@real-estate/types/website-config` in `packages/db/src/seed-data.ts` and `packages/db/src/website-config.ts`.

## First Actions Next Session
1. Run `platform-session-bootstrap` and confirm alignment with `.brain/CURRENT_FOCUS.md` immediate next steps.
2. Implement tenant support diagnostics toolkit in `apps/admin`:
   - add tenant-scoped auth/domain/ingestion health checks,
   - add operator-friendly remediation guidance/actions per failed check.
3. Add targeted route/UI regression coverage for diagnostics behavior and rerun Admin validation commands (`lint`, `test:routes`, `build` via Windows-authoritative shell).
4. If diagnostics slice is stable, move to billing/subscription workflow integration.

## Constraints To Keep
- Preserve tenant isolation for all request/event paths and UI data interactions.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, app UI in `apps/admin`.
- Do not edit unrelated files.
- Do not edit `.brain/CRM_Update.md` in this stream (separate agent ownership).
- Treat Windows-authoritative command results as canonical when WSL sandbox limitations are present.
