# apps/web — Tenant Website Runtime

Public-facing, SEO-optimized tenant websites. Single deployable runtime serving multiple tenant domains.

## Tenant Resolution

- `proxy.ts` resolves tenant by request hostname and stamps `x-tenant-*` headers
- `app/lib/tenant/resolve-tenant.ts` provides async tenant lookup with seed-backed fallback
- Every API route and data provider must receive and use tenant context
- Localhost falls back to the default Fairfield tenant

## Key Directories

- `app/api/` — Lead capture, valuation, user profile/sync, website-events endpoints
- `app/lib/data/providers/` — Data fetchers (listings, places, schools, taxes, walkscore, atAGlance) — all require `TenantScope` parameter
- `app/lib/tenant/` — Tenant resolution utilities
- `app/lib/modules/` — Tenant module toggle registry
- `app/lib/analytics/` — Website event tracking helpers
- `app/home-search/` — Home search page with listing views, favorites, and search tracking

## Data Flow

- Lead/valuation form submissions enqueue events via `packages/db` ingestion helpers (queue-first, not direct CRM writes)
- Website behavior events (`search.performed`, `listing.viewed`, `listing.favorited`, `listing.unfavorited`) flow through `/api/website-events` into the ingestion queue
- Sanity CMS provides dynamic content (towns, neighborhoods, blog posts)

## Conventions

- Clerk authentication with custom stone-palette appearance
- Cormorant Garamond (headings) + Inter (body) typography
- `next.config.ts` has `experimental.externalDir: true` and `turbopack.root` pointing to monorepo root for workspace imports
- SEO structured data (JSON-LD) on key pages

## Commands

```bash
npm run dev --workspace @real-estate/web     # Port 3000
npm run build --workspace @real-estate/web
npm run lint --workspace @real-estate/web
```
