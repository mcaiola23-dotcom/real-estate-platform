# ARCHITECTURE

## Target Repository Structure (Monorepo)

```txt
real-estate-platform/
  apps/
    web/                 # Tenant website runtime (Next.js)
    crm/                 # Tenant CRM runtime (Next.js)
    studio/              # CMS authoring (Sanity Studio)
    admin/               # Internal SaaS operations portal
    marketing/           # SaaS marketing site (optional)
  packages/
    ui/                  # Shared design system/components
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

### `packages/ui`
**Owner**: Design Systems
- Shared components and brand token plumbing

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

## Non-Negotiable Architecture Rules
1. Every request/data operation must be tenant-scoped.
2. Event contracts are versioned and backward compatible.
3. AI-generated content is tagged with provenance metadata.
4. No cross-app private imports; shared logic goes into `packages/*`.
5. All domain onboarding state must be auditable.
