# Safe GitHub Update: Add Only `.brain` (and optional bootstrap script)

This guide explains how to add only the planning docs to `main` without overwriting other code.

## What this process does
- Adds **only selected paths** (for example `.brain/**` and optionally `scripts/init-platform-repo.sh`).
- Does **not** reset, rebase, or replace unrelated project files.
- Preserves all newer website changes already on `main`.

## Recommended approach (path-limited cherry-pick)

1. Start from up-to-date main:
```bash
git checkout main
git pull origin main
```

2. Create a safety branch:
```bash
git checkout -b add-brain-docs-only
```

3. Apply the commit(s) without committing yet:
```bash
git cherry-pick --no-commit 4868384
```

4. Keep only the paths you want:
```bash
git restore --staged --worktree .
git checkout 4868384 -- .brain
# optional:
# git checkout 4868384 -- scripts/init-platform-repo.sh
```

5. Commit only those files:
```bash
git add .brain
# optional: git add scripts/init-platform-repo.sh
git commit -m "Add .brain planning docs (and optional bootstrap script)"
```

6. Push and merge PR:
```bash
git push -u origin add-brain-docs-only
```

After merge, teammates run:
```bash
git checkout main
git pull origin main
```

## Alternative (copy paths from another branch)
If you have a branch containing the docs, copy only those paths:
```bash
git checkout main
git pull origin main
git checkout -b add-brain-docs-only
git checkout <source-branch> -- .brain
# optional: git checkout <source-branch> -- scripts/init-platform-repo.sh
git add .brain scripts/init-platform-repo.sh
git commit -m "Add .brain planning docs"
git push -u origin add-brain-docs-only
```

## Safety checks before pushing
```bash
git status
git diff --name-only --cached
```
Expected staged paths should be only:
- `.brain/...`
- optionally `scripts/init-platform-repo.sh`

## Session Review (2026-02-17)
- Reviewed during CRM checklist completion session; no scope/architecture/process changes required in this file beyond confirming continued tenant-isolation and shared-package boundaries.
