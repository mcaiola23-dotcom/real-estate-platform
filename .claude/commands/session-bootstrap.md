# Platform Session Bootstrap

Run this at the start of every session for real-estate-platform.

## Workflow

1. Read these files in order:
   - `.brain/PROJECT_OVERVIEW.md`
   - `.brain/ARCHITECTURE.md`
   - `.brain/CURRENT_FOCUS.md`
   - `.brain/TODO_BACKLOG.md`
   - `.brain/DECISIONS_LOG.md`
   - `.brain/CODING_GUIDELINES.md`
   - `.brain/AGENT_README.md`
   - `.brain/PICKUP.md`

2. Summarize project state with:
   - Current objective
   - What is built
   - Top 3 next tasks

3. Pick top task #1 and execute it end-to-end unless the user overrides priority.

4. Keep implementation tenant-isolated and aligned with shared package patterns.

5. After implementation, update:
   - `.brain/CURRENT_FOCUS.md`
   - `.brain/TODO_BACKLOG.md`
   - `.brain/DECISIONS_LOG.md`

6. Run relevant checks/tests and report results clearly.
