# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Run `platform-session-bootstrap`, then execute a manual Admin browser click-through (desktop + smaller laptop viewport) for onboarding + domain operations in a non-sandboxed environment.

## Why This Is Next
- Admin mutation transparency, domain automation controls, and plan-governance UX are now implemented, but final operator interaction validation is still pending.
- This manual pass is required because this sandbox could not host the local admin runtime (`listen EPERM 0.0.0.0:3002`), so browser-flow evidence is still missing.

## Current Snapshot
- Completed in this session:
  - Implemented admin mutation error transparency in `apps/admin/app/components/control-plane-workspace.tsx` using shared guidance parser `apps/admin/app/lib/mutation-error-guidance.ts` (field-level hints + next-step guidance for RBAC/duplicate/validation failures).
  - Implemented domain operations automation controls in `apps/admin/app/components/control-plane-workspace.tsx` (poll now, auto-poll interval, retry verification controls, and DNS/SSL readiness indicators).
  - Implemented plan/feature governance UX in `apps/admin/app/components/control-plane-workspace.tsx` with shared helper `apps/admin/app/lib/plan-governance.ts` (plan templates, required/allowed guardrails, enforce action, and explicit override toggles).
  - Updated `.brain/CURRENT_FOCUS.md`, `.brain/TODO_BACKLOG.md`, and `.brain/DECISIONS_LOG.md` to reflect completion and next follow-ups.
- In progress / pending:
  - Manual admin browser click-through validation (blocked in this sandbox, still required).
  - Backend-driven domain verification/certificate status probes so polling/retry controls use authoritative provider status.

## Validation (Most Recent)
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`13/13`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- Manual browser validation was not executable in this sandbox:
  - `npm run dev:admin` fails local bind with `listen EPERM 0.0.0.0:3002`.

## First Actions Next Session
1. Run `platform-session-bootstrap` and confirm alignment with `.brain/CURRENT_FOCUS.md` immediate next steps.
2. Launch admin locally in a non-sandboxed environment (`npm run dev:admin`) and run a focused operator click-through:
   - guided onboarding wizard,
   - domain ops polling/retry/readiness controls,
   - settings plan-governance interactions (`Apply Plan Template`, `Enforce Guardrails`, override toggles).
3. Record any interaction/layout defects by viewport and fix highest-impact issues first.
4. If manual pass is clean, start backend integration for authoritative domain/certificate status probes.

## Constraints To Keep
- Preserve tenant isolation for all request/event paths and UI data interactions.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, app UI in `apps/admin`.
- Do not edit unrelated files.
- Do not edit `.brain/CRM_Update.md` in this stream (separate agent ownership).
- Treat Windows-authoritative command results as canonical when WSL sandbox limitations are present.
