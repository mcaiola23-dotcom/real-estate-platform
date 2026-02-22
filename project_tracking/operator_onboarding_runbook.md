# Operator Onboarding Runbook (Sales -> Ops -> Build -> Launch)

## Purpose
Provide a practical operator workflow for onboarding new clients into the platform using the current high-touch sales model, while aligning to the canonical plan matrix, setup scope, onboarding SLA, and managed-services baseline defined in `.brain/PRODUCT_SPEC.md` (sections `5.1`-`5.3`).

## When To Use This
- A client has been qualified and is moving toward close.
- The deal is closed and kickoff is approved.
- The team needs a repeatable handoff from sales to operations/build.

## Operating Model (Current Reality)
- Most clients will close through calls/video/in-person meetings, not self-serve checkout.
- `apps/admin` is the internal control plane for tenant provisioning, domains, billing, diagnostics, and support workflows.
- `apps/web` and `apps/crm` are tenant-scoped runtimes that get provisioned/configured per client.
- Website production remains a guided template/configuration workflow (not full no-code yet).

## Canonical Plan Matrix (Control Plane Plan Codes)
These plan codes map directly to Admin and tenant settings:
- `starter`
- `growth`
- `pro`
- `team`

### Plan Selection Baseline (Commercial Targets)
- `starter`: setup target `USD 2,500`, monthly target `USD 399`
- `growth`: setup target `USD 4,000`, monthly target `USD 749`
- `pro`: setup target `USD 6,500`, monthly target `USD 1,199`
- `team`: setup target `USD 9,500`, monthly target `USD 1,899`

### Plan Selection Rules (Operator Summary)
- Setup fee is charged once at onboarding kickoff.
- Monthly subscription starts on launch date or 21 calendar days after kickoff (whichever occurs first).
- Plan changes apply next billing cycle unless needed immediately to remove a launch blocker.

## Core Setup Package Scope (Baseline)
The standard setup package includes:
1. Tenant provisioning in Admin (`slug`, plan, feature flags, actor seed/baseline access setup).
2. Website brand baseline (logo/colors/typography tokens, core pages, CTA funnels).
3. Domain onboarding (attach domain, DNS guidance, verification, SSL readiness checks).
4. CRM baseline (pipeline, contact fields, lead intake routing, notification defaults).
5. Analytics and operations baseline (core event capture, audit visibility, initial observability state).

## Standard Onboarding SLA (Business Days)
1. Day 0-2: Kickoff and intake packet completion
2. Day 3-5: Initial website + CRM draft delivery
3. Day 6-10: Revisions and domain onboarding progress checks
4. Day 11-15: Launch readiness review and go-live

### SLA Policy Notes
- SLA clock pauses when client dependencies are outstanding (DNS access, brand assets, legal approvals).
- Each tenant gets up to 2 structured revision rounds within setup scope.
- Net-new modules, custom integrations, or major information architecture changes require a change order.

## Managed Services Add-ons (Post-Launch / Cross-Sell)
- Paid Media Operations
  - Campaign build, budget pacing, lead-quality monitoring, monthly optimization memo.
- Social Content Operations
  - Content calendar, post production/publishing, engagement response guidance.
- Concierge Content Updates
  - Rolling copy/page updates, listing spotlights, local market refreshes.

### Managed Services Operating Model (Operator Notes)
- One operator pod (Account Lead + Specialist) supports roughly 12-20 active tenants.
- Weekly execution review, bi-weekly client update, monthly KPI/roadmap review.
- 3-month initial term for each add-on.
- Fulfillment SLA: first response within 1 business day; standard changes within 3 business days.

## Workflow: Sales -> Ops -> Build -> Launch

### Stage 1: Sales Qualification / Discovery
Owner: Sales / Founder

