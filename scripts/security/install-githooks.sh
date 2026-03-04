#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks
echo "[githooks] core.hooksPath set to .githooks"
