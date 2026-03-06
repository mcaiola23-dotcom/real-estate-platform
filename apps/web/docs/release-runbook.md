# Release Runbook

Last updated: 2026-03-04

## Pre-Release
1. Sync latest mainline changes and resolve conflicts.
2. Run:
```bash
npm run check --workspace @real-estate/web
```
3. Confirm environment variables in target environment:
- Sanity read/write settings
- Clerk keys
- API guard settings (`WEB_API_ALLOWED_ORIGINS`, bot requirements)
- SEO launch settings (`SEO_ENABLE_INDEXING`, `SEO_METADATA_BASE_URL`)
- IDX bridge settings when using live listings (`NEXT_PUBLIC_LISTINGS_PROVIDER=idx`, `NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK=false`, `IDX_BRIDGE_URL`, `IDX_BRIDGE_TOKEN`)

## Deployment
1. Deploy web workspace build.
2. Confirm health route and critical pages return successfully.
3. Trigger cache revalidation only if content changes are included.

## Post-Deploy Validation
1. Tenant domain routing and branding check.
2. Home-search interaction check (map pan/zoom, modal open).
3. Public API write paths (`lead`, `valuation`, `website-events`) check.
4. Robots/sitemap behavior check according to environment gate.
5. AI discovery endpoint check (`/.well-known/llms.txt`, `/.well-known/llm.json`, `/api/content/agent.md`, `/api/content/market.md`).

## Incident Response
- If severe regression occurs, execute rollback plan in `launch-readiness-checklist.md`.
- Document incident and root cause in `project_tracking`.
