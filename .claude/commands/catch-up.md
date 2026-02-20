# Catch Up

Re-focus this session by reviewing all `.brain` files to determine current scope position, completed work, immediate next development tasks, and outstanding future-phase work.

## Workflow

1. Read `.brain/AGENT_README.md` first to align with required read order and working rules.
2. Read all `.brain` files needed to determine current project state:
   - `.brain/PROJECT_OVERVIEW.md`
   - `.brain/ARCHITECTURE.md`
   - `.brain/CURRENT_FOCUS.md`
   - `.brain/TODO_BACKLOG.md`
   - `.brain/DECISIONS_LOG.md`
   - `.brain/CODING_GUIDELINES.md`
   - `.brain/PICKUP.md`
3. Reconstruct scope position from the docs:
   - Identify the active objective and current workstream.
   - Identify what is complete and validated.
   - Identify what is next in active development.
   - Identify what remains for later phases.
4. Produce a concise status brief in this exact structure:
   - `Current Objective`
   - `Completed So Far`
   - `Next In Development`
   - `Outstanding Future Phases`
   - `Risks/Blockers`
5. If conflicts exist across `.brain` files, call them out explicitly and prefer the most recently updated source or the source that contains explicit validation entries.
6. Keep recommendations tenant-isolated and aligned with shared package boundaries (`packages/*`) over app-to-app coupling.

## Output Requirements

- Use concrete file references when citing decisions or status.
- Distinguish validated completion from assumed completion.
- Keep the summary short and execution-oriented.
