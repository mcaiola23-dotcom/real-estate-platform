# apps/admin — SaaS Control Plane Portal

Internal admin portal for tenant provisioning, domain management, billing, RBAC, diagnostics, and audit operations.

## Architecture

- Single-page workspace component: `app/components/control-plane-workspace.tsx` (very large — edit carefully)
- Design system in `app/globals.css` with admin tokens (Manrope body + Fraunces headings)
- Multi-step guided onboarding wizard (Tenant Basics → Primary Domain → Plan & Features → Review & Provision)

## Auth & Access Control

- `proxy.ts` — Clerk middleware with `auth.protect()` enforcement
- `app/api/lib/admin-access.ts` — Admin-only mutation guard
  - Reads admin role from `x-admin-role` header or Clerk session metadata
  - Emits structured audit events for all mutations (allowed/denied/succeeded/failed)
  - `buildAuditRequestMetadata()` captures request attribution for audit trail
- Only `role: admin` can perform control-plane mutations

## API Routes

All mutation routes enforce admin access and emit audit events:

- `/api/tenants` — Tenant provisioning (POST) and listing (GET)
- `/api/tenants/[tenantId]/status` — Tenant lifecycle (archive/restore)
- `/api/tenants/[tenantId]/settings` — Plan code and feature flags
- `/api/tenants/[tenantId]/domains` — Domain attach/list
- `/api/tenants/[tenantId]/domains/[domainId]` — Domain update (verify, set primary)
- `/api/tenants/[tenantId]/domains/probe` — Backend DNS/TLS verification probes
- `/api/tenants/[tenantId]/actors` — RBAC actor management
- `/api/tenants/[tenantId]/actors/[actorId]` — Actor update/remove
- `/api/tenants/[tenantId]/actors/[actorId]/support-session` — Support session start/end
- `/api/tenants/[tenantId]/billing` — Billing subscription management
- `/api/tenants/[tenantId]/diagnostics` — Health checks and remediation actions
- `/api/admin-audit` — Audit timeline with advanced filters
- `/api/observability` — Control-plane health summary
- `/api/billing/webhooks` — External billing provider event ingestion

## Key Helpers

- `app/lib/mutation-error-guidance.ts` — Parses mutation errors into operator-friendly guidance with field hints
- `app/lib/plan-governance.ts` — Plan templates, required/allowed features, guardrail enforcement
- `app/api/lib/domain-probe.ts` — DNS (A/AAAA/CNAME) + TLS certificate probing

## Testing

```bash
npm run test:routes --workspace @real-estate/admin    # Route integration tests (33+ tests)
```

- Tests in `app/api/lib/routes.integration.test.ts` — uses dependency-injected handler factories
- Covers auth guards, RBAC denial, payload validation, lifecycle transitions, audit behavior

## Commands

```bash
npm run dev --workspace @real-estate/admin    # Port 3002
npm run build --workspace @real-estate/admin
npm run lint --workspace @real-estate/admin
```
