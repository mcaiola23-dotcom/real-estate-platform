# TODO_BACKLOG

## Critical / Now
- [x] Create `real-estate-platform` parent repo.
- [x] Copy current Fairfield app to `apps/web`.
- [x] Move/initialize studio as `apps/studio`.
- [x] Add workspace tooling and root scripts.
- [x] Define shared domain and event types.
- [x] Stand up tenant/domain schema.
- [x] Complete tenant context threading through remaining website APIs and data providers.
- [x] Complete tenant context threading through remaining client-side/static data providers.
- [x] Replace seed-backed tenant persistence with durable data store + migrations.

## Next
- [x] Build tenant resolver middleware by host header.
- [ ] Implement website module registry + toggle system.
- [x] Install `@real-estate/db` workspace dependencies and run Prisma generate/migrate/seed locally.
- [ ] Create CRM app skeleton and auth integration.
- [ ] Build lead/contact/activity database model.
- [ ] Add event ingestion pipeline from website actions to CRM.

## AI Roadmap
- [ ] Create prompt registry and versioning.
- [ ] Implement AI content generation pipeline for website onboarding.
- [ ] Implement CRM next-best-action service.
- [ ] Add AI result feedback loop and quality scoring.

## Business / GTM
- [ ] Define plan matrix (Starter/Growth/Pro/Team).
- [ ] Define setup package scope and onboarding SLAs.
- [ ] Define managed services add-ons and operational model.

## Later
- [ ] Team and brokerage hierarchy model.
- [ ] Marketing attribution dashboard.
- [ ] Listing portal pilot and feasibility analysis.
