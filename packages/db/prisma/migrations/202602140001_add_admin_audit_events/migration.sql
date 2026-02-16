-- CreateTable
CREATE TABLE "AdminAuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "domainId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL,
    "error" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AdminAuditEvent_tenantId_createdAt_idx" ON "AdminAuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_action_createdAt_idx" ON "AdminAuditEvent"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_status_createdAt_idx" ON "AdminAuditEvent"("status", "createdAt");
