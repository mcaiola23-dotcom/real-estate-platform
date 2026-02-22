# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Continue Admin post-MVP onboarding workflow polish:
  - evaluate whether onboarding bulk mutations need a dedicated backend endpoint (performance/throughput),
  - revisit onboarding usage telemetry rollup window/retention alignment (currently 14-day rollup from audit events),
  - tune telemetry-based bulk-endpoint recommendation thresholds (`ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS`) with real operator usage.
- OR: Continue with remaining platform work — #64 Calendar Sync Phase 2 (external API integration), team/brokerage hierarchy, marketing attribution.

## Why This Is Next
- All CRM AI roadmap items are now complete: #50/#53 (Score Explain/Summary), #55 (Market Digest), #56 (Listing Description), #57 (Predictive Lead Scoring), #58 (Smart Lead Routing).
- Admin onboarding persistence MVP is implemented; the next value is operational polish and observability surfacing on top of that persisted state.
- Windows-authoritative Admin route tests are passing (`50/50`), so the remaining Admin work is product/UX polish.
- CRM route tests are passing (`53/53`) including coverage for all AI endpoints.
- #64 Calendar Sync Phase 2 needs external API integration (Google/Outlook).

## Current Snapshot (2026-02-22, Session 12)
- **Predictive Lead Scoring (#57) fully implemented**:
  - Engine: `packages/ai/src/crm/predictive-scoring.ts` (Naive Bayes, 9 features, Laplace smoothing, 50-lead min threshold)
  - API route: `GET /api/ai/predictive-score/[leadId]` (factory-pattern, tenant-scoped)
  - UI: `AiPredictiveScore.tsx` widget (gold-tinted badge, factor indicators, insufficient-data state)
  - Prompt version: `crm.predictive_score.v1`
  - Integrated into LeadProfileModal gauge wrapper
- **Smart Lead Routing (#58) fully implemented**:
  - Engine: `packages/ai/src/crm/lead-routing.ts` (5 weighted factors, solo/team modes)
  - API route: `GET /api/ai/lead-routing/[leadId]` (factory-pattern, tenant-scoped)
  - UI: `AiLeadRouting.tsx` widget (recommendation cards, factor bars, solo/team views)
  - Prompt version: `crm.lead_routing.v1`
  - Integrated into LeadProfileModal after AiNextActions
- **Validation snapshot**:
  - `tsc --noEmit -p apps/crm/tsconfig.json` — PASS
  - `npm run test:routes --workspace @real-estate/crm` — PASS (53/53 tests)
- **Admin onboarding/telemetry follow-up (completed after Session 12 CRM snapshot)**:
  - Onboarding persistence MVP fully integrated with Launch checklist editing/bulk actions, Action Center/readiness, and observability
  - Cross-tenant onboarding triage queue + readiness scoreboard onboarding risk/progress chips in Platform Health
  - UI + DB enforcement for onboarding owner-actor compatibility (with direct DB compatibility matrix tests)
  - Browser-local onboarding usage telemetry inspector (`admin-usage-telemetry.v1`) with local-vs-published bulk-endpoint recommendations
  - Opt-in aggregate-only telemetry publish route to Admin audit (`POST /api/observability/usage-telemetry`, action `tenant.observability.telemetry.publish`)
  - Server-side observability rollup of published telemetry aggregates (`summary.onboardingUsageTelemetry`, 14-day window)

## First Actions Next Session
1. Run `$platform-session-bootstrap`.
2. Admin polish track (if continuing):
   - evaluate bulk mutation API needs,
   - tune telemetry rollup/review windows and retention expectations,
   - tune shared bulk-endpoint recommendation thresholds using real local/published telemetry data.
3. If Admin polish complete, move to Calendar Sync Phase 2, team/brokerage hierarchy, or marketing attribution.
4. Run relevant tests/build validation after implementation.

## Validation Context (Most Recent)
- `npm run test:routes --workspace @real-estate/crm` — PASS (53/53 tests)
- `tsc --noEmit -p apps/crm/tsconfig.json` — PASS
- `npm run test:routes --workspace @real-estate/admin` — PASS (50/50 tests, Windows-authoritative)
- `node --import tsx --test apps/admin/app/api/lib/routes.integration.test.ts` — PASS (local/WSL, includes onboarding + telemetry publish coverage)
- `tsc --noEmit -p apps/admin/tsconfig.json` — PASS (latest Admin telemetry/observability passes; local run required extended timeout)
- `tsc --noEmit -p packages/db/tsconfig.json` — FAIL only on pre-existing `@real-estate/types/website-config` module-resolution issue (no new onboarding/telemetry type errors)
- Latest Windows-authoritative Prisma sampling: `db:generate:sample -- 12 --json --exit-zero` — PASS (`12/12`, `0` EPERM failures)

## Constraints To Keep
- Preserve tenant isolation for all CRM and Admin reads/writes.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- Do not do manual browser walkthroughs unless the user changes direction.
