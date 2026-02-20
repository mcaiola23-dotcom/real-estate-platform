# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Run `platform-session-bootstrap`, then propagate the GTM baseline from `.brain/PRODUCT_SPEC.md` into operator enablement artifacts:
  - update/create the sales/onboarding runbook with canonical plan matrix, setup scope/SLAs, and managed-services operating model,
  - align Admin seed defaults to those same plan/onboarding/service baselines where applicable.

## Why This Is Next
- GTM definitions were finalized this session (`.brain/PRODUCT_SPEC.md` sections `5.1`-`5.3`, decisions `D-102` and `D-103`), but operational artifacts have not yet been updated to use that baseline.
- Manual click-through remains intentionally deferred by product-direction override, so documentation + seed-default propagation is the highest-leverage next slice.

## Current Snapshot
- Completed this session:
  - Added cross-tenant billing drift summary support to observability contracts in `packages/types/src/control-plane.ts`.
  - Implemented billing drift aggregation in `packages/db/src/control-plane.ts` from `tenant.billing.sync` audit metadata.
  - Added Admin observability KPI/panel surfaces for billing drift in `apps/admin/app/components/control-plane-workspace.tsx` and responsive KPI grid update in `apps/admin/app/globals.css`.
  - Extended route tests for observability payload + Stripe webhook typed capture updates in `apps/admin/app/api/lib/routes.integration.test.ts`.
  - Finalized Business/GTM baseline definitions in `.brain/PRODUCT_SPEC.md` section `5` (plan matrix, setup SLA policy, managed services model).
- Still pending:
  - Propagate GTM baseline into sales/onboarding runbook + Admin seed defaults.
  - Manual browser click-through for Admin and CRM once current product-direction override is lifted.
  - Continue periodic Windows Prisma reliability sampling and trend recording.

## Validation (Most Recent)
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`43/43`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run lint --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:sample --workspace @real-estate/db -- 12 --json --exit-zero"` passes (`12/12`, `0` `EPERM` failures).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run worker:ingestion:drain"` passes (`totalProcessed: 0`, `totalFailed: 0`, `totalDeadLettered: 0`).
- Known unrelated baseline issue remains:
  - `./node_modules/.bin/tsc --noEmit --project packages/db/tsconfig.json` fails due existing unresolved import path `@real-estate/types/website-config` in `packages/db/src/seed-data.ts` and `packages/db/src/website-config.ts`.

## First Actions Next Session
1. Run `platform-session-bootstrap` and re-read `.brain/CURRENT_FOCUS.md` Immediate Next Steps.
2. Locate/create the sales/onboarding runbook artifact and encode canonical plan/SLA/services baseline from `.brain/PRODUCT_SPEC.md`.
3. Update Admin seed defaults to reflect the same plan tiers and baseline onboarding/service assumptions.
4. Run targeted validation for touched paths and record outcomes in `.brain/CURRENT_FOCUS.md`.
5. Keep manual click-through deferred unless product-direction override is explicitly lifted.

## Constraints To Keep
- Preserve tenant isolation for all request/event paths and UI data interactions.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, app UI in `apps/admin`.
- Do not modify CRM app files or CRM-owned planning artifacts (`apps/crm/**`, `.brain/CRM_Update.md`) in this workstream.
- Treat Windows-authoritative command results as canonical when WSL sandbox limitations are present.
