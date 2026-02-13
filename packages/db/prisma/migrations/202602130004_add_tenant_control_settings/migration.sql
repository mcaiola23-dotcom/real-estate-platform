CREATE TABLE "TenantControlSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "planCode" TEXT NOT NULL DEFAULT 'starter',
  "featureFlagsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TenantControlSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantControlSettings_tenantId_key" ON "TenantControlSettings"("tenantId");
