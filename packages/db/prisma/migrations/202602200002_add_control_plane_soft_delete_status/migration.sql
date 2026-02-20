-- Add soft-delete lifecycle status columns for control-plane recovery workflows.
ALTER TABLE "TenantDomain" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "TenantControlSettings" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
