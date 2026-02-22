import { randomUUID } from 'node:crypto';
import { getPrismaClient } from './prisma-client';

export interface IntegrationTokenRecord {
  id: string;
  tenantId: string;
  actorId: string;
  provider: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  scopesJson: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function upsertIntegrationToken(
  tenantId: string,
  actorId: string,
  provider: string,
  data: {
    accessTokenEnc: string;
    refreshTokenEnc: string;
    scopesJson: string;
    expiresAt: Date | null;
  }
): Promise<IntegrationTokenRecord> {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error('Database unavailable');

  const now = new Date().toISOString();
  const id = randomUUID();

  const result = await prisma.integrationToken.upsert({
    where: {
      tenantId_actorId_provider: { tenantId, actorId, provider },
    },
    create: {
      id,
      tenantId,
      actorId,
      provider,
      accessTokenEnc: data.accessTokenEnc,
      refreshTokenEnc: data.refreshTokenEnc,
      scopesJson: data.scopesJson,
      expiresAt: data.expiresAt?.toISOString() ?? null,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      accessTokenEnc: data.accessTokenEnc,
      refreshTokenEnc: data.refreshTokenEnc,
      scopesJson: data.scopesJson,
      expiresAt: data.expiresAt?.toISOString() ?? null,
      updatedAt: now,
    },
  });

  return {
    id: result.id,
    tenantId: result.tenantId,
    actorId: result.actorId,
    provider: result.provider,
    accessTokenEnc: result.accessTokenEnc,
    refreshTokenEnc: result.refreshTokenEnc,
    scopesJson: result.scopesJson,
    expiresAt: result.expiresAt ? new Date(result.expiresAt).toISOString() : null,
    createdAt: new Date(result.createdAt).toISOString(),
    updatedAt: new Date(result.updatedAt).toISOString(),
  };
}

export async function getIntegrationToken(
  tenantId: string,
  actorId: string,
  provider: string
): Promise<IntegrationTokenRecord | null> {
  const prisma = await getPrismaClient();
  if (!prisma) return null;

  const result = await prisma.integrationToken.findUnique({
    where: {
      tenantId_actorId_provider: { tenantId, actorId, provider },
    },
  });

  if (!result) return null;

  return {
    id: result.id,
    tenantId: result.tenantId,
    actorId: result.actorId,
    provider: result.provider,
    accessTokenEnc: result.accessTokenEnc,
    refreshTokenEnc: result.refreshTokenEnc,
    scopesJson: result.scopesJson,
    expiresAt: result.expiresAt ? new Date(result.expiresAt).toISOString() : null,
    createdAt: new Date(result.createdAt).toISOString(),
    updatedAt: new Date(result.updatedAt).toISOString(),
  };
}

export async function deleteIntegrationToken(
  tenantId: string,
  actorId: string,
  provider: string
): Promise<boolean> {
  const prisma = await getPrismaClient();
  if (!prisma) return false;

  try {
    await prisma.integrationToken.delete({
      where: {
        tenantId_actorId_provider: { tenantId, actorId, provider },
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function listIntegrationTokensByTenant(
  tenantId: string
): Promise<IntegrationTokenRecord[]> {
  const prisma = await getPrismaClient();
  if (!prisma) return [];

  const results = await prisma.integrationToken.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
  });

  return results.map((r: any) => ({
    id: r.id,
    tenantId: r.tenantId,
    actorId: r.actorId,
    provider: r.provider,
    accessTokenEnc: r.accessTokenEnc,
    refreshTokenEnc: r.refreshTokenEnc,
    scopesJson: r.scopesJson,
    expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));
}
