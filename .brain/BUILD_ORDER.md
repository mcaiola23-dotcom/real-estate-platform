# Prioritized Build Order

## Phase 0 — Foundation & Migration (Immediate)

### 0.1 Monorepo Bootstrap
1. Create `real-estate-platform` parent repo.
2. Create `apps/`, `packages/`, `services/`, `infra/`, `docs/brain`.

### 0.2 Exact Migration Plan
1. Keep current Fairfield repo untouched as baseline.
2. Clone/copy current site into `real-estate-platform/apps/web`.
3. Move existing Sanity studio into `real-estate-platform/apps/studio`.
4. Verify both run independently.
5. Add workspace tooling (pnpm/turbo or npm workspaces).
6. Extract shared config into `packages/config`.
7. Begin extracting reusable UI into `packages/ui`.
8. Add shared types in `packages/types`.
9. Stand up initial architecture docs in `docs/brain`.

### 0.3 Exit Criteria
- Apps run from monorepo.
- No regression in existing website behavior.
- Shared tooling and docs established.

---

## Phase 1 — Tenant-Aware Website Runtime
1. Add tenant/domain resolver middleware.
2. Add `Tenant`, `TenantDomain`, `WebsiteConfig` schema.
3. Implement theme/module toggles from tenant config.
4. Implement onboarding seed templates.
5. Add domain onboarding flow (BYOD + managed purchase state model).

Exit: multiple tenants can render different sites from one runtime.

---

## Phase 2 — CRM MVP
1. Build CRM app skeleton (`apps/crm`).
2. Add lead/contact/activity data model.
3. Build pipeline views + task/reminder workflows.
4. Ingest website form/activity events into CRM timeline.
5. Add basic automations and notifications.

Exit: CRM operational for solo-agent production usage.

---

## Phase 3 — AI Website Builder + AI CRM Copilot
1. Build onboarding wizard for site generation.
2. Create prompt templates + policy constraints in `packages/ai`.
3. Implement AI content draft generation + approval workflow.
4. Implement CRM next-best-action and outreach draft suggestions.
5. Add AI observability: prompt/version/result logging.

Exit: AI materially reduces setup time and follow-up effort.

---

## Phase 4 — SaaS Control Plane + Billing
1. Build `apps/admin` for tenant operations.
2. Add billing, plan enforcement, usage limits.
3. Add support tools, audit logs, and status dashboards.
4. Implement feature flags and entitlement checks.

Exit: external customer onboarding and monetization ready.

---

## Phase 5 — Team/Brokerage Expansion
1. Add hierarchical org model (brokerage/team/agent).
2. Add lead routing and shared pipeline options.
3. Add roll-up analytics and manager reporting.
4. Add enterprise controls (roles, approvals, policy constraints).

Exit: platform is sellable to teams and brokerages.

---

## Phase 6 — Optional Growth Products
1. Managed marketing service workflows.
2. Ads/social attribution dashboard tied to CRM outcomes.
3. Listing portal/network strategy validation and pilot.

Exit: additional revenue channels beyond core SaaS subscription.

---

## Build Governance Rules
- No feature starts without owner, metric, and exit criteria.
- Every phase must leave behind updated docs in `docs/brain`.
- Tenant isolation and auditability are mandatory gates.
