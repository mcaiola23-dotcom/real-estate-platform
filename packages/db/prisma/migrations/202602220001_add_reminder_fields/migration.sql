-- Add reminder-specific fields to Lead model for Phase 9A (AI-Powered Reminders)
ALTER TABLE "Lead" ADD COLUMN "nextActionChannel" TEXT;
ALTER TABLE "Lead" ADD COLUMN "reminderSnoozedUntil" DATETIME;
