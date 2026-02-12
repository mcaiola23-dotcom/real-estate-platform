# Retrieve `.brain` + bootstrap script locally (Windows)

Use these steps to get the docs and bootstrap script onto your own machine.

## 1) Pull from GitHub (recommended)

From PowerShell:
```powershell
cd C:\Users\19143\Projects\fairfield-agent-website
git checkout main
git pull origin main
```

Verify files:
```powershell
dir .brain
dir scripts\init-platform-repo.sh
```

## 2) Start Codex CLI in the correct path

```powershell
cd C:\Users\19143\Projects\fairfield-agent-website
codex
```

## 3) Create new platform folder outside the current repo

Use Git Bash (or run bash from PowerShell):
```bash
cd /c/Users/19143/Projects/fairfield-agent-website
bash scripts/init-platform-repo.sh /c/Users/19143/Projects/real-estate-platform
```

Then switch into the new repo:
```bash
cd /c/Users/19143/Projects/real-estate-platform
```

## Optional: export a direct bundle

If you want a single archive containing `.brain` and the bootstrap script:
```bash
bash scripts/package-brain-bundle.sh
```
This creates:
- `dist/brain-bootstrap-bundle.tar.gz`

You can copy/extract this archive on another machine if needed.
