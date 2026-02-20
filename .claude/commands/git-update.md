# Git Update

Quickly create and push a Git commit that includes all changes since the previous commit, with a short message summarizing completed work in the current session.

## Workflow

1. Inspect repo state before committing:
   - Run `git status --short`.
   - Run `git diff --stat`.
   - Run `git diff --cached --stat` to confirm staged state.

2. Draft a brief, accurate commit message from actual completed work in this session.

3. Stage all current changes:
   - Run `git add -A`.

4. Create commit:
   - Run `git commit -m "<short summary>"`.
   - If there is nothing to commit, report that clearly and stop.

5. Push to GitHub:
   - Determine current branch via `git branch --show-current`.
   - Push with upstream when needed: `git push -u origin <branch>`.
   - Otherwise run `git push`.

6. Report outcome:
   - Return commit hash, branch, commit message, and push result.

## Commit Message Rules

- Keep message concise and specific.
- Describe completed implementation, not planned work.
- Prefer conventional style when suitable (e.g., `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`).

## Safety Rules

- Do not use destructive git commands.
- Do not amend commits unless explicitly requested.
- Do not rewrite history.
- If push fails due to auth/remote issues, report exact failure and next required action.
