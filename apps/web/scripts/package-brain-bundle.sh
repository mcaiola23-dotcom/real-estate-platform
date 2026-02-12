#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist}"
BUNDLE_NAME="brain-bootstrap-bundle.tar.gz"

mkdir -p "$OUT_DIR"

if [[ ! -d "$ROOT_DIR/.brain" ]]; then
  echo "ERROR: $ROOT_DIR/.brain not found" >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/scripts/init-platform-repo.sh" ]]; then
  echo "ERROR: $ROOT_DIR/scripts/init-platform-repo.sh not found" >&2
  exit 1
fi

tar -czf "$OUT_DIR/$BUNDLE_NAME" \
  -C "$ROOT_DIR" \
  .brain \
  scripts/init-platform-repo.sh

echo "Created bundle: $OUT_DIR/$BUNDLE_NAME"
