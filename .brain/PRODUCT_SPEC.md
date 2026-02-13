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

### Base Offer
- Website + CRM + hosting + support.

### Advanced Offer
- AI automations, advanced reporting, team controls.

### Optional Add-ons
- Paid media management
- Social content operations
- Concierge content updates

### Future Strategic Add-on
- Listing portal/network layer (deferred until core SaaS unit economics are stable).
