# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- **Pick next backlog item** — Lead Profile Modal Overview Tab Production Upgrade is complete and committed. Top candidates:
  - AI content generation pipeline for website onboarding
  - Generate Prisma migrations for Elite Overhaul's 8 new models (production DB target)
  - CRM Listing Modal remaining items (agent notes, engagement data, share actions, tenant-scoped data)
  - Build duplicate lead merge/resolution flow (DuplicateWarning component exists but was removed from modal pending actionable UX)
  - Build actionable escalation flow (EscalationBanner removed pending useful resolution UX beyond "X days overdue")

## Why This Is Next
- Lead Profile Modal Overview Tab Upgrade addressed all 18 review recommendations + 4 user-requested features + 3 rounds of visual polish feedback.
- No other active workstream is in progress — this is a clean starting point.

## Current Snapshot (2026-02-24, Session 19 end)
- **Last commit**: Pending — run `/git-update` to commit Overview Tab Production Upgrade
- **Branch**: `main`
- **CRM status**: All route tests pass (89/89), 0 type errors, build verified
- **Prisma**: Migration `202602240001_add_lead_house_style` created (needs `db:migrate:deploy` for production)

## Key Changes This Session (uncommitted)
1. **Sprint 1** — Lead Type + Status side-by-side, Address full-width, Notes rows=3, Contact layout (Name+Phone half, Email full), $ adornments on price, inputMode on numeric fields, helper text, responsive grid
2. **Sprint 2** — Dead Link Contact button with feedback, SmartReminderForm hideHeader+CollapsibleSection, SVG checkmark, calendar hint, Timeframe dropdown with TIMEFRAME_OPTIONS
3. **Sprint 3** — Full-stack `houseStyle` field (10+ files), PriceRangeSlider with custom pointer-event thumbs and piecewise log scale ($0-$5M linear @ $25K, $5M-$10M+ compressed @ $100K)
4. **Sprint 4** — SourceAttributionChain with SVG icon markers, ResizeObserver auto-fit (most-recent events in single row), connecting line + equal spacing, hover tooltips, click expansion panel
5. **Visual polish** — Source/status pills moved to CollapsibleSection header via headerExtra prop, urgency badges restyled (subtle tinted backgrounds + dark mode), scale markers positioned by actual value percentage, contact name half-width, timeline connecting lines restored

## First Actions Next Session
1. Run `/session-bootstrap`.
2. Review open backlog items and pick highest priority.
3. Consider applying Prisma migration for `houseStyle` to production DB.

## Validation Context (Most Recent)
- `npm run build --workspace @real-estate/crm` — PASS
- `npm run test:routes --workspace @real-estate/crm` — PASS (89/89 tests)

## Constraints To Keep
- Preserve tenant isolation for all CRM and Admin reads/writes.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- No cross-app imports.
- New Prisma models/migrations need `db:migrate:deploy` + `db:generate` when moving to production DB.
- `classifyLeadType()` in `crm-formatters.ts` must stay in sync with `hasUnsavedLeadChange()` and `updateLead()` dirty checks.
