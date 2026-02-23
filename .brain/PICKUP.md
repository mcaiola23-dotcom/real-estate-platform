# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- **CRM Elite Overhaul is fully implemented** (all 8 sprints complete, 0 type errors, 93 tests passing).
- The overhaul is uncommitted — 20 modified files + 29 new files (~3,700 lines of changes). Needs commit + push.
- Next non-CRM roadmap item: **Implement AI content generation pipeline for website onboarding** (shared `packages/ai` + tenant-safe onboarding workflow integration).
- OR: user may want to do a manual browser walkthrough of the new CRM features first.

## Why This Is Next
- CRM Elite Overhaul introduced ~35 new files spanning state management (Zustand/React Query), agent features (showings, commissions, voice notes, campaigns, team, ad spend), AI differentiators (NL query, daily digest, forecast, benchmarks, AI workflows), design system (fonts, density, motion), infrastructure (SSE, 36 new route tests, DOMPurify, rate limiter, DB indexes), and client-facing features (portal, MLS cards, e-signatures).
- All CRM AI roadmap items remain complete. Admin onboarding work is unaffected by this session.
- User deferred Calendar Sync Phase 2 (#64), team/brokerage hierarchy, and marketing attribution for later.

## Current Snapshot (2026-02-23, Session 13)
- **CRM Elite Overhaul — all 8 sprints implemented**:
  - Sprint 1: Zustand store + React Query hooks + Quick-Add Lead + Universal Search + Pipeline Card Density
  - Sprint 2: SpeedToLeadTimer + FloatingActivityLog + Browser Push Notifications
  - Sprint 3: Showing scheduling + Commission tracker + Voice notes (3 Prisma models: Showing, CommissionSetting, Commission)
  - Sprint 4: Typography (Outfit/JetBrains Mono) + Motion/micro-interactions + DensityToggle + Color system
  - Sprint 5: Drip campaigns + Ad spend tracker + Team roster (4 Prisma models: Campaign, CampaignEnrollment, AdSpend, TeamMember)
  - Sprint 6: AI Workflow Panel + NL query in CommandPalette + NotificationDigest + ForecastPanel + BenchmarkPanel
  - Sprint 7: SSE real-time endpoint + useRealtimeEvents hook + 36 new route tests (89 total) + DOMPurify + rate limiter + composite DB indexes
  - Sprint 8: Client portal (HMAC-signed tokens) + MLS property cards + E-Signature panel (1 Prisma model: ESignatureRequest)
- **Validation snapshot**:
  - `tsc --noEmit -p apps/crm/tsconfig.json` — PASS (0 errors)
  - `npm run test:routes --workspace @real-estate/crm` — PASS (89/89 tests)
  - `npm run test:workspace --workspace @real-estate/crm` — PASS (4/4 tests)
- **Admin work unaffected**: Admin route tests were 50/50 at session start and this session only touched CRM files.

## First Actions Next Session
1. Run `$platform-session-bootstrap`.
2. Commit the CRM Elite Overhaul changes if not yet committed.
3. Decide next priority: AI content generation pipeline for website onboarding, OR manual browser walkthrough of CRM features, OR user-directed work.
4. Treat Calendar Sync Phase 2 (#64), team/brokerage hierarchy, and marketing attribution as deferred until re-prioritized.

## Validation Context (Most Recent)
- `npm run test:routes --workspace @real-estate/crm` — PASS (89/89 tests)
- `npm run test:workspace --workspace @real-estate/crm` — PASS (4/4 tests)
- `tsc --noEmit -p apps/crm/tsconfig.json` — PASS (0 errors)
- `npm run test:routes --workspace @real-estate/admin` — PASS (50/50 tests, Windows-authoritative, unchanged this session)
- Latest Windows-authoritative Prisma sampling: `db:generate:sample -- 12 --json --exit-zero` — PASS (`12/12`, `0` EPERM failures)

## Constraints To Keep
- Preserve tenant isolation for all CRM and Admin reads/writes.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- New Prisma models (Showing, Commission, CommissionSetting, Campaign, CampaignEnrollment, AdSpend, TeamMember, ESignatureRequest) need migration generation when moving to production DB.
- `dompurify` added as CRM dependency for Gmail HTML sanitization — `npm install` required after fresh clone.
