# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Implement and validate one additional mitigation for persistent Windows Prisma engine rename lock failures (`query_engine-windows.dll.node` `EPERM`) so direct full-engine generation success rate improves over current baseline.

## Why This Is Next
- Reliability sampling is now first-class (`db:generate:sample`) and showed reproducible lock failures in the same session where earlier loops passed, confirming instability rather than a one-time glitch.
- Safe generation is now more resilient (multi-retry + backoff + cleanup) but still falls back to `engine=none` under sustained lock contention, which keeps runtime-dependent workflows fragile.
- This is now the primary blocker for deterministic local ingestion/runtime validation in the Windows-authoritative environment.

## Current Snapshot
- Completed this session: restart integrity validation and reliability instrumentation/hardening.
  - Added Prisma reliability sampler script: `packages/db/scripts/db-generate-reliability-sample.mjs`.
  - Added script aliases:
    - Root: `npm run db:generate:sample`
    - DB workspace: `npm run db:generate:sample --workspace @real-estate/db`
  - Hardened safe generate retries in `packages/db/scripts/db-generate-safe.mjs`:
    - Configurable retry count via `PRISMA_GENERATE_LOCK_RETRIES` (default `3`).
    - Progressive backoff via `PRISMA_GENERATE_RETRY_BACKOFF_MS` (default `350`).
    - Optional fallback control via `PRISMA_GENERATE_ALLOW_NO_ENGINE_FALLBACK`.
    - Cleanup now includes stale temp artifacts `query_engine-windows.dll.node.tmp*`.
  - Added ignore rule for temp engine artifacts in `.gitignore`.
- Control plane audit slice remains implemented and validated in this repo state:
  - Admin mutation RBAC/audit route boundary.
  - Durable `AdminAuditEvent` persistence.
  - Admin audit timeline API/UI + route-level tests.

## Validation (Most Recent)
- Restart integrity checks:
  - `cmd.exe /c "... && npm run db:generate --workspace @real-estate/db"` passes (full engine in that run).
  - `cmd.exe /c "... && npm run db:generate:direct --workspace @real-estate/db"` passes (single run).
  - `cmd.exe /c "... && npm run worker:ingestion:drain"` passes (`totalProcessed: 0`, no failures).
  - `cmd.exe /c "... && npm run test:routes --workspace @real-estate/admin"` passes (`13/13`).
- Reliability sampling + hardening checks:
  - `cmd.exe /v:on /c "... for /l %i in (1,1,15) do npm run db:generate:direct --workspace @real-estate/db"` passes (`15/15`, `0` failures).
  - `cmd.exe /c "... && npm run db:generate:sample --workspace @real-estate/db -- 6"` fails (`0/6` pass, `6/6` fail, all `EPERM` lock on rename to `query_engine-windows.dll.node`).
  - `cmd.exe /c "... && npm run db:generate --workspace @real-estate/db"` now shows retry envelope (`3` retries with backoff), then falls back to `engine=none` when locks persist.
  - `cmd.exe /c "... && npm run db:generate:sample --workspace @real-estate/db -- 2 --json --exit-zero"` exits `0` and emits machine-readable failure samples with full lock path context.

## First Actions Next Session
1. Capture a fresh baseline with `npm run db:generate:sample --workspace @real-estate/db -- 10 --json --exit-zero` in Windows `cmd.exe`.
2. Apply one new mitigation targeting the rename-lock path (file-handle/process contention on `packages/db/generated/prisma-client/query_engine-windows.dll.node`).
3. Re-run the same sample command and compare pass/fail rates before/after in `.brain/CURRENT_FOCUS.md`.
4. Re-run one runtime-dependent check (`worker:ingestion:drain` or ingestion integration) only if full-engine reliability improves.

## Constraints To Keep
- Maintain tenant isolation in all request/data paths and test fixtures.
- Keep shared package boundaries strict (no app-to-app private imports).
- Treat Windows `cmd.exe` results as authoritative for Prisma reliability in this mixed WSL/Windows workspace.
- Do not interfere with ongoing CRM build-out work being performed by another agent.
