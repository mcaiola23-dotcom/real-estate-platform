# Launch Readiness Checklist and Rollback Plan

Last updated: 2026-03-05

## Launch Checklist
- [x] `npm run check --workspace @real-estate/web` passes. (Validated 2026-03-05.)
- [ ] Tenant content is fully scoped and validated.
- [ ] Public API abuse controls validated in staging.
- [ ] SEO launch gate explicitly approved (`SEO_ENABLE_INDEXING=true` in production only).
- [ ] `robots.txt` allows indexing only in approved production environment.
- [ ] `sitemap.xml` renders production URLs only when launch gate enabled.
- [ ] `/.well-known/llms.txt` and `/.well-known/llm.json` are reachable and return tenant-correct content.
- [ ] `/api/content/agent.md`, `/api/content/market.md`, and `/api/content/towns/{townSlug}` are reachable for AI extraction endpoints.
- [ ] Monitoring/alerts configured for API errors and page latency.
- [ ] Rollback owner and communication channel assigned.

## Latest Validation Evidence (2026-03-05)
- `npm run check --workspace @real-estate/web` — PASS (`lint`, `typecheck`, `test:smoke`, `test:perf`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/web"` — PASS (host Windows runtime).
- `npm run verify:seo-aeo --workspace @real-estate/web` — PASS (local endpoint probe script).
- `IDX_VERIFY_EXPECT_CONFIGURED=false npm run verify:idx-provider --workspace @real-estate/web` — PASS (local expected-not-configured behavior).
- Build route output includes AI discovery + content endpoints:
  - `/.well-known/llms.txt`, `/.well-known/llm.json`, `/llms.txt`
  - `/api/content/agent.md`, `/api/content/market.md`, `/api/content/towns/[townSlug]`
- Local runtime HTTP smoke (port `3105`) — PASS (`200`):
  - `/robots.txt`
  - `/sitemap.xml`
  - `/llms.txt`
  - `/.well-known/llms.txt`
  - `/.well-known/llm.json`
  - `/api/content/agent.md`
  - `/api/content/market.md`
  - `/api/content/towns/greenwich`
  - `/home-search`

## Rollback Triggers
- Widespread page or API failures.
- Tenant routing mis-resolution.
- Critical conversion flow breakage (lead/valuation/search modal).
- Unexpected SEO exposure before approval.

## Rollback Procedure
1. Revert deployment to last known healthy release.
2. Set `SEO_ENABLE_INDEXING=false` (if needed) and redeploy config.
3. If issue is tenant-specific, temporarily route that tenant to default maintenance experience.
4. Clear affected cache tags after rollback.
5. Run smoke checks on restored release.

## Recovery Validation
- Core pages load across primary tenant domain(s).
- Home search and property modal open/close normally.
- Lead + valuation API responses return success for valid payloads.
- Robots/sitemap behavior matches intended environment gate.

## Communication Template
- Incident start timestamp
- User-visible impact scope
- Rollback status
- ETA for forward fix
