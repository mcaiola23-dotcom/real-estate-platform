# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Implement the durable onboarding-task persistence MVP for Admin control plane (Task 3), starting from `project_tracking/admin_onboarding_task_persistence_design.md`.

## Why This Is Next
- The Admin usability/decomposition passes are far enough along to support persistence work without further UI-only refactors first.
- Plan-tier checklist templates and actor seed presets are currently operator defaults only (non-persistent); durable task state is the next functional gap.
- User explicitly requested this as the first task next session and to defer manual walkthroughs for now.

## Current Snapshot (2026-02-22)
- Admin portal usability improvements completed: Guided vs Full mode, Start Here guide, task tabs, Action Center, glossary help, clearer section labels.
- Admin decomposition completed for task-tab rendering surfaces:
  - `ActionCenterPanel`, `WorkspaceTaskTabs`
  - `SupportTabBody`, `PlatformHealthTabBody`
  - `BillingTabBody`, `AccessTabBody`, `AuditTabBody`
- GTM baselines operationalized in Admin guidance/defaults via `apps/admin/app/lib/commercial-baselines.ts` and `project_tracking/operator_onboarding_runbook.md`.
- Durable onboarding task persistence is designed but not implemented yet: `project_tracking/admin_onboarding_task_persistence_design.md`.
- Manual browser QA remains intentionally deferred.
- CRM is an active parallel stream; do not take CRM work unless the user explicitly redirects.

## First Actions Next Session
1. Run `$platform-session-bootstrap`.
2. Re-open `project_tracking/admin_onboarding_task_persistence_design.md` and implement Phase 1 of the MVP:
   - shared contracts in `packages/types`
   - Prisma schema/models + migration in `packages/db`
   - shared DB helpers in `packages/db/src/control-plane.ts`
3. Add minimal Admin read/write route scaffolding for onboarding plans/tasks (server-side only before UI polish).
4. Wire the first read surface into Admin (likely Action Center / Launch tab checklist state) only after schema/helpers are stable.

## Validation Context (Most Recent)
- `node --import tsx --test apps/admin/app/lib/action-center.test.ts apps/admin/app/lib/workspace-task-metrics.test.ts` — PASS
- `timeout 120s ./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json --pretty false` — PASS
- Latest Windows-authoritative Prisma sampling (earlier this session): `db:generate:sample -- 12 --json --exit-zero` — PASS (`12/12`, `0` EPERM failures)
- `worker:ingestion:drain` from mixed WSL/Windows dependency state remains non-authoritative when `esbuild` platform mismatch appears

## Constraints To Keep
- Preserve tenant isolation for all Admin onboarding task reads/writes (tenant-scoped data only).
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/admin`.
- Do not do manual browser walkthroughs unless the user changes direction.
- Do not take CRM tasks in this stream unless the user explicitly asks.
- Prefer incremental Admin refactors tied to the persistence MVP over broad UI rewrites.
