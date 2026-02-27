# TROUBLESHOOTING

Known recurring issues and their fixes. Check here first when something breaks.

---

## 1. Agent Website 404 Errors (All Pages Except Homepage)

**Symptom:** Navigating to any route besides `/` on the agent website (`apps/web`) returns a 404. The terminal shows 404 errors for valid routes like `/about`, `/contact`, `/towns`, etc.

**Root Cause:** The Next.js `.next` dev cache becomes stale/corrupted. The route type cache (`apps/web/.next/dev/types/routes.d.ts`) stops recognizing routes beyond `"/"`, causing the dev server to treat all other pages as non-existent.

**Fix:**
```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Delete the stale cache
rm -rf apps/web/.next

# 3. Restart the dev server — it will rebuild the cache from scratch
npm run dev:web
```

**Frequency:** Recurring. Has happened multiple times across sessions.

**Notes:**
- This is a known Next.js dev server issue, not a code bug
- All 21+ page routes in `apps/web/app/` are correctly defined — the problem is purely cache corruption
- The `.next` directory is gitignored, so deleting it has zero risk
- After clearing, the first page load will be slower as Next.js recompiles everything

---

## 2. CRM Mock Data Not Showing (Empty Dashboard)

**Symptom:** The CRM loads but no leads, contacts, or activities appear. The dashboard looks empty despite mock data having been seeded previously.

**Root Cause:** Two possible causes (can occur together):
1. **Stale `.next` dev cache** — same corruption pattern as the web app 404 issue
2. **Prisma client generated in no-engine mode** — the safe generate wrapper (`db:generate`) falls back to `engine=none` when it hits Windows EPERM file locks. This produces a client that requires `prisma://` URLs and silently fails to connect to local SQLite, so all API data fetches return errors.

**Fix:**
```bash
# 1. Stop the CRM dev server (Ctrl+C)

# 2. Delete the stale cache
rm -rf apps/crm/.next
# Or on Windows if WSL can't delete due to file locks:
# cmd.exe /c "rmdir /s /q C:\Users\19143\Projects\real-estate-platform\apps\crm\.next"

# 3. Regenerate Prisma client with FULL engine (use db:generate:direct, not db:generate)
cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:generate:direct --workspace @real-estate/db"

# 4. Apply any pending migrations
cmd.exe /c "cd /d C:\Users\19143\Projects\real-estate-platform && set DATABASE_URL=file:C:/Users/19143/Projects/real-estate-platform/packages/db/prisma/dev.db && npm run db:migrate:deploy --workspace @real-estate/db"

# 5. Restart the dev server
npm run dev:crm
```

**How to verify the database has data:**
```bash
# Write a temp _check_db.js script using the generated Prisma client and run via cmd.exe
# p.lead.count(), p.contact.count(), p.activity.count() should return non-zero
```

**Frequency:** Recurring (observed 2026-02-27, also occurred in a prior session).

**Notes:**
- The database itself is fine — data is intact, only the Prisma runtime client is broken
- Always use `db:generate:direct` (not `db:generate`) to ensure full-engine generation
- If `db:generate:direct` also fails with EPERM, the healthy-client-reuse gate in `db-generate-direct.mjs` should handle it
- The `.next` directory is gitignored, so deleting it has zero risk
