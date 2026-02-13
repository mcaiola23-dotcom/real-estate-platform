# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Create a reusable ingestion test fixture helper to remove repeated forced-retry and tenant setup boilerplate in `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` while keeping assertions explicit.

## Why This Is Next
- Ingestion reliability coverage is now comprehensive (dead-letter lifecycle, retry/backoff, max-attempt dead-letter, command-level operator flows, malformed payload guards).
- The remaining friction is maintainability/readability: integration script logic is long and repetitive.
- A shared fixture helper will reduce duplication and make future ingestion assertions faster to add safely.

## Current Snapshot
- Completed: Prisma client generation/runtime now targets package-local output (`packages/db/generated/prisma-client`) with Windows lock mitigation updates in `packages/db/scripts/db-generate-safe.mjs`.
- Completed: CRM route handlers are dependency-injectable and integration-tested for auth/tenant guards, payload validation, pagination payloads, lead status activity side effects, and invalid tenant-scoped lead/contact linkage.
- Completed: Ingestion queue reliability behavior is integration-covered end-to-end:
  - Invalid event type -> dead-letter.
  - Dead-letter requeue -> reprocess -> dead-letter.
  - Retry/backoff requeue cadence with `nextAttemptAt` gating.
  - Max-attempt transition (`attemptCount=5`) to `dead_letter`.
  - Malformed valuation payload semantics aligned with malformed lead semantics.
- Completed: Dead-letter operator command integration coverage added in `services/ingestion-worker/scripts/test-dead-letter-commands.ts`:
  - `dead-letter:list` tenant-filtered flow.
  - Single-job requeue via `INGESTION_DEAD_LETTER_JOB_ID`.
  - Tenant batch requeue via `INGESTION_DEAD_LETTER_TENANT_ID`.
- Completed: JSON-mode output contract for operator commands added:
  - `INGESTION_OUTPUT_JSON=1` emits event-tagged payloads in:
    - `services/ingestion-worker/scripts/dead-letter-list.ts`
    - `services/ingestion-worker/scripts/dead-letter-requeue.ts`
- Completed: Ingestion payload validation guards added in `packages/db/src/crm.ts` for malformed lead/valuation payloads to suppress noisy expected runtime stack traces.
- Completed: Ingestion integration now uses temporary run-scoped tenant fixture (`tenant_ingestion_<runId>`) with guaranteed cleanup in `finally`, preventing persistent `tenant_fairfield` growth.

## Validation (Most Recent)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:direct --workspace @real-estate/db"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/crm"` passes (16/16).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/crm"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:integration"` passes with temporary tenant zero-baseline and full reliability assertions.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run test:ingestion:dead-letter-commands"` passes with JSON output shape assertions.

## First Actions Next Session
1. Extract reusable helper(s) in `services/ingestion-worker/scripts` for:
   - run-scoped tenant/domain fixture setup + cleanup
   - forced retry progression loops
   - queue-job state assertions by job id
2. Refactor `services/ingestion-worker/scripts/test-enqueue-worker-flow.ts` to use helper(s) without weakening assertions.
3. Add explicit cleanup assertions (tenant/domain records removed post-run) and re-run:
   - `npm run test:ingestion:integration`
   - `npm run test:ingestion:dead-letter-commands`

## Constraints To Keep
- Maintain tenant isolation in all request/data paths and test fixtures.
- Keep shared package boundaries strict (no app-to-app private imports).
- Do not touch unrelated files.
