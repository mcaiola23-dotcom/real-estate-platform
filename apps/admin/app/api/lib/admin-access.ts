import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createControlPlaneAdminAuditEvent } from '@real-estate/db/admin-audit';
import type { ControlPlaneAdminAuditAction, ControlPlaneAdminAuditStatus } from '@real-estate/types/control-plane';

export type AdminMutationAction = ControlPlaneAdminAuditAction;
export type AdminMutationStatus = ControlPlaneAdminAuditStatus;

export interface AdminMutationActor {
  actorId: string | null;
  role: string;
}

export interface AdminMutationContext {
  action: AdminMutationAction;
  tenantId?: string;
  domainId?: string;
}

export interface AdminMutationAuditEvent extends AdminMutationContext {
  actor: AdminMutationActor;
  status: AdminMutationStatus;
  error?: string;
}

function normalizeRole(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : 'unknown';
}

function getLocalDevActorFallback(): AdminMutationActor | null {
  const fallbackRole = normalizeRole(process.env.ADMIN_LOCAL_DEV_ROLE);
  if (fallbackRole === 'unknown') {
    return null;
  }

  const fallbackActorId = process.env.ADMIN_LOCAL_DEV_ACTOR_ID?.trim();
  return {
    actorId: fallbackActorId && fallbackActorId.length > 0 ? fallbackActorId : 'local-dev-admin',
    role: fallbackRole,
  };
}

export async function getMutationActorFromRequest(request: Request): Promise<AdminMutationActor> {
  const headerRole = normalizeRole(request.headers.get('x-admin-role'));
  const headerActorId = request.headers.get('x-admin-actor-id');
  if (headerRole !== 'unknown') {
    return {
      actorId: headerActorId?.trim() || null,
      role: headerRole,
    };
  }

  try {
    const authResult = auth() as unknown as { userId?: string | null; sessionClaims?: any };
    const sessionClaims = authResult.sessionClaims ?? {};
    const claimRole =
      sessionClaims?.metadata?.role ?? sessionClaims?.publicMetadata?.role ?? sessionClaims?.privateMetadata?.role;

    const actorFromClaims = {
      actorId: authResult.userId ?? null,
      role: normalizeRole(claimRole),
    };
    if (actorFromClaims.role !== 'unknown') {
      return actorFromClaims;
    }

    const localDevFallback = getLocalDevActorFallback();
    if (localDevFallback) {
      return localDevFallback;
    }

    return actorFromClaims;
  } catch {
    const localDevFallback = getLocalDevActorFallback();
    if (localDevFallback) {
      return localDevFallback;
    }
    return {
      actorId: null,
      role: 'unknown',
    };
  }
}

export async function writeAdminAuditLog(event: AdminMutationAuditEvent): Promise<void> {
  const payload = {
    action: event.action,
    status: event.status,
    actorId: event.actor.actorId,
    actorRole: event.actor.role,
    tenantId: event.tenantId,
    domainId: event.domainId,
    error: event.error,
  } as const;

  const persisted = await createControlPlaneAdminAuditEvent(payload);

  const logEnvelope = {
    timestamp: new Date().toISOString(),
    area: 'admin-control-plane',
    persisted: Boolean(persisted),
    ...event,
  };
  console.info(`[admin-audit] ${JSON.stringify(logEnvelope)}`);
}

export async function safeWriteAdminAuditLog(
  event: AdminMutationAuditEvent,
  writeAuditLog: typeof writeAdminAuditLog
): Promise<void> {
  try {
    await writeAuditLog(event);
  } catch (error) {
    console.warn(
      `[admin-audit] write failed: ${
        error instanceof Error ? error.message : 'Unknown audit write failure.'
      } action=${event.action} status=${event.status}`
    );
  }
}

export function canPerformMutation(role: string): boolean {
  return role === 'admin';
}

export async function enforceAdminMutationAccess(
  request: Request,
  context: AdminMutationContext,
  dependencies: {
    getMutationActorFromRequest: typeof getMutationActorFromRequest;
    writeAdminAuditLog: typeof writeAdminAuditLog;
  }
): Promise<{ ok: true; actor: AdminMutationActor } | { ok: false; response: NextResponse }> {
  const actor = await dependencies.getMutationActorFromRequest(request);
  if (!canPerformMutation(actor.role)) {
    await safeWriteAdminAuditLog(
      {
        ...context,
        actor,
        status: 'denied',
        error: `Mutation requires admin role. Received role: ${actor.role}.`,
      },
      dependencies.writeAdminAuditLog
    );
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Admin role is required for this mutation.' }, { status: 403 }),
    };
  }

  await safeWriteAdminAuditLog(
    {
      ...context,
      actor,
      status: 'allowed',
    },
    dependencies.writeAdminAuditLog
  );

  return { ok: true, actor };
}
