-- CreateTable
CREATE TABLE "IntegrationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "scopesJson" TEXT NOT NULL DEFAULT '[]',
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegrationToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationToken_tenantId_actorId_provider_key" ON "IntegrationToken"("tenantId", "actorId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationToken_tenantId_provider_idx" ON "IntegrationToken"("tenantId", "provider");
