# CODING_GUIDELINES

## Core Standards
- Use TypeScript everywhere practical.
- Keep all business logic tenant-aware by design.
- Prefer pure functions and composable modules.
- Keep API contracts explicit and versioned.

## Monorepo Rules
- App-specific code lives in `apps/*`.
- Shared logic belongs in `packages/*`.
- Background jobs live in `services/*`.
- Do not import across apps directly.

## Data and Security
- Every query/mutation must include tenant context.
- Never expose privileged credentials client-side.
- Log sensitive operations with audit metadata.
- In `apps/portal`, client-side backend calls should use the internal gateway base (`/api/portal`) instead of direct backend URLs.
- Run local secret scanning before commit (`npm run security:secrets:scan`); repository pre-commit hooks are managed in `.githooks/`.

## AI Integration Rules
- AI prompts must be versioned.
- Persist provenance for generated content.
- Require human review for high-risk outputs.
- Add fallback behavior when AI services fail.

## Developer Workflow
- Small PRs, clear commit messages.
- Update `docs/brain` when architecture/product direction changes.
- Add/maintain tests for critical domain logic.

## Definition of Done
- Functionality works in local + staging.
- Tenant scope validated.
- Docs and decision log updated.

## Session Review (2026-03-02)
- Updated security workflow guidance to include repo-managed pre-commit secret scanning commands/hooks.
