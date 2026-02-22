-- Add durable onboarding plan/task persistence for Admin control plane
CREATE TABLE "TenantOnboardingPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "planCode" TEXT NOT NULL,
  "startedAt" DATETIME,
  "targetLaunchDate" DATETIME,
  "completedAt" DATETIME,
  "pausedAt" DATETIME,
  "pauseReason" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TenantOnboardingPlan_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TenantOnboardingTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantOnboardingPlanId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "taskKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "required" BOOLEAN NOT NULL DEFAULT true,
  "ownerRole" TEXT NOT NULL DEFAULT 'ops',
  "ownerActorId" TEXT,
  "dueAt" DATETIME,
  "blockedByClient" BOOLEAN NOT NULL DEFAULT false,
  "blockerReason" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TenantOnboardingTask_tenantOnboardingPlanId_fkey"
    FOREIGN KEY ("tenantOnboardingPlanId") REFERENCES "TenantOnboardingPlan" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TenantOnboardingTask_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TenantOnboardingPlan_tenantId_status_idx"
  ON "TenantOnboardingPlan" ("tenantId", "status");
CREATE INDEX "TenantOnboardingPlan_tenantId_createdAt_idx"
  ON "TenantOnboardingPlan" ("tenantId", "createdAt");

CREATE INDEX "TenantOnboardingTask_tenantId_status_idx"
  ON "TenantOnboardingTask" ("tenantId", "status");
CREATE INDEX "TenantOnboardingTask_tenantId_dueAt_idx"
  ON "TenantOnboardingTask" ("tenantId", "dueAt");
CREATE INDEX "TenantOnboardingTask_tenantOnboardingPlanId_sortOrder_idx"
  ON "TenantOnboardingTask" ("tenantOnboardingPlanId", "sortOrder");
CREATE UNIQUE INDEX "TenantOnboardingTask_tenantOnboardingPlanId_taskKey_key"
  ON "TenantOnboardingTask" ("tenantOnboardingPlanId", "taskKey");
