# ARCHITECTURE

## Target Repository Structure (Monorepo)

```txt
real-estate-platform/
  apps/
    web/                 # Tenant website runtime (Next.js)
    crm/                 # Tenant CRM runtime (Next.js)
    studio/              # CMS authoring (Sanity Studio)
    admin/               # Internal SaaS operations portal
    portal/              # Public listing portal (Next.js) — consumer property search + AI
    marketing/           # SaaS marketing site (optional)
  packages/
    ui/                  # Shared design system/components
    design-tokens/       # Shared color/typography/spacing tokens
    config/              # Shared lint/ts/tailwind configs
    types/               # Shared domain/event types
    auth/                # Authz/authn helpers + role policies
    db/                  # DB schema, migrations, data access
    analytics/           # Event contracts + SDK
    ai/                  # Prompt templates, orchestration logic
    integrations/        # IDX, email, sms, ads adapters
  services/
    automation-worker/   # Background jobs (follow-ups, reminders)
    ingestion-worker/    # IDX sync, enrichment, ETL
    portal-api/          # Portal backend (Python/FastAPI) — listing search, AI, AVM
  infra/
    terraform/           # Infra as code
    docker/              # Images and local orchestration assets
  docs/
    brain/               # Long-lived guidance docs for all agents
```

## Runtime Architecture

### 1) Multi-tenant websites
- Single deployable web runtime.
- Request host/domain resolves to `tenant_id`.
- Tenant config determines theme, enabled modules, coverage areas, copy defaults.

### 2) CRM runtime
- Separate app sharing auth and data contracts.
- Reads website events and lead activities.
- Owns lead lifecycle and automation orchestration triggers.

### 3) Control plane
- Manages tenant provisioning, domains, billing, plans, feature flags.
- Internal support tools and audit logs.

### 4) Portal runtime
- Consumer-facing listing search and property discovery (Next.js frontend in `apps/portal`).
- Backed by a Python/FastAPI service in `services/portal-api/`.
- Features: listing search, AI-powered natural language search, AVM, interactive map, property details, saved searches, alerts.
- Communicates with portal-api via `NEXT_PUBLIC_API_URL`.

## Domain & Tenant Model
Core entities:
- `Tenant`
- `TenantDomain`
- `User`
- `Role`
- `Contact`
- `Lead`
- `Opportunity`
- `Activity`
- `WebsiteConfig`
- `ModuleConfig`
- `TenantControlSettings`
- `Subscription`

## Folder-by-Folder Ownership / Spec

### `apps/web`
**Owner**: Web Product Team
- Tenant-resolved rendering
- Page/module registry
- Lead capture endpoints
- Public analytics event emission

### `apps/crm`
**Owner**: CRM Product Team
- Pipeline UI and workflows
- Contact intelligence
- Reminder/task management
- AI-assisted outreach actions

### `apps/studio`
**Owner**: Content Platform Team
- Editorial schemas and workflows
- Content QA and approval states
- Structured content for modules/pages

### `apps/admin`
**Owner**: Platform Operations Team
- Tenant onboarding/provisioning
- Domain verification and status
- Billing plans, invoices, account controls

### `apps/portal`
**Owner**: Portal Product Team
- Consumer-facing listing search and property discovery
- AI-powered natural language search
- AVM (automated valuation model) display
- Interactive map with property markers
- Saved searches and alert subscriptions
- Backend: Python/FastAPI in `services/portal-api/`

### `packages/ui`
**Owner**: Design Systems
- Shared components and brand token plumbing

### `packages/design-tokens`
**Owner**: Design Systems
- Shared color palettes, typography scales, spacing values
- Cross-app visual consistency between portal and SaaS apps

### `packages/types`
**Owner**: Platform Architecture
- Cross-app type safety and event contracts

### `packages/ai`
**Owner**: AI Platform Team
- Prompt/version registry
- AI policy and guardrails
- Reusable generation/suggestion engines

### `services/automation-worker`
**Owner**: CRM Automation Team
- Schedules, reminders, SLA checks
- Trigger-based workflows

### `services/ingestion-worker`
**Owner**: Data Integrations Team
- IDX ingestion pipelines
- Data quality checks and retries

### `services/portal-api`
**Owner**: Portal Product Team
- Python/FastAPI backend for the listing portal
- Listing search, AI-powered natural language search, AVM
- PostGIS spatial queries, map tile support
- User auth, saved searches, favorites, alerts
- Background scheduler runs as a dedicated worker process (`python -m app.workers.scheduler_worker`), not inside web startup
- Schema evolution baseline now uses Alembic (`alembic.ini`, `alembic/versions/*`) for versioned migrations
- Requires: PostgreSQL + PostGIS, Redis

## Non-Negotiable Architecture Rules
1. Every request/data operation must be tenant-scoped.
2. Event contracts are versioned and backward compatible.
3. AI-generated content is tagged with provenance metadata.
4. No cross-app private imports; shared logic goes into `packages/*`.
5. All domain onboarding state must be auditable.

## Session Review (2026-03-02)
- Updated to reflect portal-api runtime hardening: scheduler isolation to dedicated worker process and Alembic migration baseline adoption.
