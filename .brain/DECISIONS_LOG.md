# DECISIONS_LOG

## 2026-02-11
### D-001: Use monorepo structure for platform expansion
**Decision**: Adopt parent repository `real-estate-platform` with `apps/`, `packages/`, `services/`, `infra/`, and `docs/brain`.
**Reason**: Enables shared code/contracts while keeping deployable boundaries.

### D-002: Preserve current Fairfield codebase as immutable baseline
**Decision**: Keep existing website folder unchanged; migrate by clone/copy into new monorepo.
**Reason**: Reduces delivery risk and preserves working prototype continuity.

### D-003: Build tenant-aware runtime before broad CRM/portal expansion
**Decision**: Prioritize tenant/domain resolution and config-driven website rendering.
**Reason**: This is foundational to serving multiple customer domains.

### D-004: AI is core product capability, not a bolt-on
**Decision**: Establish dedicated `packages/ai` and AI observability from early phases.
**Reason**: AI-driven site generation and CRM recommendations are strategic differentiators.

## 2026-02-12
### D-005: Resolve tenant at the web edge and stamp tenant headers
**Decision**: Add host-based tenant resolution in `apps/web/proxy.ts` and attach `x-tenant-*` headers to every matched request.
**Reason**: Establishes tenant context early for downstream APIs/data access and provides deterministic behavior for localhost development.

### D-006: Consume tenant context in active web capture endpoints
**Decision**: Update `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts` to read tenant context from request headers (with resolver fallback).
**Reason**: Keeps tenant scope explicit where lead/event data first enters backend logic and reduces cross-tenant data risk during transition.

### D-007: Standardize root workspace orchestration for monorepo workflows
**Decision**: Add a root `package.json` with npm workspaces (`apps/*`, `packages/*`, `services/*`) and top-level scripts for `dev`, `build`, and `lint` targeting `@real-estate/web` and `@real-estate/studio`; rename app package names to those unique workspace identifiers.
**Reason**: Establishes a single command surface for multi-app development and unblocks shared package adoption without app-to-app coupling.

### D-008: Establish `@real-estate/types` as the shared contract source
**Decision**: Create `packages/types` with tenant/domain contracts and versioned website event contracts; migrate active tenant resolution typing in `apps/web` to import from `@real-estate/types`.
**Reason**: Centralized contracts reduce type drift across apps/services and provide a consistent base for tenant persistence and CRM event ingestion work.

### D-009: Route tenant host resolution through shared db package lookups
**Decision**: Introduce `packages/db` with seed-backed `Tenant`/`TenantDomain` records and lookup utilities, then refactor `apps/web/app/lib/tenant/resolve-tenant.ts` to resolve tenants via `@real-estate/db/tenants` instead of local in-memory host maps.
**Reason**: Keeps tenant/domain data access in a shared persistence boundary and creates a direct migration path to durable storage without reworking web runtime resolution logic.

### D-010: Tenant-scope user profile APIs and provider cache keys
**Decision**: Update `apps/web/app/api/user/profile/route.ts` and `apps/web/app/api/user/sync/route.ts` to read tenant context from request headers and scope user profile reads/writes by `tenantId`; update `walkscore` and `googlePlaces` provider cache variants to include tenant identifiers and pass tenant context from town pages via server headers.
**Reason**: Prevents cross-tenant user/profile collisions and shared cached data leakage as multiple tenant domains are introduced.

### D-011: Require explicit tenant context in remaining static/client provider interfaces
**Decision**: Add a shared `TenantScope` type for provider boundaries and update `atAGlance`, `taxes`, `schools`, and `listings` provider signatures (plus key module/page call sites including `home-search`) to accept explicit tenant context parameters instead of relying on implicit single-tenant assumptions.
**Reason**: Keeps tenant scoping explicit at API/provider boundaries across both server and client execution paths, reducing accidental cross-tenant coupling during future provider swaps (e.g., real IDX or tenant-specific content feeds).

### D-012: Pin Turbopack monorepo root and external workspace imports in `apps/web`
**Decision**: Configure `apps/web/next.config.ts` with `experimental.externalDir: true` and explicit `turbopack.root` to the monorepo root.
**Reason**: Prevents unstable workspace resolution and module-not-found failures when importing shared packages (`@real-estate/db`, `@real-estate/types`) from middleware and runtime code during local development.

