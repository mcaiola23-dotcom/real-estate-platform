# Handoff

Generate a copy/paste handoff prompt for a fresh session, including current status, completed work, next task, and an explicit instruction for the new agent to run `/session-bootstrap` first.

## Workflow

1. Read project context files:
   - `.brain/PROJECT_OVERVIEW.md`
   - `.brain/ARCHITECTURE.md`
   - `.brain/CURRENT_FOCUS.md`
   - `.brain/TODO_BACKLOG.md`
   - `.brain/DECISIONS_LOG.md`
   - `.brain/CODING_GUIDELINES.md`
   - `.brain/AGENT_README.md`
   - `.brain/PICKUP.md`

2. Inspect current working state:
   - Check changed files relevant to the latest session.
   - Capture what was completed.
   - Capture test/check outcomes and known blockers.

3. Produce one final output titled `New Session Handoff Prompt` that can be pasted directly into a new chat.

4. In that generated prompt, always include:
   - Project identity and current objective.
   - What was completed this session.
   - Current standing (done/in-progress/pending).
   - Top 3 next tasks with one recommended as first.
   - Explicit instruction: run `/session-bootstrap` first.
   - Critical constraints: tenant isolation, shared package patterns, avoid unrelated file edits.
   - Required updates after work: `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, `.brain/DECISIONS_LOG.md`, `.brain/PICKUP.md`.

5. Keep the generated prompt concise, actionable, and deterministic.

## Output Format

Output exactly these sections in the generated prompt:

1. `Context`
2. `Completed Work`
3. `Current Status`
4. `Next Tasks`
5. `First Action Required`
6. `Operating Constraints`
7. `Documentation Update Requirement`
