# Component-by-Component Product Spec

## 1. Tenant Website Product (`apps/web`)

### 1.1 Core Experience
- Home page, about, services, towns/neighborhoods, insights/blog, contact.
- Listing search + listing detail + inquiry funnel.
- Seller funnel: valuation/CMA lead generation.

### 1.2 Configurable Modules
- Towns and neighborhoods explorer
- AVM / valuation flow
- Mortgage calculator
- Closing cost calculator
- Blog/insights
- Testimonials/social proof
- CTA blocks and lead forms

### 1.3 AI-Assisted Site Builder
- Guided onboarding wizard captures brand, service area, positioning, modules.
- AI drafts:
  - About copy
  - Service page copy
  - Hyperlocal town/neighborhood summaries
  - FAQ starters
- User edits/approves drafts before publish.

### 1.4 Domain Management Requirements
- Bring-your-own-domain support.
- Platform-purchased-domain option during onboarding.
- Domain verification + SSL provisioning + health checks.

### 1.5 Success Metrics
- Visitor-to-lead conversion rate
- Form completion rates
- Search engagement depth
- Organic traffic growth

---

## 2. CRM Product (`apps/crm`)

### 2.1 Pipeline Core
- Stages: New, Contacted, Qualified, Touring, Offer, Under Contract, Closed/Lost.
- Kanban + list views.
- Owner assignment and SLA timers.

### 2.2 Contact & Lead Intelligence
- Unified contact timeline (forms, inquiries, listing interactions, notes).
- Source/UTM attribution.
- Saved searches and listing intent context.

### 2.3 Automation Core
- Rule-based reminders.
- Auto-task generation by trigger/state change.
- Drip sequences by lead profile and stage.

### 2.4 AI CRM Copilot
- Next-best-action recommendation.
- Suggested outreach drafts (email/SMS/call scripts).
- Timing guidance based on activity and response behavior.
- Lead heat score and risk flags.

### 2.5 Success Metrics
- Response-time SLA adherence
- Stage conversion rates
- Time-to-close
- AI suggestion acceptance rate

---

## 3. Content & Data Backbone

### 3.1 CMS Functions (`apps/studio`)
- Structured page/content authoring.
- Reusable section snippets.
- Editorial review/publish workflow.

### 3.2 Data Layer
- Tenant-safe storage model.
- Domain mapping data.
- Website events + CRM activities.
- Integration records for IDX and messaging providers.

### 3.3 Integrations
- IDX provider abstraction and adapters.
- Email and SMS provider adapters.
- Ads and analytics connectors.

### 3.4 AI Data Inputs
- Approved content corpus per tenant.
- Event stream summaries.
- Compliance-safe prompt context builder.

---

## 4. SaaS Control Plane (`apps/admin`)

### 4.1 Tenant Lifecycle
- Sign-up, onboarding, trial/activation.
- Website provisioning from template presets.
- CRM workspace initialization.

### 4.2 Billing
- Setup fee collection.
- Subscription plan management.
- Add-on management (marketing services, concierge edits).

### 4.3 Platform Operations
- Domain status dashboard.
- Feature flags by plan.
- Support tooling, logs, and audits.

### 4.4 Expansion Paths
- Team support (shared pipelines, role hierarchy).
- Brokerage support (multi-office controls, reporting rollups).

---

## 5. Packaging & Commercial Offer

### 5.1 Plan Matrix (Control Plane Canonical)

The following plan matrix is the commercial baseline and maps directly to control-plane plan codes:
`starter`, `growth`, `pro`, `team`.

| Plan | Primary ICP | Included Feature Set | Setup Fee (Target) | Monthly Subscription (Target) |
|------|-------------|----------------------|--------------------|-------------------------------|
| Starter | Solo agent launching first premium web + CRM stack | `crm_pipeline`, `lead_capture` | USD 2,500 | USD 399 |
| Growth | Solo/high-velocity agent optimizing conversion workflows | Starter + `behavior_intelligence`, `automation_sequences` | USD 4,000 | USD 749 |
| Pro | Mature solo/small team needing advanced automation and domain ops | Growth + `ai_nba`, `domain_ops` | USD 6,500 | USD 1,199 |
| Team | Multi-user team/boutique brokerage with shared operations | Pro feature set + expanded seats/governance | USD 9,500 | USD 1,899 |

Commercial constraints:
- Setup fee is charged once per tenant at onboarding kickoff.
- Monthly subscription starts on launch date or 21 calendar days after kickoff, whichever occurs first.
- Plan changes become effective at next billing cycle unless an immediate change is required for launch blockers.

### 5.2 Setup Package Scope and Onboarding SLAs

Core setup package includes:
- Tenant provisioning in Admin (`slug`, plan, feature flags, actor seed).
- Website brand baseline (logo/colors/typography tokens, homepage/services/contact, core CTA funnels).
- Domain onboarding (BYOD attach, DNS guidance, verification, SSL readiness check).
- CRM baseline (pipeline stages, contact fields, lead intake routing, notification defaults).
- Analytics and operational baseline (core event capture, audit visibility, first observability snapshot).

Standard onboarding SLA (business days):
- Day 0-2: Kickoff and intake packet completion.
- Day 3-5: Initial website + CRM draft delivery.
- Day 6-10: Revisions and domain onboarding progress checks.
- Day 11-15: Launch readiness review and production go-live.

SLA policy notes:
- SLA clock pauses when client dependencies are outstanding (DNS access, brand assets, legal approvals).
- Each tenant gets up to 2 structured revision rounds inside setup scope.
- Scope beyond baseline setup (net-new module builds, custom integrations, major IA changes) is handled via change order.

### 5.3 Managed Services Add-ons and Operating Model

Managed services catalog:
- Paid Media Operations: campaign build, budget pacing, lead-quality monitoring, monthly optimization memo.
- Social Content Operations: monthly content calendar, post production/publishing, engagement response guidance.
- Concierge Content Updates: rolling copy/page updates, listing spotlight updates, local market refreshes.

Managed service operating model:
- Service unit: one operator pod (Account Lead + Specialist) supports 12-20 active tenants.
- Cadence: weekly execution review, bi-weekly client update, monthly KPI/roadmap review.
- Contract minimum: 3-month initial term for each add-on.
- Fulfillment SLA: first response to managed-service requests within 1 business day; standard changes delivered within 3 business days.

### 5.4 Future Strategic Add-on
- Listing portal/network layer (deferred until core SaaS unit economics are stable).

## Session Review (2026-02-17)
- Reviewed during CRM checklist completion session; no scope/architecture/process changes required in this file beyond confirming continued tenant-isolation and shared-package boundaries.
