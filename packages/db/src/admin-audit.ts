import { randomUUID } from 'node:crypto';

import type {
  ControlPlaneAdminAuditEvent,
  CreateControlPlaneAdminAuditEventInput,
} from '@real-estate/types/control-plane';

import { getPrismaClient } from './prisma-client';

function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function toAuditEvent(record: {
  id: string;
  action: string;
  status: string;
  actorId: string | null;
  actorRole: string;
  tenantId: string | null;
  domainId: string | null;
  error: string | null;
  metadataJson: string | null;
  createdAt: string | Date;
}): ControlPlaneAdminAuditEvent {
  return {
    id: record.id,
    action: record.action as ControlPlaneAdminAuditEvent['action'],
    status: record.status as ControlPlaneAdminAuditEvent['status'],
    actorId: record.actorId,
    actorRole: record.actorRole,
    tenantId: record.tenantId,
    domainId: record.domainId,
    error: record.error,
    metadata: parseMetadata(record.metadataJson),
    createdAt: toIsoString(record.createdAt),
  };
}

export async function createControlPlaneAdminAuditEvent(
  input: CreateControlPlaneAdminAuditEventInput
): Promise<ControlPlaneAdminAuditEvent | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  const created = await prisma.adminAuditEvent.create({
    data: {
      id: `admin_audit_${randomUUID().replace(/-/g, '')}`,
      action: input.action,
      status: input.status,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole,
      tenantId: input.tenantId ?? null,
      domainId: input.domainId ?? null,
      error: input.error ?? null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
    },
  });

  return toAuditEvent(created);
}

export async function listControlPlaneAdminAuditEventsByTenant(
  tenantId: string,
  limit = 100
): Promise<ControlPlaneAdminAuditEvent[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.trunc(limit), 500)) : 100;

  const rows = await prisma.adminAuditEvent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });

  return rows.map(toAuditEvent);
}
