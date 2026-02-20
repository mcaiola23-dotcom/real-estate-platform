-- CreateTable
CREATE TABLE "TenantControlActor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '[]',
    "supportSessionActive" BOOLEAN NOT NULL DEFAULT false,
    "supportSessionStartedAt" DATETIME,
    "supportSessionExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TenantControlActor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantControlActor_tenantId_actorId_key" ON "TenantControlActor"("tenantId", "actorId");

-- CreateIndex
CREATE INDEX "TenantControlActor_tenantId_role_idx" ON "TenantControlActor"("tenantId", "role");
