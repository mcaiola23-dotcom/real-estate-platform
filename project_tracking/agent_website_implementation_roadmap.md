# Agent Website Implementation Roadmap (Phases 1-4)

## Purpose
This document is the canonical implementation plan for improving the agent website (`apps/web`) before launch.
It is meant to be updated as work is completed so multiple agents can coordinate against one source of truth.

## Scope
- Primary: `apps/web`
- Related shared packages: `packages/types`, `packages/db`
- Related content system: `apps/studio`
- Related ops surface: `apps/admin`

## Locked Decisions (2026-03-04)
1. Multi-tenant data approach: shared Sanity dataset per environment by default, with strict tenant scoping; optional enterprise isolation mode can be added later.
2. SEO posture: keep SEO blocked in development/local until launch readiness gate is approved.
3. Listings source posture: mock listing data is temporary; IDX/live MLS provider integration is required before launch.

## Baseline Snapshot (2026-03-04)
1. Typecheck: `npx tsc --noEmit --project apps/web/tsconfig.json` fails (`apps/web/scripts/blog-pipeline.ts` type mismatch).
2. Lint: `npm run lint --workspace @real-estate/web` fails (`40 errors`, `20 warnings`).
3. Build: `npm run build --workspace @real-estate/web` blocked in this sandbox due Google Fonts network fetch; requires host-runtime confirmation.
4. Security posture gaps: public API routes need rate limiting/bot/origin controls; lead route logs PII.
5. SaaS repeatability gap: tenant resolution exists, but major branding/content surfaces remain hardcoded to a single agent identity.

## Status Model
- `Planned`: not started
- `In Progress`: actively being worked
- `Blocked`: waiting on dependency/decision
- `Done`: complete and validated

## Phase 1: Security + Stability Baseline
Status: `Done`

### Objective
Establish trustworthy baseline quality and hardening before further feature/system expansion.

### Work Items
- [x] Add API abuse controls for public write routes (`/api/lead`, `/api/valuation`, `/api/website-events`): rate limiting, origin checks, payload caps, bot mitigation hook. (Implemented 2026-03-04 via `apps/web/app/lib/api-security.ts` + route wiring.)
- [x] Remove plaintext PII logging from website APIs and replace with redacted structured logging. (Implemented 2026-03-04 in `/api/lead` and `/api/valuation` routes.)
- [x] Standardize request validation for all public routes using Zod. (Implemented 2026-03-04 by adding `WebsiteEventRequestSchema` and applying it in `/api/website-events`.)
- [x] Remove transitional tenant-fallback profile queries (`!defined(tenantId)` pattern) and enforce strict tenant scope. (Implemented 2026-03-04 in `api/user/profile` + `api/user/sync` using strict tenant lookups.)
- [x] Backfill/migrate legacy `userProfile` docs with missing tenant fields. (Implemented 2026-03-04 with on-access legacy migration helper `apps/web/app/lib/user-profile.ts`.)
- [x] Add app-level security headers policy for deployed environments. (Implemented 2026-03-04 in `apps/web/proxy.ts` with baseline headers and production-only HSTS/CSP policy.)
- [x] Restore green quality gates for `apps/web` typecheck and lint. (Completed 2026-03-04: `npx tsc --noEmit --project apps/web/tsconfig.json` passes; `npm run lint --workspace @real-estate/web` passes with warnings only.)
- [x] Add env validation/fail-fast for required server secrets and API settings. (Implemented 2026-03-04 via `apps/web/app/lib/runtime-env.ts` and runtime gating in `apps/web/proxy.ts`.)

### Exit Criteria
- [x] `apps/web` typecheck passes.
- [x] `apps/web` lint passes.
- [x] Public APIs enforce abuse controls.
- [x] PII is no longer logged in plaintext.
- [x] Tenant profile operations are strictly tenant-scoped.

## Phase 2: Performance + Speed
Status: `Done`

### Objective
Reduce user-visible latency and map/modal interaction friction while preserving current UI/UX.

