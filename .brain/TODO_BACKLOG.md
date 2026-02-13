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
- [x] Implement website module registry + toggle system.
- [x] Install `@real-estate/db` workspace dependencies and run Prisma generate/migrate/seed locally.
- [x] Create CRM app skeleton and auth integration.
- [x] Build lead/contact/activity database model.
- [x] Add event ingestion pipeline from website actions to CRM.
- [x] Mitigate local Prisma engine file-lock issue impacting `db:generate` reliability on Windows dev environment.
- [x] Build tenant-scoped CRM read/write API routes and dashboard UI modules for leads, contacts, and activity timeline.
- [x] Introduce ingestion service boundary (queue/worker contract) so website APIs enqueue events instead of direct CRM writes.
- [x] Add Prisma config migration (`prisma.config.ts`) and remove deprecated `package.json#prisma` in `@real-estate/db`.
- [x] Expand CRM API filtering/pagination contracts and add route-level validation tests.
- [x] Add ingestion worker retry scheduling + dead-letter handling for production reliability.
- [x] Add integration test flow for enqueue -> worker -> CRM persistence (tenant-scoped baseline).
- [ ] Stabilize Prisma full-engine local generation path on Windows so ingestion scripts can run end-to-end.
- [x] Add dead-letter queue observability + manual re-drive tooling for operations.

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

