# SEO + AEO Runbook

Last updated: 2026-03-05

## Goal
Ensure the site is discoverable by traditional crawlers and AI agents while keeping development environments safely non-indexed.

## Current Implementation
1. Environment-gated indexing
- Indexing is enabled only when:
  - `NODE_ENV=production`
  - `SEO_ENABLE_INDEXING=true`
- Runtime logic: `apps/web/app/lib/seo/runtime.ts`

2. Core crawl artifacts
- `robots.txt`: `apps/web/app/robots.ts`
- `sitemap.xml`: `apps/web/app/sitemap.ts`
- Metadata + canonical defaults + JSON-LD: `apps/web/app/layout.tsx`

3. AI discovery artifacts
- `GET /llms.txt`
- `GET /.well-known/llms.txt`
- `GET /.well-known/llm.json`
- Markdown extraction endpoints:
  - `GET /api/content/agent.md`
  - `GET /api/content/market.md`
  - `GET /api/content/towns/{townSlug}`

## Why This Matters for LLM Citation
- AI systems can parse markdown and compact JSON faster than heavy interactive HTML.
- `llms.txt` + `.well-known/llm.json` provide a stable index of high-quality citation targets.
- Canonical URLs and JSON-LD strengthen entity understanding for both search engines and answer engines.

## Pre-Launch SEO/AEO Checklist
- [ ] Production env has `SEO_ENABLE_INDEXING=true`.
- [ ] `SEO_METADATA_BASE_URL` points to canonical production domain.
- [ ] `robots.txt` allows indexing and references production sitemap.
- [ ] `sitemap.xml` returns production URLs only.
- [ ] `/.well-known/llms.txt` and `/.well-known/llm.json` return 200.
- [ ] `/api/content/agent.md`, `/api/content/market.md`, and `/api/content/towns/{townSlug}` return markdown with tenant-specific data.
- [ ] Home search page remains `noindex,follow` to avoid filter-URL crawl dilution.

## Validation Commands
```bash
npm run check --workspace @real-estate/web
npm run build --workspace @real-estate/web
npm run verify:seo-aeo --workspace @real-estate/web
```

Staging/prod recommended commands:
```bash
WEB_VERIFY_BASE_URL=https://staging.your-domain.com \
SEO_VERIFY_EXPECT_INDEXING=false \
SEO_VERIFY_EXPECT_BASE_URL=https://staging.your-domain.com \
npm run verify:seo-aeo --workspace @real-estate/web

WEB_VERIFY_BASE_URL=https://www.your-domain.com \
SEO_VERIFY_EXPECT_INDEXING=true \
SEO_VERIFY_EXPECT_BASE_URL=https://www.your-domain.com \
npm run verify:seo-aeo --workspace @real-estate/web
```

## Latest Validation Snapshot (2026-03-05)
- `npm run check --workspace @real-estate/web` — PASS.
- Host Windows `npm run build --workspace @real-estate/web` — PASS.
- Build output confirms route generation for:
  - `/.well-known/llms.txt`
  - `/.well-known/llm.json`
  - `/llms.txt`
  - `/api/content/agent.md`
  - `/api/content/market.md`
  - `/api/content/towns/[townSlug]`
- Local runtime HTTP checks (port `3105`) — PASS (`200`) for:
  - `/robots.txt`, `/sitemap.xml`, `/llms.txt`
  - `/.well-known/llms.txt`, `/.well-known/llm.json`
  - `/api/content/agent.md`, `/api/content/market.md`, `/api/content/towns/greenwich`
  - `/home-search` (`noindex, follow` metadata confirmed in page head)
- Remaining launch gate checks still required in production/staging:
  - `SEO_ENABLE_INDEXING=true` approval in production only.
  - Runtime HTTP verification (`200` responses + canonical production URLs in robots/sitemap).

## Optional Next Enhancements
1. Add property-level canonical pages (`/properties/{slug}`) with `RealEstateListing` JSON-LD.
2. Add `FAQPage` schema from town/neighborhood FAQs where `schemaEnabled=true`.
3. Automate sitemap ping/revalidation on content publish events.
4. Add IndexNow support for non-Google engines if desired.
