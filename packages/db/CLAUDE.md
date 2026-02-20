# packages/db — Database & Persistence Layer

Shared Prisma-based persistence package consumed by all apps and services.

## Schema

- `prisma/schema.prisma` — SQLite (local dev), models are tenant-scoped
- `prisma/migrations/` — Migration history (apply with `db:migrate:deploy`)
- `prisma/seed.sql` — Baseline seed data (apply with `db:seed`)
- `generated/prisma-client/` — Generated Prisma client output (package-local to reduce Windows lock contention)

## Module Exports

Each export is a distinct domain boundary — import only what you need:

```typescript
import { ... } from '@real-estate/db'                // prisma client, runtime readiness
import { ... } from '@real-estate/db/crm'            // lead/contact/activity/ingestion helpers
import { ... } from '@real-estate/db/control-plane'   // tenant provisioning, domains, settings, actors, billing, diagnostics
import { ... } from '@real-estate/db/tenants'         // tenant/domain resolution
import { ... } from '@real-estate/db/admin-audit'     // audit event persistence
import { ... } from '@real-estate/db/website-config'  // website/module config
```

## Windows/Prisma Concerns

Prisma has known Windows file-lock (`EPERM`) issues with engine DLL rename operations. Mitigation scripts:

- `scripts/db-generate-safe.mjs` — Retry/cleanup/backoff wrapper, falls back to `--no-engine` if lock persists
- `scripts/db-generate-direct.mjs` — Full-engine generation with preflight lock detection, healthy-client reuse, and load-probe fallback
- `scripts/db-generate-reliability-sample.mjs` — Repeated attempt sampling for lock regression monitoring

Use `db:generate` for daily work (safe fallback) and `db:generate:direct` when full engine is required (e.g., before running ingestion worker).

## Commands

```bash
# Requires DATABASE_URL — local default:
# file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db

npm run db:generate --workspace @real-estate/db          # Safe generate (retry + fallback)
npm run db:generate:direct --workspace @real-estate/db   # Full-engine direct generate
npm run db:migrate:deploy --workspace @real-estate/db    # Apply migrations
npm run db:seed --workspace @real-estate/db              # Seed baseline data
npm run db:generate:sample --workspace @real-estate/db -- 12  # Reliability sampling
```

## Known Issue

`tsc --noEmit` for this package fails on pre-existing unresolved import `@real-estate/types/website-config` in `src/seed-data.ts` and `src/website-config.ts`. This is a known baseline issue, not a regression.
