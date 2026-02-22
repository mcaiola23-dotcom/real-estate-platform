# apps/crm — Tenant CRM Runtime

Tenant-scoped CRM for lead management, contact tracking, activity logging, and pipeline workflows.

## Architecture

- Single-page workspace component: `app/components/crm-workspace.tsx` (large, stateful — be careful with edits)
- Design system in `app/globals.css` with CRM-specific tokens and responsive layout rules
- Matt Caiola brand language: stone-neutral palette, serif heading accents (Cormorant Garamond + Inter)

## Tenant & Auth

- `proxy.ts` — Clerk middleware with tenant header stamping (same pattern as web app)
- `app/lib/tenant/resolve-tenant.ts` — Host-based resolution with fallback
- `app/api/lib/tenant-route.ts` — Shared helper extracting auth + tenant context for API routes
- Dev auth bypass available via `app/lib/auth/mode.ts` (no Clerk required locally)

## API Routes

All routes are tenant-scoped and use dependency-injected handler factories (`create*Handler`):

- `GET/POST /api/leads` — Lead listing with filters/pagination, lead creation
- `GET/PATCH /api/leads/[leadId]` — Lead detail and inline updates
- `GET/POST /api/contacts` — Contact listing, contact creation
- `PATCH /api/contacts/[contactId]` — Inline contact edits
- `GET/POST /api/activities` — Activity listing and logging
- `GET /api/ai/lead-score-explain/[leadId]` — AI-powered score explanation with factor breakdown
- `GET /api/ai/next-action/[leadId]` — Rule-based + AI-enhanced next best action suggestions
- `GET /api/ai/lead-summary/[leadId]` — AI-generated lead summary with key signals
- `POST /api/ai/draft-message` — AI message drafting with tone presets
- `POST /api/ai/extract-insights` — Structured insight extraction from conversation text
- `app/api/lib/query-params.ts` — Shared query parser for filters/pagination

## Key Patterns

- **Draft-first editing**: Lead status/notes use client-side drafts with optimistic saves and rollback
- **Lead Profile Modal**: Central navigation target from activity feed, lead cards, search, pipeline, table rows
- **Pipeline board**: Independent filter state from dashboard, with filter-conflict notices on status changes
- **Workspace interactions**: Reusable helpers in `app/lib/workspace-interactions.ts` for nav, sort, filter logic
- **Display labels**: Canonical source/type/status mapping in `app/lib/crm-display.ts`

## Testing

```bash
npm run test:routes --workspace @real-estate/crm      # Route integration tests (37+ tests)
npm run test:workspace --workspace @real-estate/crm    # Interaction helper unit tests
```

- Route tests in `app/api/lib/routes.integration.test.ts` — uses dependency injection, no module mocking
- Interaction tests in `app/lib/workspace-interactions.test.ts`

## Commands

```bash
npm run dev --workspace @real-estate/crm     # Port 3001
npm run build --workspace @real-estate/crm
npm run lint --workspace @real-estate/crm
```
