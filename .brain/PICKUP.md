# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Continue CRM UI/UX overhaul. Most phases complete. Next priority: **Phase 8 (AI Integration Foundation)** which unblocks Phases 9A/9B/9D and Phase 13E-13G.
- Implementation plan: `/home/mc23/.claude/plans/glistening-sniffing-pie.md`

## Why This Is Next
- The user's directive is "as many CRM phases as we can get through per session."
- Phase 8 (AI Integration Foundation) is the largest remaining enabler — it unlocks AI-powered features across CRM.
- User said "save AI for last" — all non-AI phases are now complete except Phase 14D-14I (advanced features like mobile, offline, calendar sync).
- Phase 14 items (D-I) are lower priority stretch goals.

## Current Snapshot
- Completed this session (2026-02-21, session 4):
  - **Phase 3**: Active Transactions — 4 DB models (Transaction, TransactionParty, TransactionDocument, TransactionMilestone), migration `202602210002_add_transaction_models`, 7 API routes (factory pattern), 5 UI components (TransactionsView, TransactionPipeline, TransactionCard, TransactionDetailModal, NewTransactionForm), workspace nav integration.
  - **Phase 12B**: Lead Source ROI Chart — SourceRoiChart component with editable cost inputs, pure CSS bar chart, ROI tier coloring, wired into AnalyticsView.
  - **Phase 13A**: Unified Lead Timeline — UnifiedTimeline + TimelineEvent components replacing 3 separate sections. Category filter chips, day grouping, relative timestamps, category-colored left borders.
  - **Phase 13B**: Lead Tags — DB migration `202602210003_add_lead_tags` (tags TEXT column on Lead), LeadTagInput component with autocomplete + preset suggestions, `GET /api/leads/tags` endpoint, PATCH support, filter-by-tag in list query.
  - **Phase 13C**: Source Attribution Chain — SourceAttributionChain component with transit-map visualization, auto-computed from lead source + activities, deduplication of consecutive same-type events, overflow indicator.
  - **Phase 13D**: Duplicate Detection — `findPotentialDuplicateLeads` DB helper (email/phone/address matching), `GET /api/leads/duplicates` route (factory pattern), DuplicateWarning component with View/Dismiss actions, wired into LeadProfileModal.
- Previously completed (sessions 1-3):
  - Phase 0: Component Decomposition
  - Phase 1A-1E: UI Enhancements
  - Phase 2: Properties Section
  - Phase 4: Drag-and-Drop Pipeline
  - Phase 5: Dark Mode
  - Phase 6A/6B: ICS Calendar + Performance
  - Phase 7: Auto Lead-to-Property Matching
  - Phase 10A-10D: My Day, Conversion Funnel, Revenue Pipeline, Breadcrumb
  - Phase 11A-11C: Command Palette, Notification Center, Pinned Leads
  - Phase 12A/12C: Analytics View, CSV Export
  - Phase 14A-14C: Pipeline Swimlanes, Deal Values, Pipeline Aging
  - Phase 9C (partial): Communication Quick Actions
- Still pending:
  - Phase 8: AI Integration Foundation (packages/ai scaffold)
  - Phase 9A/9B/9D: Reminders, Templates, Escalation (depends on Phase 8)
  - Phase 13E-13G: AI Market Digest, AI Listing Desc, AI features (depends on Phase 8)
  - Phase 14D-14I: Win/Loss Analysis, Mobile, Offline, Calendar Sync, MLS Feed, Documents

## Validation (Most Recent)
- `npx tsc --noEmit -p apps/crm/tsconfig.json` — CLEAN (0 errors).
- `npm run lint --workspace @real-estate/crm` — 0 errors, 2 warnings (pre-existing unused eslint-disable in seed script).
- `npm run test:routes --workspace @real-estate/crm` — 25/25 pass.
- `npm run test:workspace --workspace @real-estate/crm` — 4/4 pass.

## Key New Files This Session
- `packages/db/prisma/migrations/202602210002_add_transaction_models/migration.sql`
- `packages/db/prisma/migrations/202602210003_add_lead_tags/migration.sql`
- `packages/db/src/transactions.ts` — Transaction CRUD helpers
- `packages/types/src/transactions.ts` — Transaction type contracts
- `apps/crm/app/api/transactions/**` — 7 transaction API route files
- `apps/crm/app/components/transactions/**` — 5 transaction UI components
- `apps/crm/app/components/analytics/SourceRoiChart.tsx` — ROI chart
- `apps/crm/app/components/leads/UnifiedTimeline.tsx` — Unified timeline
- `apps/crm/app/components/leads/TimelineEvent.tsx` — Timeline event
- `apps/crm/app/components/leads/LeadTagInput.tsx` — Tag input with autocomplete
- `apps/crm/app/components/leads/SourceAttributionChain.tsx` — Attribution chain
- `apps/crm/app/components/leads/DuplicateWarning.tsx` — Duplicate warning
- `apps/crm/app/api/leads/tags/route.ts` — Tags listing endpoint
- `apps/crm/app/api/leads/duplicates/route.ts` — Duplicate detection endpoint

## First Actions Next Session
1. Run `/session-bootstrap`.
2. Phase 8 (AI Integration Foundation) is the recommended next phase — scaffold `packages/ai/` and create CRM AI endpoints.
3. Phase 8 requires scaffolding `packages/ai/` package with prompt templates, orchestration logic, and config.
4. After Phase 8, unlock Phase 9A/9B/9D (reminders, templates, escalation) and Phase 13E-13G (AI features).

## Constraints To Keep
- Preserve tenant isolation for all request/event paths and UI data interactions.
- Keep shared package boundaries strict: no cross-app imports.
- Follow factory pattern for new API routes.
- Strict React lint rules: no setState in effects, no ref access during render.
- Treat Windows-authoritative command results as canonical when WSL sandbox limitations are present.
- Use `/frontend-design` skill for UI component design work.
