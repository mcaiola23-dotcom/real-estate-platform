-- Add tenant billing/subscription lifecycle table for control-plane operations.
CREATE TABLE "TenantBillingSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "planCode" TEXT NOT NULL DEFAULT 'starter',
  "status" TEXT NOT NULL DEFAULT 'trialing',
  "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
  "billingProvider" TEXT NOT NULL DEFAULT 'manual',
  "billingCustomerId" TEXT,
  "billingSubscriptionId" TEXT,
  "trialEndsAt" DATETIME,
  "currentPeriodEndsAt" DATETIME,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TenantBillingSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantBillingSubscription_tenantId_key" ON "TenantBillingSubscription"("tenantId");
