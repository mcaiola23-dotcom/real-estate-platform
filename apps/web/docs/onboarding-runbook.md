# Tenant Onboarding Runbook

Last updated: 2026-03-04

## Goal
Launch a new agent tenant using configuration + content seeding with minimal code editing.

## Inputs Required
- Tenant slug and primary domain
- Agent and brand identity details
- Brokerage/contact details
- Theme token preferences
- Service area towns/cities

## Steps
1. Scaffold tenant profile artifacts
```bash
npm run tenant:onboard:scaffold --workspace @real-estate/web -- \
  --slug <tenant-slug> \
  --brand-name "<brand>" \
  --agent-name "<agent>" \
  --email "<email>" \
  --phone-display "<display-phone>" \
  --phone-e164 "<e164-phone>" \
  --primary-domain "<tenant-domain>" \
  --write
```

2. Register DNS/domain + hosting route
- Point domain to deployed app.
- Confirm host resolves to correct tenant in middleware.

3. Backfill tenant metadata in content
```bash
npm run sanity:tenant-backfill --workspace @real-estate/web -- \
  --tenant-id tenant_<tenant-slug> \
  --tenant-slug <tenant-slug> \
  --tenant-domain <tenant-domain> \
  --dry-run
```
- Review patch counts.
- Re-run with `--apply` once validated.

4. Validate quality gates
```bash
npm run check --workspace @real-estate/web
```

5. Smoke validation checklist
- Tenant domain loads correct branding.
- Home search works (map, modal, autocomplete).
- Lead and valuation forms submit successfully.
- Content routes (towns/insights) resolve tenant-scoped content.

## Handoff Outputs
- Tenant profile file committed.
- Backfill command log recorded in `project_tracking`.
- Launch checklist status updated.
