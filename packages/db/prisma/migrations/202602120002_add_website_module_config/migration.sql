CREATE TABLE "WebsiteConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebsiteConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ModuleConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteConfigId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModuleConfig_websiteConfigId_fkey" FOREIGN KEY ("websiteConfigId") REFERENCES "WebsiteConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WebsiteConfig_tenantId_key" ON "WebsiteConfig"("tenantId");
CREATE UNIQUE INDEX "ModuleConfig_websiteConfigId_moduleKey_key" ON "ModuleConfig"("websiteConfigId", "moduleKey");
CREATE INDEX "ModuleConfig_tenantId_idx" ON "ModuleConfig"("tenantId");
