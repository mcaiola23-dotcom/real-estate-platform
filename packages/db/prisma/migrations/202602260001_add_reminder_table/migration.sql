-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "note" TEXT,
    "channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "snoozedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reminder_tenantId_scheduledFor_idx" ON "Reminder"("tenantId", "scheduledFor");

-- CreateIndex
CREATE INDEX "Reminder_leadId_status_idx" ON "Reminder"("leadId", "status");
