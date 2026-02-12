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

### After Product Maturity
Use skills operationally to:
- Rapidly launch new client sites
- Apply branded template variants
- Generate initial CRM automations per client profile
- Run structured QA and go-live checklists

## Agent Tooling Context
This platform may be worked on via Codex Web, Codex CLI, Claude Code, and Antigravity. Keep instructions deterministic and file-based so all agents can align asynchronously.
