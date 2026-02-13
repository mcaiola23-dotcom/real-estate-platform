CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "emailNormalized" TEXT,
    "phone" TEXT,
    "phoneNormalized" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "status" TEXT NOT NULL,
    "leadType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "timeframe" TEXT,
    "notes" TEXT,
    "listingId" TEXT,
    "listingUrl" TEXT,
    "listingAddress" TEXT,
    "propertyType" TEXT,
    "beds" INTEGER,
    "baths" INTEGER,
    "sqft" INTEGER,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "activityType" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "IngestedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "IngestedEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Contact_tenantId_emailNormalized_key" ON "Contact"("tenantId", "emailNormalized");
CREATE UNIQUE INDEX "Contact_tenantId_phoneNormalized_key" ON "Contact"("tenantId", "phoneNormalized");
CREATE INDEX "Contact_tenantId_createdAt_idx" ON "Contact"("tenantId", "createdAt");

CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");
CREATE INDEX "Lead_contactId_idx" ON "Lead"("contactId");

CREATE INDEX "Activity_tenantId_occurredAt_idx" ON "Activity"("tenantId", "occurredAt");
CREATE INDEX "Activity_contactId_idx" ON "Activity"("contactId");
CREATE INDEX "Activity_leadId_idx" ON "Activity"("leadId");

CREATE UNIQUE INDEX "IngestedEvent_tenantId_eventKey_key" ON "IngestedEvent"("tenantId", "eventKey");
CREATE INDEX "IngestedEvent_tenantId_processedAt_idx" ON "IngestedEvent"("tenantId", "processedAt");
