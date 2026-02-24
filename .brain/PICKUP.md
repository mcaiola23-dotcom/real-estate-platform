# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- **Lead Profile Modal redesign** based on comprehensive UI/UX audit completed 2026-02-23 (Session 14).
- The CRM Elite Overhaul remains uncommitted — 19 modified files + 7 new files. Needs commit + push before or after modal work.
- A detailed 20-point audit was completed covering layout, usability, design, and Listing Modal integration. The user wants to address layout density, container overlap, Lead Intelligence section formatting, non-editable fields, and unclear display items.
- The Listing Modal from `apps/web` should be integrated into the CRM so users can click on listing references to view full listing details.

## Why This Is Next
- User identified the Lead Profile Modal as the priority concern: layout is too busy, containers overlap, Lead Intelligence box formatting is wrong, some fields are not editable, and some displayed items are unclear.
- User is happy with the features/information being displayed but wants design, layout, and usability improvements.
- Listing Modal integration is a new feature request: CRM users should be able to click on listing references (in timeline, suggested properties, etc.) to open the same listing modal used on the agent website.

## Current Snapshot (2026-02-23, Session 14)
- **No code changes this session** — review and audit only.
- **Audit findings** (20 items across 6 categories):
  - **A. Structural/Layout (4 issues)**: Single-scroll with buried 2-col grid, Lead Intelligence section overflow/imbalance, nested container visual noise, responsive breakpoint gap
  - **B. Component-Level (7 issues)**: Mixed concerns in Lead+Contact section (~15 data points unorganized), two separate "next action" concepts (three places to set follow-up), disabled contact fields with no link/create affordance, two save buttons, messaging tools under "Intelligence" label, emoji icons, misleading MLS Property Card naming
  - **C. Usability (6 issues)**: No tab/section navigation, listing signals not clickable, suggested properties not previewable, orphaned voice note section, showing scheduler address sync, no focus trap
  - **D. Visual Design (3 issues)**: Flat typography hierarchy, dense padding, button hierarchy lacking
  - **E. Listing Modal Integration (10 items)**: Remove agent branding for CRM context, replace inquiry CTA with CRM actions, add lead context header, agent annotations, engagement data, tenant-scope, keep gallery, add agent data, share functionality, cross-app component strategy via `packages/ui` or types
  - **F. Recommended Changes (17 items)**: Tabbed navigation, section grouping, unified next-action, link contact affordance, single save, clickable listings, focus trap, SVG icons, increased spacing, border reduction, heading hierarchy, collapsible sections, CrmListingModal wrapper, shared component extraction

## First Actions Next Session
1. Run `/session-bootstrap`.
2. Decide priority: commit existing CRM changes first, OR start Lead Modal redesign directly on top of current uncommitted work.
3. Implement Lead Profile Modal redesign — recommended order:
   a. Add tabbed navigation (Overview / Communication / Intelligence / Activity)
   b. Restructure Lead+Contact Details into logical groups
   c. Unify the three "next action" concepts
   d. Move messaging tools to Communication tab
   e. Increase spacing, reduce nested borders
   f. Make listing references clickable
4. Create `CrmListingModal` wrapper for Listing Modal integration (shared types from `packages/types`, no cross-app imports).
5. Run type checks and tests after changes.

## Validation Context (Most Recent — unchanged this session)
- `npm run test:routes --workspace @real-estate/crm` — PASS (89/89 tests)
- `npm run test:workspace --workspace @real-estate/crm` — PASS (4/4 tests)
- `tsc --noEmit -p apps/crm/tsconfig.json` — PASS (0 errors)
- `npm run test:routes --workspace @real-estate/admin` — PASS (50/50 tests, Windows-authoritative, unchanged)
- Latest Windows-authoritative Prisma sampling: `db:generate:sample -- 12 --json --exit-zero` — PASS (`12/12`, `0` EPERM failures)

## Constraints To Keep
- Preserve tenant isolation for all CRM and Admin reads/writes.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- No cross-app imports: Listing Modal integration requires shared types/component wrapper, not importing from `apps/web` into `apps/crm`.
- New Prisma models (Showing, Commission, CommissionSetting, Campaign, CampaignEnrollment, AdSpend, TeamMember, ESignatureRequest) need migration generation when moving to production DB.
- `dompurify` added as CRM dependency for Gmail HTML sanitization — `npm install` required after fresh clone.
