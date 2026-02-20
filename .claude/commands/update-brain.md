# Update Brain

Update all files in the `.brain` folder to record session progress, completed work, decisions, validations, priorities, and next pickup steps.

## Workflow

1. Read current session changes and outcomes before writing docs.
2. Review all `.brain` files:
   - `.brain/PROJECT_OVERVIEW.md`
   - `.brain/ARCHITECTURE.md`
   - `.brain/CURRENT_FOCUS.md`
   - `.brain/TODO_BACKLOG.md`
   - `.brain/DECISIONS_LOG.md`
   - `.brain/CODING_GUIDELINES.md`
   - `.brain/AGENT_README.md`
   - `.brain/PICKUP.md`
3. Reconcile session progress against existing brain state:
   - Mark completed items in `TODO_BACKLOG.md`.
   - Record new decisions in `DECISIONS_LOG.md` with date, decision, and reason.
   - Update `CURRENT_FOCUS.md` with latest active objective, in-progress workstream, immediate next steps, and session validation.
   - Update `PICKUP.md` with the exact next-session starting task, why it is next, current snapshot, and first actions.
4. Update `PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`, `CODING_GUIDELINES.md`, and `AGENT_README.md` only when the session introduced real changes to product direction, architecture, standards, or agent workflow.
5. Ensure all updates are concrete, traceable to work completed in the session, and tenant-isolation aligned.

## Output Requirements

- Distinguish completed vs in-progress vs planned work.
- Include concrete validation outcomes (lint/build/test commands and pass/fail status).
- Avoid speculative roadmap edits not supported by actual implementation progress.
- Keep entries concise and actionable for the next session.
