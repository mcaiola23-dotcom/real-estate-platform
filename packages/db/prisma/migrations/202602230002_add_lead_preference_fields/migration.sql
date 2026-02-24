-- Add preference fields to Lead
ALTER TABLE "Lead" ADD COLUMN "acreage" REAL;
ALTER TABLE "Lead" ADD COLUMN "town" TEXT;
ALTER TABLE "Lead" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "Lead" ADD COLUMN "preferenceNotes" TEXT;