### Work Items
- [x] Replace broad `force-dynamic` usage with route-appropriate rendering and revalidation policies. (Completed 2026-03-04 for content/static routes by switching to explicit ISR windows; retained `force-dynamic` only on tenant-header-dependent town/neighborhood pages.)
- [x] Add cached query layer for Sanity/content fetches with explicit invalidation strategy. (Completed 2026-03-04 via `apps/web/app/lib/sanity.cache.ts`, cache-tagged query wiring in `apps/web/app/lib/sanity.queries.ts`, and token-protected revalidation endpoint `apps/web/app/api/sanity/revalidate/route.ts`.)
- [x] Enable Sanity CDN for eligible public read paths. (Completed 2026-03-04 in `apps/web/app/lib/sanity.client.ts` with production-default CDN reads and env override via `NEXT_PUBLIC_SANITY_USE_CDN`.)
- [x] Decompose `HomeSearchClient` into focused modules/hooks (URL state, filters, results orchestration, analytics, modal state). (Completed 2026-03-04: extracted URL-state parsing/building module `app/home-search/lib/search-url-state.ts` and search execution hook `app/home-search/hooks/useHomeSearchResults.ts`, with `HomeSearchClient` consuming these boundaries.)
- [x] Optimize map runtime (`HomeSearchMap`) to reduce per-marker event overhead and state churn. (Completed 2026-03-04: removed per-marker map event listeners, memoized map component/markers, deduped bounds-change emissions, and added marker icon cache reuse.)
- [x] Reduce first-open modal latency via staged/deferred data and section loading. (Completed 2026-03-04: switched `ListingModal` to dynamic loading with idle prefetch and card-hover prewarm.)
- [x] Introduce listings provider interface (`ListingsProvider`) so current mock source can be swapped with IDX provider cleanly. (Completed 2026-03-04: extended provider contract with `getListingsByIds` + `listNeighborhoods`, removed direct mock coupling from `HomeSearchClient`, and added provider selection boundary with `NEXT_PUBLIC_LISTINGS_PROVIDER` + controlled IDX fallback behavior in `listings.provider.ts`.)
- [x] Add instrumentation for key user timings (map pan/zoom update latency, modal first-open latency). (Completed 2026-03-04: added dev-only timing traces for search execution and first modal mount latency.)

### Exit Criteria
- [x] Home search/map interactions are materially smoother.
- [x] Modal first-open latency is materially reduced.
- [x] Content routes use targeted rendering/caching strategy.
- [x] Listings provider contract is stable and IDX-ready.

## Phase 3: Multi-Tenant Productization
Status: `Done`

### Objective
Make website replication for new clients configuration-first, not code-edit-first.

### Work Items
- [x] Define tenant website config contract for identity/brand/contact/legal/SEO defaults. (Completed 2026-03-04 via shared type contract `packages/types/src/tenant-website.ts` and tenant profile resolver `apps/web/app/lib/tenant/website-profile.ts`.)
- [x] Replace hardcoded agent-specific layout/header/footer/intro/CTA content with tenant-driven configuration. (Completed 2026-03-04 for core shell paths in `layout.tsx`, `components/Header.tsx`, `components/GlobalFooter.tsx`, `components/AgentIntroSection.tsx`, homepage CTA surfaces, and home-search/Listing modal CTA text paths.)
- [x] Add tenant theme token model (colors, typography, component style variants) with current design as default baseline. (Completed 2026-03-04 in `TenantWebsiteThemeTokens` + default Fairfield theme tokens in `website-profile.ts`.)
- [x] Add tenant scoping strategy for tenant-owned content docs (`town`, `neighborhood`, `post`, `userProfile`, related website docs). (Completed 2026-03-04 by adding tenant fields to Studio schemas and introducing scoped query policy with default-tenant legacy fallback behavior.)
- [x] Update Sanity query layer to enforce tenant filtering for tenant-owned content. (Completed 2026-03-04 in `apps/web/app/lib/sanity.queries.ts`, including tenant-aware cache-key partitioning.)
- [x] Create migration/backfill scripts to attach tenant metadata to existing content. (Completed 2026-03-04: backfill script supports explicit tenant overrides (`--tenant-id`, `--tenant-slug`, `--tenant-domain`, `--types`); authoritative dry-run validated `97` candidates, apply run patched all `97` docs, and post-apply dry-run reports `0` remaining candidates.)
- [x] Add tenant onboarding seed flow/template for launching a new agent site from configuration. (Completed 2026-03-04 via `apps/web/scripts/scaffold-tenant-onboarding.ts`, tenant profile registry decomposition (`apps/web/app/lib/tenant/configs/*`), and generated onboarding artifact templates under `apps/web/scripts/content/tenant-onboarding/<tenant-slug>/`.)
- [x] Define future enterprise isolation mode design (optional per-tenant dedicated dataset/project). (Completed 2026-03-04 via `project_tracking/agent_website_enterprise_isolation_mode.md`.)

