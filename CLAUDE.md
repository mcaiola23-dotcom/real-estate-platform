# CLAUDE.md — Real Estate Platform

## Project Overview

Multi-tenant real estate SaaS platform delivering premium agent websites, AI-assisted CRM, and a control-plane admin portal. Currently in Phase 2-4 (CRM MVP + AI foundations + SaaS control plane).

## Tech Stack

- **Runtime**: TypeScript, Next.js (apps), Node.js (services)
- **Database**: Prisma ORM, SQLite (local dev), PostgreSQL (production target)
- **Auth**: Clerk (middleware-protected routes, tenant header stamping)
- **CMS**: Sanity Studio
- **Monorepo**: npm workspaces
- **Styling**: Tailwind CSS, CSS custom properties

## Repository Structure

```
apps/
  web/        — Tenant website runtime (Next.js)
  crm/        — Tenant CRM runtime (Next.js)
  admin/      — Internal SaaS control-plane portal (Next.js)
  studio/     — CMS authoring (Sanity Studio)
packages/
  ui/         — Shared design system/components
  config/     — Shared lint/ts/tailwind configs
  types/      — Shared domain/event type contracts
  auth/       — Authz/authn helpers + role policies
  db/         — Prisma schema, migrations, data access helpers
  analytics/  — Event contracts + SDK
  ai/         — Prompt templates, orchestration logic
  integrations/ — IDX, email, SMS, ads adapters
services/
  automation-worker/  — Background jobs (follow-ups, reminders)
  ingestion-worker/   — IDX sync, enrichment, ETL, queue processing
```

## Non-Negotiable Rules

1. **Tenant isolation**: Every request, query, mutation, and cache key must be tenant-scoped
2. **No cross-app imports**: Shared logic goes in `packages/*`, never import between `apps/*`
3. **AI provenance**: AI-generated content must be tagged with provenance metadata
4. **Event contracts versioned**: All event types in `packages/types` are versioned and backward-compatible
5. **Audit trail**: All control-plane mutations emit structured audit events
6. **Domain onboarding state must be auditable**

## Coding Standards

- TypeScript everywhere practical
- Prefer pure functions and composable modules
- Keep API contracts explicit and versioned
- Never expose privileged credentials client-side
- Log sensitive operations with audit metadata
- Small PRs, clear commit messages
- Add/maintain tests for critical domain logic
- AI prompts must be versioned with fallback behavior when AI services fail

## Key Commands

```bash
# Development servers
npm run dev:web          # apps/web on port 3000
npm run dev:crm          # apps/crm on port 3001
npm run dev:admin        # apps/admin on port 3002

# Build
npm run build:web
npm run build:crm
npm run build:admin

# Lint
npm run lint:web
npm run lint:crm
npm run lint:admin

# Tests
npm run test:routes --workspace @real-estate/crm     # CRM route tests
npm run test:routes --workspace @real-estate/admin    # Admin route tests (33+ tests)
npm run test:workspace --workspace @real-estate/crm   # CRM interaction tests
npm run test:ingestion:integration                    # Ingestion worker e2e

# Database (requires DATABASE_URL)
npm run db:generate --workspace @real-estate/db       # Safe Prisma generate (with fallback)
npm run db:generate:direct --workspace @real-estate/db # Full-engine direct generate
npm run db:migrate:deploy --workspace @real-estate/db  # Apply migrations
npm run db:seed --workspace @real-estate/db            # Seed baseline data
npm run db:generate:sample --workspace @real-estate/db -- 12  # Reliability sampling

# Workers
npm run worker:ingestion:drain                        # Process ingestion queue
npm run worker:ingestion:dead-letter:list             # List dead-letter jobs
npm run worker:ingestion:dead-letter:requeue          # Requeue dead-letter jobs
```

## Environment Notes (Windows/WSL)

- Development happens on Windows with WSL2; some commands must run via `cmd.exe` for Prisma compatibility
- Prisma has known Windows file-lock (`EPERM`) issues with `query_engine-windows.dll.node` — mitigated via `db-generate-safe.mjs` and `db-generate-direct.mjs` wrappers with retry/backoff/healthy-client-reuse logic
- WSL sandbox limitations: `tsx` IPC pipe permissions (`EPERM`), SWC binary mismatch (`@esbuild/win32-x64` vs linux), and dev server port binding may fail
- Windows `cmd.exe` results are treated as authoritative when WSL results are non-authoritative
- DATABASE_URL for local dev: `file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db`

## Route Handler Pattern

CRM and Admin route handlers use dependency-injected factories (`create*Handler`) so route behavior can be tested deterministically without runtime module mocking. Follow this pattern for new routes.

## Detailed Documentation

For deeper context, read the `.brain/` directory in this order:

1. `.brain/PROJECT_OVERVIEW.md` — Vision, business model, end users
2. `.brain/ARCHITECTURE.md` — Runtime architecture, domain model, folder ownership
3. `.brain/PRODUCT_SPEC.md` — Product requirements
4. `.brain/BUILD_ORDER.md` — Phased build plan with exit criteria
5. `.brain/CURRENT_FOCUS.md` — Active objectives, in-progress work, session validation history
6. `.brain/TODO_BACKLOG.md` — Feature backlog with completion tracking
7. `.brain/DECISIONS_LOG.md` — All architectural decisions (D-001 through D-094+)
8. `.brain/CODING_GUIDELINES.md` — Development standards and definition of done
9. `.brain/PICKUP.md` — Session resumption guide (what to do next)

## Session Workflow

When completing a significant work session:
- Update `.brain/CURRENT_FOCUS.md` if priorities changed
- Add key decisions to `.brain/DECISIONS_LOG.md`
- Update TODO statuses in `.brain/TODO_BACKLOG.md`
- Update `.brain/PICKUP.md` with next-session starting task
