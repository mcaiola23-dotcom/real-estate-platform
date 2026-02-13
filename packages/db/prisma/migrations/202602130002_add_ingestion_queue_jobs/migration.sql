CREATE TABLE "IngestionQueueJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  "processedAt" DATETIME,
  CONSTRAINT "IngestionQueueJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "IngestionQueueJob_tenantId_eventKey_key" ON "IngestionQueueJob"("tenantId", "eventKey");
CREATE INDEX "IngestionQueueJob_tenantId_status_createdAt_idx" ON "IngestionQueueJob"("tenantId", "status", "createdAt");
CREATE INDEX "IngestionQueueJob_status_createdAt_idx" ON "IngestionQueueJob"("status", "createdAt");