### Exit Criteria
- [x] Core website identity/content is tenant-driven.
- [x] Tenant-owned content is explicitly and consistently scoped.
- [x] New tenant setup is mostly configuration + content seeding.

## Phase 4: Maintainability + Launch Operations
Status: `Done`

### Objective
Create a maintainable, testable, launch-safe operating model for multi-agent development.

### Work Items
- [x] Continue breaking down large files into maintainable modules with clear ownership boundaries. (Completed 2026-03-04 by extracting search toolbar/results panel modules from `HomeSearchClient` and keeping map/modal orchestration isolated.)
- [x] Remove duplicate/unused hooks and stale dead-code paths. (Completed 2026-03-04 with warning-driven cleanup in shared/town/home-search components and provider-driven home-search paths.)
- [x] Clean tracked artifact/backups not needed in source control. (Completed 2026-03-04 by removing tracked generated backup/log artifacts and adding `apps/web/.gitignore` protections.)
- [x] Add smoke tests for critical route/API/tenant-resolution/auth flows. (Completed 2026-03-04 via `apps/web/tests/smoke/*.smoke.test.ts` + `test:smoke` script.)
- [x] Add performance regression checks for key pages and interactions. (Completed 2026-03-04 via `apps/web/tests/perf/home-search.perf.test.ts` + `test:perf` script.)
- [x] Add environment-gated SEO launch controls (`robots`, `sitemap`, `metadataBase`) to keep dev blocked and production launch-safe. (Completed 2026-03-04 in `layout.tsx`, `robots.ts`, `sitemap.ts`, and `lib/seo/runtime.ts`.)
- [x] Replace boilerplate app docs with operational runbooks (architecture, onboarding, release checklist). (Completed 2026-03-04 in `apps/web/docs/*` and refreshed `apps/web/README.md`.)
- [x] Add final launch readiness checklist and rollback plan. (Completed 2026-03-04 via `apps/web/docs/launch-readiness-checklist.md`.)

### Exit Criteria
- [x] Codebase is modular and easier to evolve safely.
- [x] Critical flows have baseline smoke coverage.
- [x] SEO and launch toggles are environment-safe and checklist-driven.
- [x] Team has repeatable onboarding/release runbooks.

## Post-Roadmap Execution (Launch Path)
Status: `In Progress`

### Objective
Close launch-path integration and discoverability tasks after the 4-phase hardening plan.

