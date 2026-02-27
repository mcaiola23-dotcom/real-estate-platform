# PICKUP

## Purpose
Use this file to start the next session quickly. Update it at the end of every work session.

## Next Session Starting Task
- **Communications Hub Phase 2 (Google OAuth Activation)** — The Google OAuth backend is fully built (OAuth flow, encrypted token storage, Gmail send/threads/calendar APIs, all API routes exist). It just needs environment variables configured and minor UI wiring.

## Why This Is Next
- Phases 1, 4, and 5 of the Communications Hub are complete (UI redesign, custom templates CRUD, AI draft enhancement).
- Phase 2 is the highest-impact remaining item because it activates real Gmail sending from the CRM instead of mailto: fallback.
- Phase 3 (Twilio) has zero code and more setup overhead — do Phase 2 first.

## Current Snapshot (2026-02-27, Session 20 end)
- **Last commit**: Pending — run `/git-update` to commit Communications Hub implementation
- **Branch**: `main`
- **CRM status**: All route tests pass (89/89), 0 type errors, build verified
- **Prisma**: Migration `202602270001_add_message_template` created (needs `db:migrate:deploy` for production)

## Key Changes This Session (uncommitted)
1. **Phase 1 — CommunicationsHub UI Redesign**: New `CommunicationsHub.tsx` component, LeadProfileModal simplified (5 state vars removed), GmailComposer `initialBody` prop, ~220 lines hub CSS
2. **Phase 4 — Custom Templates CRUD**: Prisma `MessageTemplate` model + migration, 6 DB CRUD functions in `crm.ts`, 2 new API route files (`/api/templates`, `/api/templates/[templateId]`), `TemplateLibrary.tsx` rewrite with full CRUD UI, merge field picker
3. **Phase 5 — AI Draft Enhancement**: `draftMultipleMessages()` and `draftFromTemplate()` in message-drafting.ts, enhanced crm-prompts.ts with communication history/template/SMS context, draft-message route with multiDraft + templateBody support, `AiDraftComposer.tsx` rewrite with multi-draft tabs

## What Remains for Communications Hub
### Phase 2: Google OAuth Activation (needs env vars from user)
- **External setup**: User must create Google Cloud project and set:
  ```
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_REDIRECT_URI=http://localhost:3001/api/integrations/google/callback
  INTEGRATION_ENCRYPTION_KEY=  # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Code changes needed** (minimal):
  - `CommunicationsHub.tsx` — Add "Connect Google" prompt when not connected
  - `AiDraftComposer.tsx` — Route email sends through GmailComposer instead of mailto: when Google connected
  - `GmailComposer.tsx` — May need `initialSubject` prop (already has `initialBody`)
  - `TemplateLibrary.tsx` — Route email templates through GmailComposer when connected

### Phase 3: Twilio Integration (needs Twilio account)
- **External setup**: Twilio account + phone number + ngrok for webhooks
- **Code to build**:
  - `packages/integrations/src/twilio/` — config.ts, sms.ts, voice.ts, webhooks.ts
  - API routes: `/api/integrations/twilio/status`, `/api/integrations/twilio/sms/send`, `/api/integrations/twilio/sms/webhook`, `/api/integrations/twilio/voice/initiate`
  - `SmsComposer.tsx`, `CallLogger.tsx` components
  - Activity types: `sms_sent`, `sms_received`, `call_initiated`

## First Actions Next Session
1. Run `/session-bootstrap`.
2. Ask user if they've set up Google Cloud credentials for Phase 2.
3. If yes → implement Phase 2 code changes (small scope).
4. If no → pick next backlog item (duplicate merge flow, escalation UX, or website AI pipeline).
5. Consider applying Prisma migration for `MessageTemplate` to production DB.

## Validation Context (Most Recent)
- `npm run build --workspace @real-estate/crm` — PASS
- `npm run test:routes --workspace @real-estate/crm` — PASS (89/89 tests)

## Constraints To Keep
- Preserve tenant isolation for all CRM and Admin reads/writes.
- Keep shared package boundaries strict: contracts in `packages/types`, persistence/helpers in `packages/db`, UI in `apps/*`.
- No cross-app imports.
- New Prisma models/migrations need `db:migrate:deploy` + `db:generate` when moving to production DB.
- `classifyLeadType()` in `crm-formatters.ts` must stay in sync with `hasUnsavedLeadChange()` and `updateLead()` dirty checks.
