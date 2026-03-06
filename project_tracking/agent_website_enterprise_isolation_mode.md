# Agent Website Enterprise Isolation Mode Design

Last updated: 2026-03-04

## Goal
Define an optional enterprise operating mode for `apps/web` where a tenant can run on dedicated content infrastructure while preserving the current shared multi-tenant model for standard tenants.

## Current Baseline
- Tenant resolution: host-based (`apps/web/app/lib/tenant/resolve-tenant.ts`)
- Website identity/theme: tenant config contract (`packages/types/src/tenant-website.ts`)
- Content model: shared Sanity dataset per environment with strict tenant scoping in queries
- Default launch mode: shared dataset + tenant filters

## Why This Exists
Some enterprise clients may require stricter isolation for:
- Contractual data boundaries
- Independent publishing workflows
- Dedicated API limits and operational blast-radius reduction

## Isolation Modes
1. Shared (default): current model, all tenants in one environment dataset with tenant-level filters.
2. Dedicated Dataset: same Sanity project, separate dataset per enterprise tenant.
3. Dedicated Project + Dataset: separate Sanity project and dataset for highest isolation.

## Required Platform Additions
1. Extend tenant record metadata (DB):
- `contentIsolationMode`: `shared` | `dedicated_dataset` | `dedicated_project`
- `sanityProjectId` (optional override)
- `sanityDataset` (optional override)
- `sanityReadTokenRef` / `sanityWriteTokenRef` (secret references, never plaintext in code)

2. Add tenant-aware Sanity client factory:
- Input: resolved `TenantContext`
- Output: cached server clients keyed by project/dataset
- Behavior: fallback to shared defaults when no overrides exist

3. Update query/cache keys:
- Include `tenantId`, `sanityProjectId`, and `sanityDataset` in cache key/tag composition
- Keep existing tenant filter for shared mode; remove legacy fallback behavior for dedicated modes

4. Ops controls:
- Provisioning checklist for enterprise content workspace
- Per-tenant revalidation secrets
- Per-tenant monitoring dashboard slices (error rate, latency, cache hit)

## Rollout Plan
1. Data model prep
- Add DB fields and admin UI support for content isolation metadata.

2. Runtime enablement (dark launch)
- Implement client factory and key partitioning with feature flag disabled.
- Validate shared-mode parity on existing tenant(s).

3. Dedicated dataset pilot
- Provision one non-production pilot tenant on `dedicated_dataset`.
- Run content read/write validation + cache invalidation validation.

4. Production readiness
- Add runbook for isolation onboarding and incident rollback to shared mode.
- Gate by explicit tenant-level flag.

## Rollback Strategy
- Keep shared config as an always-available fallback path.
- Tenant-level rollback is metadata-only: switch `contentIsolationMode` to `shared` and clear overrides.
- Revalidation endpoint purges tenant cache after rollback switch.

## Decision
- Enterprise isolation mode is **approved as optional architecture**.
- Default mode for standard agent sites remains **shared dataset with strict tenant scoping**.
- Implementation is deferred until first enterprise requirement, with this design as the authoritative blueprint.
