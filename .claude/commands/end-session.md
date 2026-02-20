# End Session

Run this at the end of every session to reconcile and update all `.brain` files, capture completed actions, decisions, validation outcomes, and define exact pickup steps for the next session.

## Workflow

1. Read all files in `.brain/`:
   - `.brain/PROJECT_OVERVIEW.md`
   - `.brain/ARCHITECTURE.md`
   - `.brain/CURRENT_FOCUS.md`
   - `.brain/TODO_BACKLOG.md`
   - `.brain/DECISIONS_LOG.md`
   - `.brain/CODING_GUIDELINES.md`
   - `.brain/AGENT_README.md`
   - `.brain/PICKUP.md`

2. Inspect session work before writing docs:
   - Run `git status` and `git diff --stat` to gather changed files and implementation scope.
   - Capture what was completed vs. planned.
   - Capture checks/tests run and their outcomes.

3. Update all `.brain` files as needed to reflect session truth:
   - `PROJECT_OVERVIEW.md`: Update only if product scope/vision changed.
   - `ARCHITECTURE.md`: Update only if architecture/runtime/package boundaries changed.
   - `CURRENT_FOCUS.md`: Always refresh objective, in-progress stream, and immediate next steps.
   - `TODO_BACKLOG.md`: Mark completed items, add newly discovered follow-ups, and reprioritize.
   - `DECISIONS_LOG.md`: Add dated decision entries for material technical/product choices made this session.
   - `CODING_GUIDELINES.md`: Update only if new coding/process standards were adopted.
   - `AGENT_README.md`: Update only if operating rules for agents changed.
   - `PICKUP.md`: Always rewrite with the exact next-session starting task, first actions, constraints, and validation context.

4. Ensure tenant isolation and shared package patterns are explicitly preserved in all updates.

5. Validate consistency:
   - No contradictions across `.brain` files.
   - Completed work appears in both `TODO_BACKLOG.md` and `DECISIONS_LOG.md` where appropriate.
   - `PICKUP.md` points to one clear first task for next session.

6. Report end-of-session summary:
   - What was completed.
   - Which `.brain` files were updated and why.
   - Remaining risks/gaps.
   - Exact first task for next session.
