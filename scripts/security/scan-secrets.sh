#!/usr/bin/env bash
set -euo pipefail

MODE="staged"
if [[ "${1:-}" == "--all" ]]; then
  MODE="all"
fi

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

if ! command -v rg >/dev/null 2>&1; then
  echo "[secret-scan] ripgrep (rg) is required but not installed."
  exit 1
fi

mapfile -t TARGET_FILES < <(
  if [[ "$MODE" == "staged" ]]; then
    git diff --cached --name-only --diff-filter=ACM
  else
    git ls-files
  fi
)

if [[ ${#TARGET_FILES[@]} -eq 0 ]]; then
  echo "[secret-scan] No files to scan."
  exit 0
fi

PATTERNS=(
  "AKIA[0-9A-Z]{16}"
  "AIza[0-9A-Za-z_-]{35}"
  "sk-[A-Za-z0-9]{20,}"
  "-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----"
  "(?i)(api[_-]?key|secret|token|password)\\s*[:=]\\s*['\\\"]?[A-Za-z0-9/_+=.-]{20,}"
  "(?i)(database_url|auth_secret_key|jwt_secret)\\s*=\\s*[^\\s]{16,}"
)

SKIP_PATH_REGEX='(^|/)\.brain/|(^|/)docs/|(^|/)node_modules/|(^|/)dist/|(^|/)build/|(^|/)coverage/|(^|/)\.next/|(^|/)package-lock\.json$|(^|/)pnpm-lock\.yaml$|(^|/)yarn\.lock$|(^|/)\.env\.example$|(^|/)README\.md$'

VIOLATIONS=()
declare -A VIOLATION_SEEN=()

for file in "${TARGET_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    continue
  fi

  if [[ "$file" =~ $SKIP_PATH_REGEX ]]; then
    continue
  fi

  for pattern in "${PATTERNS[@]}"; do
    while IFS= read -r match; do
      [[ -z "$match" ]] && continue
      if [[ "$match" == *"secret-scan:allow"* ]]; then
        continue
      fi
      key="$file:$match"
      if [[ -z "${VIOLATION_SEEN[$key]+x}" ]]; then
        VIOLATION_SEEN[$key]=1
        VIOLATIONS+=("$key")
      fi
    done < <(rg --pcre2 -n -- "$pattern" "$file" || true)
  done
done

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo "[secret-scan] Potential secret(s) detected."
  echo "[secret-scan] Remove, rotate, or annotate intentional test values with 'secret-scan:allow'."
  printf '%s\n' "${VIOLATIONS[@]}"
  exit 1
fi

echo "[secret-scan] OK ($MODE scan)."
