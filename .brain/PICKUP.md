# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Close remaining Control Plane MVP validation blockers: run pending Prisma migrate/seed commands and execute admin route tests in a compatible local environment, then record clean validation outcomes.

## Why This Is Next
- Control-plane scaffold and route test coverage are now implemented, but environment constraints in this sandbox blocked full command validation.
- Migration/seed and route-test execution evidence is required before treating this admin slice as production-ready baseline.
- Closing command-level validation now prevents hidden runtime drift while Control Plane MVP expands.

## Current Snapshot
- Completed: New control-plane runtime scaffold in `apps/admin`:
  - Clerk-protected auth boundary in `apps/admin/proxy.ts`.
  - Dashboard UI + mutation workflows in `apps/admin/app/components/control-plane-workspace.tsx`.
  - Admin API routes for tenant provisioning/listing, domain attach/status updates, and settings read/update in `apps/admin/app/api/tenants/*`.
- Completed: Shared control-plane contracts and db helper boundary:
  - `packages/types/src/control-plane.ts`.
  - `packages/db/src/control-plane.ts` and package exports.
- Completed: Control-plane persistence scaffolding:
  - Prisma model `TenantControlSettings` in `packages/db/prisma/schema.prisma`.
  - Migration scaffold `packages/db/prisma/migrations/202602130004_add_tenant_control_settings/migration.sql`.
  - Seed baseline update in `packages/db/prisma/seed.sql`.
- Completed: Admin API route-handler factories + route-level integration test scaffold:
  - `apps/admin/app/api/tenants/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/domains/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/domains/[domainId]/route.ts`
  - `apps/admin/app/api/tenants/[tenantId]/settings/route.ts`
  - `apps/admin/app/api/lib/routes.integration.test.ts`

## Validation (Most Recent)
- `npm run lint --workspace @real-estate/admin` passes.
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `npm run test:routes --workspace @real-estate/admin` fails in this sandbox due `tsx` IPC socket permission (`listen EPERM /tmp/tsx-1000/*.pipe`).
- `node --import tsx --test apps/admin/app/api/lib/routes.integration.test.ts` fails in this mixed environment due `esbuild` platform mismatch (`@esbuild/win32-x64` present, linux binary required).
- `DATABASE_URL=file:/mnt/c/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db` fails in this sandbox due Prisma engine DNS fetch error (`getaddrinfo EAI_AGAIN binaries.prisma.sh`).
- `DATABASE_URL=file:/mnt/c/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:seed --workspace @real-estate/db` fails in this sandbox for the same Prisma engine DNS fetch issue.
- `npm run build --workspace @real-estate/admin` fails in this sandbox due Next SWC/cache environment constraints (`EACCES /home/mc23/.cache/next-swc`, fallback SWC runtime error after cache override).

## First Actions Next Session
1. Re-run DB validation in normal dev environment:
   - `DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:migrate:deploy --workspace @real-estate/db`
   - `DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db npm run db:seed --workspace @real-estate/db`
2. Run admin route tests in compatible environment and capture pass output:
   - `npm run test:routes --workspace @real-estate/admin`
3. Resolve local build environment for admin runtime and re-run:
   - `npm run build --workspace @real-estate/admin`

## Constraints To Keep
- Maintain tenant isolation in all request/data paths and test fixtures.
- Keep shared package boundaries strict (no app-to-app private imports).
- Keep CRM/ingestion hardening scoped to blocking or production-critical reliability gaps while control-plane MVP advances.
