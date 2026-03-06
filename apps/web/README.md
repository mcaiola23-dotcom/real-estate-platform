# Agent Website (`apps/web`)

Multi-tenant Next.js website for agent-branded experiences with tenant-scoped content, guarded public APIs, and home-search UX.

## Local Development
```bash
npm run dev --workspace @real-estate/web
```

## Quality Gates
```bash
npm run check --workspace @real-estate/web
```

`check` runs:
- `lint`
- `typecheck`
- `test:smoke`
- `test:perf`

## Tenant Operations
Scaffold a new tenant config + onboarding artifacts:
```bash
npm run tenant:onboard:scaffold --workspace @real-estate/web -- --help
```

Backfill tenant metadata for existing content docs:
```bash
npm run sanity:tenant-backfill --workspace @real-estate/web -- --help
```

## Runbooks
- Architecture: [`docs/architecture.md`](./docs/architecture.md)
- Tenant onboarding: [`docs/onboarding-runbook.md`](./docs/onboarding-runbook.md)
- Release: [`docs/release-runbook.md`](./docs/release-runbook.md)
- Launch readiness + rollback: [`docs/launch-readiness-checklist.md`](./docs/launch-readiness-checklist.md)
- IDX cutover: [`docs/idx-cutover-runbook.md`](./docs/idx-cutover-runbook.md)
- SEO + AEO: [`docs/seo-aeo-runbook.md`](./docs/seo-aeo-runbook.md)
