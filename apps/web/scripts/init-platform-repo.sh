#!/usr/bin/env bash
set -euo pipefail

# Initializes a new platform repository from this existing Fairfield prototype
# without modifying/deleting this source repo.

SOURCE_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_ROOT_DEFAULT="$(cd "$SOURCE_REPO/.." && pwd)/real-estate-platform"
TARGET_ROOT_RAW="${1:-$TARGET_ROOT_DEFAULT}"
TARGET_ROOT="$(mkdir -p "$(dirname "$TARGET_ROOT_RAW")" && cd "$(dirname "$TARGET_ROOT_RAW")" && pwd)/$(basename "$TARGET_ROOT_RAW")"

if [[ -e "$TARGET_ROOT" ]]; then
  echo "Error: target path already exists: $TARGET_ROOT" >&2
  echo "Please pass a new path, e.g.:" >&2
  echo "  scripts/init-platform-repo.sh /absolute/path/to/real-estate-platform" >&2
  exit 1
fi

# Safety: prevent nesting target inside source (or source inside target)
case "$TARGET_ROOT" in
  "$SOURCE_REPO"|"$SOURCE_REPO"/*)
    echo "Error: target cannot be the source repo or inside it." >&2
    echo "Source: $SOURCE_REPO" >&2
    echo "Target: $TARGET_ROOT" >&2
    exit 1
    ;;
esac

case "$SOURCE_REPO" in
  "$TARGET_ROOT"/*)
    echo "Error: source repo cannot be inside target path." >&2
    echo "Source: $SOURCE_REPO" >&2
    echo "Target: $TARGET_ROOT" >&2
    exit 1
    ;;
esac

echo "Source repo (read-only input): $SOURCE_REPO"
echo "Target repo (new output): $TARGET_ROOT"

mkdir -p "$TARGET_ROOT"
cd "$TARGET_ROOT"

git init >/dev/null

mkdir -p apps/web apps/studio packages services infra .brain

# Copy current website code into apps/web (excluding VCS, generated, and planning files)
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'out' \
  --exclude 'dist' \
  --exclude '.DS_Store' \
  --exclude 'build' \
  --exclude '.brain' \
  "$SOURCE_REPO/" "apps/web/"

# If studio exists in web copy, move it to first-class app
if [[ -d "apps/web/studio" ]]; then
  rsync -a "apps/web/studio/" "apps/studio/"
  rm -rf "apps/web/studio"
fi

# Copy project brain docs to root-level .brain for easy reference
if [[ -d "$SOURCE_REPO/.brain" ]]; then
  rsync -a "$SOURCE_REPO/.brain/" ".brain/"
fi

cat > README.md <<'README'
# real-estate-platform

Bootstrapped monorepo scaffold for the real estate SaaS platform.

## Current state
- `apps/web`: copied from Fairfield prototype.
- `apps/studio`: extracted from website `studio/` when available.
- `.brain`: architecture/product guidance docs for AI and human contributors.

## Safety
- Source repo is used as read-only input.
- Target path must not already exist.
- Target path cannot be nested inside the source repo.

## Next steps
1. Add workspace tooling (pnpm workspaces + Turborepo recommended).
2. Add `apps/crm` and `apps/admin`.
3. Extract shared logic into `packages/*`.
4. Implement tenant/domain model and multi-tenant routing.
README

echo ""
echo "✅ Platform repo initialized at: $TARGET_ROOT"
echo "Source repo was not modified: $SOURCE_REPO"
echo "Next: cd '$TARGET_ROOT' && git add . && git commit -m 'Initial platform scaffold from Fairfield prototype'"
