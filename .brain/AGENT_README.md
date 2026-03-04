# AGENT_README

This document is the quick-start for AI agents and developers working in this repository.

## Read Order (Mandatory)
1. `PROJECT_OVERVIEW.md`
2. `ARCHITECTURE.md`
3. `PRODUCT_SPEC.md`
4. `BUILD_ORDER.md`
5. `CURRENT_FOCUS.md`
6. `TODO_BACKLOG.md`
7. `DECISIONS_LOG.md`
8. `CODING_GUIDELINES.md`

## Working Rules
- Respect tenant isolation in all implementation choices.
- Favor shared abstractions over app-to-app duplication.
- Keep docs synchronized with implementation progress.
- **Portal frontend** (`apps/portal`) is TypeScript/Next.js and lives in this monorepo. It follows the same workspace conventions as other apps.
- **Portal API** (`services/portal-api/`) is a Python/FastAPI service. It is co-located in the monorepo but is **not** part of the npm workspace. It has its own `requirements.txt` and runs independently.
- For portal-api operations: run long-running scheduler/import loops in dedicated worker processes (not web startup), and use Alembic revisions for schema changes.
- Security workflow: repo-managed pre-commit hooks live in `.githooks/`; install with `npm run security:hooks:install` and run manual scan with `npm run security:secrets:scan`.
- Backend quality gate workflow: use `npm run ci:portal-api` (tests + Alembic checks) before merge/deploy when Python tooling is available; this gate requires `DATABASE_URL` targeting PostgreSQL + PostGIS (not SQLite).
- Portal ↔ CRM integration happens through shared event contracts and API boundaries, not direct imports.

## Required Outputs Per Major Work Session
- Update `CURRENT_FOCUS.md` if priorities changed.
- Add key decisions to `DECISIONS_LOG.md`.
- Update TODO statuses in `TODO_BACKLOG.md`.

## Skill Strategy (Prominent)
Skills should be used as accelerators for repeatable workflows.

### During Buildout
Create and maintain internal skills for:
- Tenant website provisioning
- CRM module scaffolding
- AI prompt pack updates
- Domain onboarding workflow
- Integration adapter setup (IDX/email/SMS)
- Portal search component scaffolding
- Portal ↔ CRM lead handoff workflow
- Design token synchronization across apps

### After Product Maturity
Use skills operationally to:
- Rapidly launch new client sites
- Apply branded template variants
- Generate initial CRM automations per client profile
- Run structured QA and go-live checklists

## Agent Tooling Context
This platform may be worked on via Codex Web, Codex CLI, Claude Code, and Antigravity. Keep instructions deterministic and file-based so all agents can align asynchronously.

## Session Review (2026-03-02)
- Updated workflow notes to reflect backend hardening changes (dedicated scheduler worker process + Alembic migration baseline) and repo-managed secret scanning hooks.
- Backend CI gate now defaults to `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py` with Postgres-backed Alembic checks.
- Legacy backend suites are modernized (`services/portal-api/app/tests/test_api.py`, `services/portal-api/tests/test_phase0.py`) and a Windows-native authoritative gate script is available at `services/portal-api/scripts/ci-gate-windows.cmd`.
- Hardening smoke coverage now includes authenticated `/api` write-path guard checks for favorites/saved-searches/alerts and authenticated create success paths for `saved-searches` + `favorites`.
- Authoritative host-runtime backend gate now passes from this updated baseline (`29 passed`; Alembic pre/post-upgrade at `20260302_000002 (head)`).
