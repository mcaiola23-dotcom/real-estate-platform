# Agent Website Architecture

Last updated: 2026-03-04

## Runtime Layers
1. Edge middleware (`apps/web/proxy.ts`)
- Resolves tenant by host.
- Adds tenant headers for downstream route/page handlers.
- Applies baseline security headers.

2. App shell (`apps/web/app/layout.tsx`)
- Loads tenant website config.
- Applies metadata, branding shell, and JSON-LD.
- Enforces SEO launch gating through runtime config.

3. Data access layer (`apps/web/app/lib`)
- `tenant/*`: tenant resolution + website profile config.
- `sanity.*`: content clients/query/cache.
- `data/providers/*`: listings/towns/schools/places/walkscore provider boundaries.
- `data/providers/idx-bridge.ts`: server-only bridge for secure IDX provider calls.
- `api-security.ts`: API abuse and payload guards.

4. Feature surfaces
- Home search (`apps/web/app/home-search/*`): map/search/listing modal flow.
- Content routes (`towns`, `insights`, static pages): cache-tagged Sanity fetches.
- Public APIs (`/api/lead`, `/api/valuation`, `/api/website-events`): guarded + validated.
- AI discovery routes (`/llms.txt`, `/.well-known/llm.json`, `/api/content/*.md`): crawler-friendly extraction endpoints for answer engines.

## Multi-Tenant Contract
- Shared type contract: `packages/types/src/tenant-website.ts`.
- Tenant profile registry: `apps/web/app/lib/tenant/configs/*`.
- Tenant-owned content documents include tenant identifiers and are filtered by tenant-aware queries.

## Performance Model
- Route-level caching uses explicit `revalidate` and tag-based invalidation.
- Home-search map/listing UX uses deferred rendering and dynamic modal loading.
- Provider boundary supports mock-to-IDX cutover without UI rewrites.

## Security Model
- Public write APIs enforce:
- Origin checks
- Request size caps
- Rate limiting
- Structured schema validation
- Runtime env validation can fail-fast when strict mode is enabled.
