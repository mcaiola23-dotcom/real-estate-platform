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
