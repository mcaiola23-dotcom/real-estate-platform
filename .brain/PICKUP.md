# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- Run `platform-session-bootstrap`, then implement Admin onboarding/domain mutation error transparency in `apps/admin/app/components/control-plane-workspace.tsx` with clear, actionable operator guidance.

## Why This Is Next
- Admin onboarding UX is now polished and wizard-first, but mutation failures still need clearer operator-facing guidance to prevent workflow stalls.
- This is the highest-impact usability follow-up before deeper hardening because it directly affects provisioning/domain launch velocity.

## Current Snapshot
- Completed in this session:
  - Reworked Admin workspace into a guided onboarding + domain operations experience in `apps/admin/app/components/control-plane-workspace.tsx`.
  - Applied production-grade visual polish and responsive hierarchy in `apps/admin/app/globals.css`.
  - Updated admin typography/auth framing in `apps/admin/app/layout.tsx`, `apps/admin/app/sign-in/[[...sign-in]]/page.tsx`, and `apps/admin/app/sign-up/[[...sign-up]]/page.tsx`.
  - Updated `.brain` to make admin usability roadmap slices explicit and sequenced.
- In progress / pending:
  - Admin mutation error transparency (inline field-level errors + next-step hints for RBAC/duplicate/validation failures).
  - Domain operations automation follow-up (verification polling/retry + SSL readiness indicators).
  - Plan/feature governance UX follow-up (plan templates, defaults, guardrails).

## Validation (Most Recent)
- `./node_modules/.bin/tsc --noEmit --project apps/admin/tsconfig.json` passes.
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run test:routes --workspace @real-estate/admin"` passes (`13/13`).
- `cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && npm run build --workspace @real-estate/admin"` passes.
- Workspace-level lint still reports a pre-existing unrelated issue in `apps/admin/app/api/lib/admin-access.ts` (`@typescript-eslint/no-explicit-any` at line 54).
- Targeted lint for touched admin UX files passes (`control-plane-workspace.tsx`, `layout.tsx`, sign-in/sign-up pages).

## First Actions Next Session
1. Run `platform-session-bootstrap` and confirm objective alignment with `.brain/CURRENT_FOCUS.md`.
2. Implement error-state mapping in `apps/admin/app/components/control-plane-workspace.tsx`:
   - parse API error responses for onboarding/domain/settings mutations,
   - render field-level hints for slug/domain/validation collisions,
   - render clear RBAC-denied and retry guidance with next actions.
3. Ensure error state is visually clear and consistent with current admin design system in `apps/admin/app/globals.css`.
4. Re-run admin checks (`tsc`, route tests, and targeted lint) and log outcomes in `.brain/CURRENT_FOCUS.md`.

## Constraints To Keep
- Preserve tenant isolation for all request/event paths and UI data interactions.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, app UI in `apps/admin`.
- Do not edit unrelated files.
- Do not edit `.brain/CRM_Update.md` in this stream (separate agent ownership).
- Treat Windows-authoritative command results as canonical when WSL sandbox limitations are present.