### D-013: Add durable tenant/domain persistence scaffolding with runtime-safe resolver fallback
**Decision**: Add Prisma-based durable storage scaffolding in `packages/db` (`prisma/schema.prisma`, initial migration SQL, and seed workflow) and refactor tenant lookup utilities to prefer durable lookups in Node runtime while retaining seed fallback in edge/runtime-constrained contexts.
**Reason**: Establishes a migration-backed persistence path for `Tenant`/`TenantDomain` without breaking edge tenant resolution in `apps/web/proxy.ts`, where direct Node DB clients are not reliably available.

### D-014: Standardize local tenant DB materialization with Prisma generate/deploy/seed workflow
**Decision**: Use `npm install` at root, then run `db:generate`, `db:migrate:deploy`, and `db:seed` scripts in `@real-estate/db` with `DATABASE_URL` explicitly targeting the package-local SQLite file (`packages/db/prisma/dev.db`) for local tenant persistence setup.
**Reason**: Provides a deterministic and repeatable local bootstrap path for durable `Tenant`/`TenantDomain` storage and keeps runtime lookups aligned with migration-managed schema state.

### D-015: Model website/module tenant controls in shared contracts, db schema, and web page registry
**Decision**: Add shared `WebsiteConfig`/`ModuleConfig` contracts in `packages/types`, add Prisma models + migration for `WebsiteConfig` and `ModuleConfig` in `packages/db`, and add tenant module toggle consumption in `apps/web` town/neighborhood pages through a shared server helper (`app/lib/modules/tenant-modules.ts`).
**Reason**: Makes module visibility tenant-configurable through shared package boundaries and keeps module gating deterministic and tenant-scoped as the web runtime transitions to configurable SaaS behavior.

### D-016: Switch db seeding to SQL execution for runtime-agnostic local bootstrap
**Decision**: Change `@real-estate/db` `db:seed` from Node Prisma client script to CLI SQL execution (`prisma db execute --file prisma/seed.sql`) and keep Prisma client generation optional for runtime lookups.
**Reason**: Avoids Node module interop/runtime coupling in seed flow and provides a deterministic seed path even when Prisma client generation is blocked by local Windows file locking.

### D-017: Fail open to seed-backed tenant/module records when Prisma runtime queries fail
**Decision**: Add defensive fallback behavior in `packages/db` tenant/module lookup paths (`tenants.ts`, `website-config.ts`, and shared `prisma-client` URL resolution) so runtime query/init failures return seed-backed tenant and module records instead of throwing.
**Reason**: Prevents frontend/server page crashes from local Prisma runtime instability (e.g., invalid DB path or engine lock issues) and preserves deterministic tenant-isolated behavior while durable DB tooling is stabilized.

## 2026-02-13
### D-018: Establish tenant-aware CRM runtime skeleton with protected auth boundary
**Decision**: Scaffold apps/crm as a Next.js workspace app with monorepo-aware config, host-based tenant resolution/header stamping in apps/crm/proxy.ts, protected Clerk middleware routes (public sign-in/sign-up/health), and initial auth session API scaffolding in apps/crm/app/api/session/route.ts.
**Reason**: Creates the minimum CRM runtime foundation needed for tenant-isolated lead/contact/activity development while keeping auth and tenant context enforcement aligned with shared package boundaries from day one.

### D-019: Add CRM core relational model in shared db package
**Decision**: Extend `packages/db/prisma/schema.prisma` with tenant-scoped `Contact`, `Lead`, `Activity`, and `IngestedEvent` models and apply migration `202602130001_add_crm_core_models`.
**Reason**: Provides durable CRM primitives for lead lifecycle tracking and activity history while preserving strict tenant isolation at the persistence layer.

### D-020: Ingest website lead/valuation events directly into CRM persistence with idempotency keying
**Decision**: Add shared ingestion helpers in `packages/db/src/crm.ts` and wire `apps/web/app/api/lead/route.ts` and `apps/web/app/api/valuation/route.ts` to call `ingestWebsiteEvent`, recording deduplicated `IngestedEvent` records plus derived `Lead`/`Activity` (and `Contact` when available).
**Reason**: Establishes an operational website-to-CRM data path immediately, with deterministic idempotency and tenant scoping, before introducing a separate worker/queue layer.

### D-021: Replace fragile direct Prisma generate with safe wrapper for Windows lock conditions
**Decision**: Change `@real-estate/db` `db:generate` to `packages/db/scripts/db-generate-safe.mjs` that retries after engine artifact cleanup and falls back gracefully when Windows DLL lock conditions (`EPERM`) persist; keep `db:generate:direct` for explicit full-engine attempts.
**Reason**: Improves day-to-day reliability of local schema/client generation in this Windows environment while preserving a direct command path for full engine regeneration.
