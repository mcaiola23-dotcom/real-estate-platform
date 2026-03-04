# PROJECT_OVERVIEW

## Vision
Build a multi-tenant real estate platform that delivers:
1. High-converting, premium agent websites.
2. AI-assisted CRM for lead management and conversion.
3. SaaS control plane for onboarding, billing, provisioning, and support.
4. Consumer-facing listing portal with AI search and property intelligence.

## Product Pillars
- **Web Experience**: Branded, SEO-optimized tenant websites with configurable modules.
- **CRM Intelligence**: Pipeline, automations, reminders, and AI-generated outreach.
- **Content & Data Backbone**: CMS + structured data + event ingestion + integrations.
- **SaaS Operations**: Tenant lifecycle, domain onboarding, subscription management.
- **Portal**: Consumer-facing listing search with AI-powered natural language search, AVM, interactive maps, saved searches, and alerts. Frontend lives in `apps/portal` (Next.js/TypeScript); backend is an external Python/FastAPI service (`portal-api`).

## End Users
- Solo agents (initial ICP)
- Teams (phase 2 expansion)
- Brokerages (phase 3 expansion)

## Business Model
- One-time setup/build fee
- Recurring monthly subscription
- Optional managed services (ads, social, concierge content)

## AI-First Principles
- AI assists setup (site generation + content drafting)
- AI assists conversion (CRM recommendations + automation)
- Human-in-the-loop review for legal/compliance-sensitive outputs

## Current Context
The existing Fairfield prototype remains the baseline implementation. The platform initiative starts in a new parent structure and progressively generalizes the prototype into reusable, tenant-aware components.

## Session Review (2026-03-02)
- Reviewed after portal backend hardening follow-through; product direction remains unchanged, with portal running as Next.js frontend plus independent FastAPI backend.
