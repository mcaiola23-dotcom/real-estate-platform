@echo off
setlocal ENABLEEXTENSIONS

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "SERVICE_DIR=%%~fI"

if not defined PORTAL_API_WINDOWS_PYTHON (
  set "PORTAL_API_WINDOWS_PYTHON=C:\Users\19143\Projects\smartmls-ai-app\backend\.venv\Scripts\python.exe"
)

if not exist "%PORTAL_API_WINDOWS_PYTHON%" (
  echo [portal-api-ci-win] Missing python runtime: "%PORTAL_API_WINDOWS_PYTHON%"
  echo [portal-api-ci-win] Set PORTAL_API_WINDOWS_PYTHON to your backend virtualenv python.exe path.
  exit /b 1
)

if not defined DATABASE_URL (
  if defined PORTAL_API_DATABASE_URL (
    set "DATABASE_URL=%PORTAL_API_DATABASE_URL%"
  )
)

if not defined DATABASE_URL (
  echo [portal-api-ci-win] DATABASE_URL is required.
  echo [portal-api-ci-win] Set DATABASE_URL or PORTAL_API_DATABASE_URL to a PostgreSQL/PostGIS DSN.
  exit /b 1
)

echo %DATABASE_URL% | findstr /B /I "sqlite:" >nul
if not errorlevel 1 (
  echo [portal-api-ci-win] SQLite is not supported for this CI gate.
  echo [portal-api-ci-win] Use a PostgreSQL + PostGIS DATABASE_URL.
  exit /b 1
)

if not defined PORTAL_API_TEST_TARGETS (
  set "PORTAL_API_TEST_TARGETS=tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py"
)

echo [portal-api-ci-win] service_dir=%SERVICE_DIR%
echo [portal-api-ci-win] python=%PORTAL_API_WINDOWS_PYTHON%
echo [portal-api-ci-win] database_url=%DATABASE_URL%
echo [portal-api-ci-win] test_targets=%PORTAL_API_TEST_TARGETS%

pushd "%SERVICE_DIR%"
set "PYTHONPATH=."

echo [portal-api-ci-win] Running backend tests
"%PORTAL_API_WINDOWS_PYTHON%" -m pytest -q %PORTAL_API_TEST_TARGETS%
if errorlevel 1 (
  popd
  exit /b 1
)

echo [portal-api-ci-win] Alembic current (pre-upgrade)
"%PORTAL_API_WINDOWS_PYTHON%" -m alembic -c alembic.ini current
if errorlevel 1 (
  popd
  exit /b 1
)

echo [portal-api-ci-win] Alembic upgrade head
"%PORTAL_API_WINDOWS_PYTHON%" -m alembic -c alembic.ini upgrade head
if errorlevel 1 (
  popd
  exit /b 1
)

echo [portal-api-ci-win] Alembic current (post-upgrade)
"%PORTAL_API_WINDOWS_PYTHON%" -m alembic -c alembic.ini current
if errorlevel 1 (
  popd
  exit /b 1
)

where ruff >nul 2>&1
if not errorlevel 1 (
  echo [portal-api-ci-win] Ruff check
  ruff check app tests
  if errorlevel 1 (
    popd
    exit /b 1
  )
) else (
  echo [portal-api-ci-win] Ruff not installed; skipping lint gate
)

where mypy >nul 2>&1
if not errorlevel 1 (
  echo [portal-api-ci-win] Mypy check
  mypy app
  if errorlevel 1 (
    popd
    exit /b 1
  )
) else (
  echo [portal-api-ci-win] Mypy not installed; skipping type gate
)

popd
echo [portal-api-ci-win] PASS
exit /b 0
