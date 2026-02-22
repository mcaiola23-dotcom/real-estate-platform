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
- CRM UI/UX Overhaul Session 7 completed: Phase 9A (AI-Powered Reminders), Phase 9B (AI Message Templates), Phase 9D (AI Escalation) all implemented end-to-end.
- CRM route tests: 43/43 passing (37 existing + 6 new for reminders/escalation API routes).
- TypeScript clean, lint clean (0 errors, 4 warnings: 2 pre-existing in seed-mock-data.ts, 2 minor unused params in new tests).
- New shared AI engines: `packages/ai/src/crm/reminder-engine.ts` (5 rule-based patterns + AI enhancement), `packages/ai/src/crm/escalation-engine.ts` (4 triggers, 5 escalation levels, score decay).
- New DB migration: `202602220001_add_reminder_fields` (nextActionChannel TEXT, reminderSnoozedUntil DATETIME on Lead table).
- New CRM components: SmartReminderForm, TemplateLibrary, EscalationBanner + EscalationAlertBanner.
- Template library: 9 pre-built templates with merge field resolution in `apps/crm/app/lib/crm-templates.ts`.
- Score decay for overdue leads integrated in `apps/crm/app/lib/crm-scoring.ts`.
- Admin portal usability improvements completed: Guided vs Full mode, Start Here guide, task tabs, Action Center, glossary help, clearer section labels.
- Admin decomposition completed for task-tab rendering surfaces.
- Durable onboarding task persistence is designed but not implemented yet: `project_tracking/admin_onboarding_task_persistence_design.md`.
- Manual browser QA remains intentionally deferred.

## First Actions Next Session
1. Run `$platform-session-bootstrap`.
2. Re-open `project_tracking/admin_onboarding_task_persistence_design.md` and implement Phase 1 of the MVP:
   - shared contracts in `packages/types`
   - Prisma schema/models + migration in `packages/db`
   - shared DB helpers in `packages/db/src/control-plane.ts`
3. Add minimal Admin read/write route scaffolding for onboarding plans/tasks (server-side only before UI polish).
4. Wire the first read surface into Admin (likely Action Center / Launch tab checklist state) only after schema/helpers are stable.

## Validation Context (Most Recent)
- `npm run test:routes --workspace @real-estate/crm` — PASS (43/43 tests)
- `tsc --noEmit -p apps/crm/tsconfig.json` — PASS
- `npm run lint --workspace @real-estate/crm` — 0 errors, 4 warnings
- Latest Windows-authoritative Prisma sampling (earlier this session): `db:generate:sample -- 12 --json --exit-zero` — PASS (`12/12`, `0` EPERM failures)
- `worker:ingestion:drain` from mixed WSL/Windows dependency state remains non-authoritative when `esbuild` platform mismatch appears

## Constraints To Keep
- Preserve tenant isolation for all Admin onboarding task reads/writes (tenant-scoped data only).
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/admin`.
- Do not do manual browser walkthroughs unless the user changes direction.
- Do not take CRM tasks in this stream unless the user explicitly asks.
- Prefer incremental Admin refactors tied to the persistence MVP over broad UI rewrites.
