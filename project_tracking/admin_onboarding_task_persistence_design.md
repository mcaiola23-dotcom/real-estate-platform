# Admin Onboarding Task Persistence - Design Proposal

## Purpose
Design a durable onboarding-task model for the Admin control plane so plan-tier checklist templates can evolve from reference-only defaults into tenant-specific tracked workflow state.

## Why This Is Needed
Current behavior (as of 2026-02-22):
- Plan-tier onboarding checklist templates are shown in Admin as operator defaults/reference.
- They are not persisted per tenant.
- Operators cannot track completion state, ownership changes, blockers, due dates, or SLA pause history in a durable way.

This is useful now, but not sufficient for scaling onboarding operations.

## Scope (MVP Persistence)
Persist tenant onboarding tasks in the control plane with:
- tenant-scoped checklist instances
- task completion status
- owner role / owner actor assignment (optional)
- due dates
- blocking reason / client dependency flags
- audit trail hooks through existing Admin audit patterns

## Non-Goals (Initial Version)
- Full project-management system
- Cross-tenant board/Kanban UI
- Dependencies graph engine
- Time tracking / staffing capacity model

## Proposed Data Model (Prisma / Shared DB)

### `TenantOnboardingPlan`
Represents one onboarding run for a tenant (initial launch, relaunch, or major re-onboarding).

Fields (proposed):
- `id`
- `tenantId`
- `status` (`draft`, `active`, `paused`, `completed`, `archived`)
- `planCode` (snapshot of commercial plan tier at onboarding start)
- `startedAt`
- `targetLaunchDate`
- `completedAt`
- `pausedAt`
- `pauseReason` (nullable)
- `createdAt`
- `updatedAt`

Notes:
- A tenant may eventually have multiple onboarding plans over time.
- One active plan max per tenant (`tenantId + status=active` enforced in app logic).

### `TenantOnboardingTask`
Represents a durable task item instance under an onboarding plan.

Fields (proposed):
- `id`
- `tenantOnboardingPlanId`
- `tenantId` (denormalized for easier tenant-scoped querying)
- `taskKey` (template-derived stable key, e.g. `growth-domain`)
- `title`
- `description` (nullable)
- `status` (`pending`, `in_progress`, `blocked`, `done`, `skipped`)
- `priority` (`critical`, `high`, `normal`, `low`)
- `required` (boolean)
- `ownerRole` (`sales`, `ops`, `build`, `client`)
- `ownerActorId` (nullable)
- `dueAt` (nullable)
- `blockedByClient` (boolean)
- `blockerReason` (nullable)
- `sortOrder`
- `completedAt` (nullable)
- `createdAt`
- `updatedAt`

Indexes:
- `(tenantId, status)`
- `(tenantOnboardingPlanId, sortOrder)`
- `(tenantId, dueAt)`

### `TenantOnboardingTaskEvent` (optional in MVP; recommended next)
Append-only task history events to avoid overloading `AdminAuditEvent` for workflow detail.

Fields (proposed):
- `id`
- `tenantOnboardingTaskId`
- `tenantId`
- `eventType` (`created`, `status_changed`, `owner_changed`, `blocked`, `unblocked`, `due_changed`, `comment`)
- `actorId` (nullable)
- `actorRole`
- `metadata` (JSON)
- `createdAt`

If MVP needs to ship faster:
- Skip this table initially and rely on `AdminAuditEvent` for task mutations.

## Shared Contracts (packages/types)
Add control-plane types for onboarding persistence:
- `TenantOnboardingPlan`
- `TenantOnboardingTask`
- `TenantOnboardingTaskStatus`
- `TenantOnboardingTaskPriority`
- `TenantOnboardingOwnerRole`
- API response/request types for create/list/update operations

Keep tenant isolation explicit in all helper inputs/outputs.

## DB Helper Layer (packages/db)
Add shared helper surface (similar to existing control-plane helpers):
- `createTenantOnboardingPlanFromTemplate(...)`
- `listTenantOnboardingPlansByTenantId(...)`
- `getActiveTenantOnboardingPlanByTenantId(...)`
- `listTenantOnboardingTasksByPlanId(...)`
- `updateTenantOnboardingTask(...)`
- `bulkSeedTenantOnboardingTasksFromTemplate(...)`

All helpers must require tenant context or tenant ID as input.

## Template Seeding Strategy (Bridging Current Work)
Reuse the existing GTM plan-tier checklist templates in:
- `apps/admin/app/lib/commercial-baselines.ts`

Recommended migration path:
1. Keep template source in Admin for now (fastest path).
2. Add a shared transformation layer when persistence is implemented.
3. Eventually move canonical task templates to shared package / db seed if multiple apps need them.

## Admin API Surface (Proposed)
New routes under `apps/admin/app/api/tenants/[tenantId]/onboarding`:

- `GET /onboarding`
  - returns active plan + tasks (or empty state)
- `POST /onboarding`
  - creates onboarding plan and seeds tasks from selected plan tier template
- `PATCH /onboarding/[planId]`
  - updates plan status (pause/resume/complete)
- `PATCH /onboarding/tasks/[taskId]`
  - updates task status/owner/due/blocker

Requirements:
- admin-only mutation access (reuse existing `admin-access.ts` patterns)
- audit mutation events for all task/plan changes
- factory exports for route-level tests (consistent with existing Admin route pattern)

## Admin UI Integration Plan

### Phase A (Low Risk)
- Add read-only persisted onboarding task panel in Launch tab.
- If no active plan exists, show "Create Plan From Template" action.
- Keep current reference checklist template visible as fallback/compare view.

### Phase B (Operator Workflow)
- Allow task status changes (`pending` -> `in_progress` -> `done` / `blocked`)
- Allow owner assignment and due dates
- Show blockers in Action Center (high-value integration point)

### Phase C (Operational Reporting)
- Feed onboarding task status into:
  - Action Center prioritization
  - tenant readiness scoring
  - observability onboarding throughput metrics

## Action Center Integration (Future)
Once durable tasks exist, Action Center should prioritize:
- overdue required tasks
- blocked tasks with `blockedByClient = true`
- tasks due within 24-48h
- missing owner assignment on required tasks

This should eventually replace most inferred checklist guidance for launch readiness.

## Audit / Compliance Considerations
- Task mutations should emit `AdminAuditEvent` actions (new action names may be needed):
  - `tenant.onboarding.plan.create`
  - `tenant.onboarding.plan.update`
  - `tenant.onboarding.task.update`
- Capture actor/request metadata consistent with existing audit patterns.

## Migration / Rollout Strategy
1. Add shared types + Prisma models + db helpers.
2. Add Admin API routes and route tests.
3. Add read-only UI load path in Launch tab.
4. Add task mutation UI (status/owner/blocker) behind controlled rollout.
5. Integrate task signals into Action Center and readiness scoring.

## Open Design Questions
1. Should `ownerRole` remain the primary field, with `ownerActorId` optional, or should assignments always target a specific actor?
2. Do we need a separate `client_dependency` status vs `blocked + blockedByClient=true`?
3. Should onboarding plans be auto-created during tenant provisioning, or created explicitly by operators after kickoff confirmation?
4. Should task templates live in code (`commercial-baselines.ts`) or be migrated to DB-backed templates once stable?

## Recommended Next Implementation Slice
If/when we start this:
1. Add shared types + Prisma models (`TenantOnboardingPlan`, `TenantOnboardingTask`)
2. Seed task instances from existing plan-tier checklist templates
3. Add Admin read-only task list + "Create Plan From Template"
4. Add one mutation path (`status` updates) + audit coverage