### Work Items
- [x] Finalize secure IDX provider cutover boundary (server-side bridge contract + internal route proxy; no IDX secrets in browser runtime). (Completed 2026-03-05 via `apps/web/app/lib/data/providers/idx-bridge.ts`, `apps/web/app/api/listings/provider/route.ts`, and provider wiring in `apps/web/app/lib/data/providers/listings.provider.ts`.)
- [x] Add AI-agent discovery surfaces (`llms.txt`, `/.well-known/llms.txt`, `/.well-known/llm.json`) and markdown extraction endpoints for high-signal website content. (Completed 2026-03-05 via `apps/web/app/llms.txt/route.ts`, `apps/web/app/.well-known/*`, and `apps/web/app/api/content/*.md/route.ts`.)
- [x] Extend crawl controls and metadata for SEO/AEO (AI-bot allowances, canonical defaults, JSON-LD expansion, search-page noindex policy, sitemap inclusion for AI discovery URLs). (Completed 2026-03-05 in `apps/web/app/robots.ts`, `apps/web/app/layout.tsx`, `apps/web/app/home-search/page.tsx`, and `apps/web/app/sitemap.ts`.)
- [x] Add regression coverage for new listings-provider and SEO/AEO surfaces. (Completed 2026-03-05 via `apps/web/tests/smoke/listings-provider.smoke.test.ts` and `apps/web/tests/smoke/seo-aeo.smoke.test.ts`.)
- [x] Re-run launch-path validation commands, including host-authoritative build runtime. (Completed 2026-03-05: `npm run check --workspace @real-estate/web` pass in WSL; `cmd.exe /c \"... npm run build --workspace @real-estate/web\"` pass in host Windows runtime.)
- [x] Document operational cutover/launch steps for IDX and SEO/AEO. (Completed 2026-03-05 via `apps/web/docs/idx-cutover-runbook.md`, `apps/web/docs/seo-aeo-runbook.md`, and release checklist updates.)
- [x] Add reusable verification scripts for SEO/AEO endpoint health and IDX bridge readiness checks. (Completed 2026-03-05 via `apps/web/scripts/verify-seo-aeo.ts`, `apps/web/scripts/verify-idx-provider.ts`, and workspace scripts `verify:seo-aeo`, `verify:idx-provider`, `verify:launch`.)

### Remaining Exit Criteria
- [ ] Staging runtime verification of AI discovery/content endpoints (`/.well-known/*`, `/api/content/*.md`) with production-like env variables.
- [ ] Staging verification of live IDX bridge responses against provider contract.
- [ ] Production launch-gate approval for indexing (`SEO_ENABLE_INDEXING=true` only in approved prod environment).

## Sequencing and Dependencies
1. Execute Phase 1 first; no Phase 2+ coding starts until baseline hardening/quality gates are green.
2. Start Phase 2 after Phase 1 exit criteria pass.
3. Start Phase 3 after Phase 2 provider/caching patterns are stable.
4. Use Phase 4 as hardening/ops closeout before launch readiness sign-off.

## Change Management Rules
1. Preserve current UI layout/visual quality unless explicitly approved otherwise.
2. Keep tenant isolation explicit in every schema/query/API change.
3. Record command validation results in `.brain/CURRENT_FOCUS.md` and `.brain/DECISIONS_LOG.md` as phases advance.
4. Keep this roadmap status updated in-place so all agents work from the same plan.

