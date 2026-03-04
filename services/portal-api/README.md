# SmartMLS AI Platform - Backend

FastAPI backend for the SmartMLS AI Platform with PostgreSQL and SQLAlchemy.

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment:
   - Create `services/portal-api/.env.local` (this service loads `.env.local` first, then `.env`).
   - Set at minimum:
     - `DATABASE_URL=postgresql://<user>:<password>@localhost:5432/smartmls_db`
     - `GOOGLE_MAPS_SERVER_API_KEY=<server key for Street View + commute>`
     - `GOOGLE_PLACES_API_KEY=<server key for Places proxy>`
   - Legacy fallback is still supported: `GOOGLE_MAPS_API_KEY`.
3. Set up database:
   - Install PostgreSQL
   - Create database: `smartmls_db`
   - Set `DATABASE_URL` in `.env.local`
4. Run web API:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
5. (Optional) Run scheduler worker in a separate process:
   ```bash
   python -m app.workers.scheduler_worker
   ```

## Security Notes

- In `staging` and `production`, startup fails if `AUTH_SECRET_KEY` is missing, placeholder, or shorter than 32 chars.
- Startup now validates Google key configuration by default:
  - `GOOGLE_MAPS_SERVER_API_KEY` (or legacy `GOOGLE_MAPS_API_KEY`) for Street View + commute.
  - `GOOGLE_PLACES_API_KEY` (or legacy `GOOGLE_MAPS_API_KEY`) for Places proxy endpoints.
- Optional startup validation controls:
  - `GOOGLE_REQUIRE_KEYS_ON_STARTUP=true|false` (default: `true`)
  - `GOOGLE_VALIDATE_KEY_FORMAT=true|false` (default: `true`)
- `GET /leads/` and `GET /leads/{id}` require authenticated users with `user_type` of `agent` or `admin`.
- `POST /leads/` remains public for portal lead capture.
- `/test-sentry` is blocked outside `local` environment.

## Migrations (Alembic)

Alembic is configured in this service with:
- Baseline revision: `20260302_000001`
- First post-baseline schema revision: `20260302_000002` (`search_alerts` constraints/timestamp)

Apply all migrations:

```bash
alembic upgrade head
```

Create a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## API Endpoints

### Health
- `GET /health/`
- `GET /health/mls`

### Properties
- `GET /properties/`
- `GET /properties/{id}`

### Leads
- `POST /leads/`
- `GET /leads/` (agent/admin only)
- `GET /leads/{id}` (agent/admin only)

### AVM
- `POST /estimate/`

## Testing

Run backend tests:

```bash
pytest tests/test_hardening_smoke.py -v
pytest app/tests/test_api.py tests/test_phase0.py -v
```

## CI Gate (Backend Reliability)

From the monorepo root:

```bash
npm run ci:portal-api
```

This gate enforces:
- backend hardening + compatibility route tests (default: `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`)
- migration checks (`alembic current`, `alembic upgrade head`, `alembic current`)
- optional `ruff`/`mypy` checks when those tools are installed

Prerequisites:
- `DATABASE_URL` must point to PostgreSQL + PostGIS (SQLite is not supported for this gate).

Optional overrides:
- `PORTAL_API_PYTEST_BIN` (default: `pytest`)
- `PORTAL_API_ALEMBIC_BIN` (default: `alembic`)
- `PORTAL_API_TEST_TARGETS` (default: `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`; set to run a narrower or broader suite)

## Authoritative Windows Runtime Path

When WSL/local Python environments drift, run the backend gate from Windows with the service virtualenv:

```cmd
services\portal-api\scripts\ci-gate-windows.cmd
```

Required environment:
- `DATABASE_URL` (or `PORTAL_API_DATABASE_URL`) -> PostgreSQL + PostGIS DSN

Optional environment:
- `PORTAL_API_WINDOWS_PYTHON` (defaults to `C:\Users\19143\Projects\smartmls-ai-app\backend\.venv\Scripts\python.exe`)
- `PORTAL_API_TEST_TARGETS` (defaults to `tests/test_hardening_smoke.py app/tests/test_api.py tests/test_phase0.py`)

## Portal Smoke Checklist

Use the post-change smoke checklist here:
- `docs/portal-smoke-test-checklist.md`