Checklist:
- Confirm ICP fit (solo agent, high-velocity solo, team/boutique brokerage).
- Identify likely plan tier (`starter`, `growth`, `pro`, `team`).
- Capture key goals:
  - website lead generation
  - CRM workflow maturity
  - timeline urgency
  - domain ownership status
- Flag custom requests that may require change-order handling.

Exit criteria:
- Proposed plan tier selected.
- Pricing expectations aligned.
- Kickoff path identified.

### Stage 2: Close + Kickoff Handoff
Owner: Sales -> Ops handoff

Required handoff packet:
- Client legal business name + operating brand name
- Primary contact(s)
- Chosen plan tier
- Signed scope / proposal
- Payment/setup fee status
- Domain ownership/registrar access status
- Brand assets status (logo/headshot/colors)
- Required launch timeline

Operator decision points:
- Any scope expansion beyond baseline setup?
- Any launch blocker risk (DNS access, delayed approvals)?
- Need immediate plan upgrade for launch-critical features?

### Stage 3: Tenant Provisioning in Admin
Owner: Ops

Admin flow:
1. `Create a Tenant`
2. `Choose a Tenant`
3. `Launch Setup (Domain + Plan + Features)`

Checklist:
- Create tenant with stable `slug`
- Set primary domain placeholder or production domain
- Apply canonical plan code
- Apply plan-aligned feature flags (use plan guardrails/template)
- Confirm tenant/settings lifecycle statuses are active

Exit criteria:
- Tenant exists in Admin
- Plan and feature flags saved
- Primary domain configured (or temporary placeholder documented)

### Stage 4: Website + CRM Baseline Build
Owner: Ops / Build team

Website baseline:
- Apply approved branding (logo/colors/type)
- Configure core pages and CTA funnels
- Confirm contact pathways are correct

CRM baseline:
- Confirm pipeline stages / intake routing
- Confirm lead capture routes are connected
- Confirm default notifications / operator access

Exit criteria:
- Internal draft ready for review
- Core client-facing paths functional

### Stage 5: Domain Onboarding + Verification
Owner: Ops (with client dependencies)

Checklist:
- Provide DNS instructions to client/IT
- Track propagation progress
- Poll domain status in Admin
- Confirm DNS verification
- Confirm SSL/certificate readiness

If blocked:
- Pause SLA clock if client dependency is outstanding
- Record blocker and next follow-up date

Exit criteria:
- Primary domain verified
- SSL readiness confirmed

### Stage 6: Review + Revision Rounds
Owner: Ops / Build team + client

Checklist:
- Collect consolidated feedback
- Keep changes within baseline scope unless approved as change order
- Track revision round count (max 2 inside baseline)
- Reconfirm launch date and dependencies

Exit criteria:
- Client sign-off (or approved launch go-ahead)
- No unresolved blockers

### Stage 7: Launch Readiness + Go-Live
Owner: Ops

Launch readiness checklist:
- Tenant active
- Settings active
- Primary domain configured and verified
- SSL/certificate ready
- Plan/features final
- Contact/legal info present
- Website/CRM baseline validated

Go-live:
- Confirm production domain routing
- Monitor diagnostics/observability after launch
- Capture post-launch status note

### Stage 8: Post-Launch Support + Expansion
Owner: Ops / Support / Account Lead

Checklist:
- Assign tenant actors and support roles
- Run diagnostics baseline
- Review billing/entitlement drift status
- Identify managed-services upsell opportunity
- Schedule first KPI / optimization review

## Change-Order Triggers (Operator Escalation)
Escalate and document change-order review when requests include:
- net-new modules/features not in baseline scope
- custom integrations
- major IA/layout redesign beyond template variants
- additional revision rounds beyond package limit
- compressed timelines requiring out-of-band delivery effort

## Notes for Current Platform State
- Admin portal supports tenant provisioning/domain ops/billing/support/audit, but website production is still moving toward a reusable template system.
- Use the reusable website implementation plan in `project_tracking/platform_plan.md` for the buildout roadmap.
