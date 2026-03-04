#!/usr/bin/env bash
set -euo pipefail

SERVICE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SERVICE_DIR"

PYTEST_BIN="${PORTAL_API_PYTEST_BIN:-pytest}"
ALEMBIC_BIN="${PORTAL_API_ALEMBIC_BIN:-alembic}"

if ! command -v "$PYTEST_BIN" >/dev/null 2>&1; then
  echo "[portal-api-ci] Missing test runner: '$PYTEST_BIN'" >&2
  echo "[portal-api-ci] Install backend dependencies and/or set PORTAL_API_PYTEST_BIN." >&2
  exit 1
fi

if ! command -v "$ALEMBIC_BIN" >/dev/null 2>&1; then
  echo "[portal-api-ci] Missing migration CLI: '$ALEMBIC_BIN'" >&2
  echo "[portal-api-ci] Install Alembic and/or set PORTAL_API_ALEMBIC_BIN." >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[portal-api-ci] DATABASE_URL is required." >&2
  echo "[portal-api-ci] Set it to a PostgreSQL + PostGIS database before running this gate." >&2
  exit 1
fi

if [[ "$DATABASE_URL" == sqlite:* ]]; then
  echo "[portal-api-ci] SQLite is not supported for this CI gate." >&2
  echo "[portal-api-ci] The backend test suite relies on Postgres JSONB + spatial functions." >&2
  exit 1
fi

echo "[portal-api-ci] service_dir=$SERVICE_DIR"
echo "[portal-api-ci] pytest_bin=$PYTEST_BIN"
echo "[portal-api-ci] alembic_bin=$ALEMBIC_BIN"
echo "[portal-api-ci] database_url=$DATABASE_URL"
TEST_TARGETS="${PORTAL_API_TEST_TARGETS:-tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py}"
echo "[portal-api-ci] test_targets=$TEST_TARGETS"

echo "[portal-api-ci] Running backend tests"
# shellcheck disable=SC2086
"$PYTEST_BIN" -q $TEST_TARGETS

echo "[portal-api-ci] Alembic current (pre-upgrade)"
"$ALEMBIC_BIN" -c alembic.ini current

echo "[portal-api-ci] Alembic upgrade head"
"$ALEMBIC_BIN" -c alembic.ini upgrade head

echo "[portal-api-ci] Alembic current (post-upgrade)"
"$ALEMBIC_BIN" -c alembic.ini current

if command -v ruff >/dev/null 2>&1; then
  echo "[portal-api-ci] Ruff check"
  ruff check app tests
else
  echo "[portal-api-ci] Ruff not installed; skipping lint gate"
fi

if command -v mypy >/dev/null 2>&1; then
  echo "[portal-api-ci] Mypy check"
  mypy app
else
  echo "[portal-api-ci] Mypy not installed; skipping type gate"
fi

echo "[portal-api-ci] PASS"
