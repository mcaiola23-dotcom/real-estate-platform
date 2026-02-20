-- Add billing provider sync event table for idempotent webhook reconciliation.
CREATE TABLE "TenantBillingSyncEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "resultStatus" TEXT NOT NULL,
  "resultMessage" TEXT,
  "createdAt" DATETIME NOT NULL,
  "processedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "TenantBillingSyncEvent_provider_eventId_key" ON "TenantBillingSyncEvent"("provider", "eventId");
CREATE INDEX "TenantBillingSyncEvent_tenantId_createdAt_idx" ON "TenantBillingSyncEvent"("tenantId", "createdAt");
