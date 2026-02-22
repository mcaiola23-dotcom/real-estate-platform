-- Add tags column (JSON text array) to Lead table
ALTER TABLE "Lead" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]';