## Progress Log
- 2026-03-04: Initial roadmap created from full `apps/web` review. No implementation changes made yet.
- 2026-03-04: Phase 1 started. Added shared API guard utility (origin/rate/payload/bot hook), removed plaintext lead PII logs, and upgraded website-events payload validation to Zod.
- 2026-03-04: Removed transitional tenant fallback profile queries and added strict tenant profile lookup + lazy migration path for legacy `userProfile` docs without tenant fields.
- 2026-03-04: Added `apps/web` runtime security header policy + env fail-fast guardrail in `proxy.ts` and `app/lib/runtime-env.ts`.
- 2026-03-04: Cleared `apps/web` quality gates by fixing legacy lint/typecheck blockers (unsafe `any`, hook safety violations, unescaped JSX text, and blog pipeline typing). Current baseline: `tsc` pass and `lint` pass (warnings only).
- 2026-03-04: Started Phase 2 by replacing broad `force-dynamic` usage with route-level `revalidate` policies on homepage, towns index, insights routes, and sitemap; tenant-header-dependent town/neighborhood detail routes intentionally remain dynamic.
- 2026-03-04: Implemented cache-tagged Sanity query layer with explicit invalidation strategy (`sanity.cache.ts` + `/api/sanity/revalidate`), and wired towns/neighborhood/posts sitemap/content queries to shared cached fetches.
- 2026-03-04: Enabled Sanity CDN for eligible read paths with safe defaults (`NODE_ENV=production` => CDN on) and explicit env override (`NEXT_PUBLIC_SANITY_USE_CDN`).
- 2026-03-04: Completed first home-search performance slice in `apps/web`: reduced `HomeSearchMap` listener/render churn, added stale-search guardrails, deferred map listing updates, dynamically loaded `ListingModal` with prefetching, and added dev-only search/modal timing traces.
- 2026-03-04: Completed Phase 2 closeout by extracting `HomeSearchClient` URL/search orchestration into reusable modules/hooks and finalizing the listings provider cutover boundary (provider selection + provider-backed saved/neighborhood/listing lookups with no direct mock-data client coupling).
- 2026-03-04: Started Phase 3 by introducing a tenant website identity/SEO/contact/legal/theme contract (`packages/types/src/tenant-website.ts`) plus default tenant profile resolver (`apps/web/app/lib/tenant/website-profile.ts`), then wired core shell + CTA surfaces to config-driven values (layout metadata/JSON-LD, header, footer, homepage intro/hero/CTA, home-search CTA, listing inquiry/modal contact copy, and contact form success/error copy).
- 2026-03-04: Extended Phase 3 tenant scoping implementation by adding tenant fields to Studio schemas (`town`, `neighborhood`, `post`, `userProfile`), enforcing tenant filters in Sanity query helpers with tenant-aware cache keys, and adding tenant metadata backfill script scaffold (`apps/web/scripts/backfill-sanity-tenant-content.ts`).
- 2026-03-04: Validated tenant-content backfill dry-run in authoritative environment (`97` candidate patches; `town=9`, `neighborhood=69`, `post=19`, `userProfile=0`), extended script CLI to accept tenant overrides/scoped doc-type execution, then ran apply mode and patched all `97` candidate docs; post-apply dry-run confirms `0` remaining candidates.
- 2026-03-04: Completed Phase 3 tenant onboarding scaffolding by splitting tenant profile registry into per-tenant modules (`apps/web/app/lib/tenant/configs/*`) and adding `tenant:onboard:scaffold` (`apps/web/scripts/scaffold-tenant-onboarding.ts`) to generate website profile modules plus provisioning/backfill templates for new tenants.
- 2026-03-04: Completed Phase 3 by documenting optional enterprise isolation mode design (`project_tracking/agent_website_enterprise_isolation_mode.md`) covering dedicated dataset/project strategy, tenant metadata model, rollout sequencing, and rollback controls.
- 2026-03-04: Completed Phase 4 by extracting home-search UI modules (`SearchToolbar`, `ResultsSidebar`), adding SEO launch gating in metadata/robots/sitemap, introducing smoke/perf test suites (`npm run check --workspace @real-estate/web` now includes lint/typecheck/smoke/perf), replacing boilerplate docs with runbooks/checklists, and cleaning tracked generated backup/log artifacts from `apps/web`.
- 2026-03-05: Completed post-roadmap IDX cutover boundary by adding secure server-side bridge wiring (`/api/listings/provider`) and provider contract runtime/env validation for mock-to-IDX switch control.
- 2026-03-05: Completed post-roadmap SEO/AEO discovery slice by adding `llms.txt` + `.well-known` artifacts, markdown extraction endpoints, and AI-bot crawl allowances in robots/sitemap/metadata.
- 2026-03-05: Re-validated launch-path quality gates with `npm run check --workspace @real-estate/web` PASS and host-authoritative `cmd.exe /c \"... npm run build --workspace @real-estate/web\"` PASS.
- 2026-03-05: Fixed town markdown extraction route path by migrating from `/api/content/towns/[townSlug].md` to `/api/content/towns/[townSlug]` (dynamic segment), and updated llm discovery/docs/tests accordingly.
- 2026-03-05: Ran local runtime HTTP smoke against built server (port `3105`) and confirmed `200` responses for robots, sitemap, llms artifacts, markdown content endpoints, and `/home-search`.
- 2026-03-05: Added reusable verification scripts for launch-path checks (`verify:seo-aeo`, `verify:idx-provider`) and validated both against local server runtime.
