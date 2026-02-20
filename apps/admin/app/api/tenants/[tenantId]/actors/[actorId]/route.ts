import { NextResponse } from 'next/server';

import { removeTenantControlActor, updateTenantControlActor } from '@real-estate/db/control-plane';
import type { ControlPlaneActorPermission, ControlPlaneActorRole } from '@real-estate/types/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../../lib/admin-access';

interface ActorRouteDependencies {
  updateTenantControlActor: typeof updateTenantControlActor;
  removeTenantControlActor: typeof removeTenantControlActor;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: ActorRouteDependencies = {
  updateTenantControlActor,
  removeTenantControlActor,
};

function parseRole(value: unknown): ControlPlaneActorRole | undefined {
  if (value === 'admin' || value === 'operator' || value === 'support' || value === 'viewer') {
    return value;
  }
  return undefined;
}

function parsePermissions(value: unknown): ControlPlaneActorPermission[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((entry): entry is ControlPlaneActorPermission => {
    return (
      entry === 'tenant.onboarding.manage' ||
      entry === 'tenant.domain.manage' ||
      entry === 'tenant.settings.manage' ||
      entry === 'tenant.audit.read' ||
      entry === 'tenant.observability.read' ||
      entry === 'tenant.support-session.start'
    );
  });
}

export function createActorPatchHandler(dependencies: ActorRouteDependencies = defaultDependencies) {
  return async function PATCH(request: Request, context: { params: Promise<{ tenantId: string; actorId: string }> }) {
    const { tenantId, actorId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.actor.update', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body:
      | {
          displayName?: unknown;
          email?: unknown;
          role?: unknown;
          permissions?: unknown;
        }
      | null = null;

    try {
      body = (await request.json()) as {
        displayName?: unknown;
        email?: unknown;
        role?: unknown;
        permissions?: unknown;
      };

      const actor = await dependencies.updateTenantControlActor(tenantId, actorId, {
        displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
        role: parseRole(body.role),
        permissions: parsePermissions(body.permissions),
      });
      if (!actor) {
        return NextResponse.json({ ok: false, error: 'Actor not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.actor.update',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              role: { after: actor.role },
              permissions: { after: actor.permissions },
              email: { after: actor.email ?? null },
              displayName: { after: actor.displayName ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, actor });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.actor.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Actor update failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              role: { after: parseRole(body?.role ?? null) ?? null },
              permissions: { after: parsePermissions(body?.permissions) ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Actor update failed.' },
        { status: 400 }
      );
    }
  };
}

export function createActorDeleteHandler(dependencies: ActorRouteDependencies = defaultDependencies) {
  return async function DELETE(
    request: Request,
    context: { params: Promise<{ tenantId: string; actorId: string }> }
  ) {
    const { tenantId, actorId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.actor.remove', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    try {
      const removed = await dependencies.removeTenantControlActor(tenantId, actorId);
      if (!removed) {
        return NextResponse.json({ ok: false, error: 'Actor not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.actor.remove',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              removed: { after: true },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json({ ok: true });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.actor.remove',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Actor removal failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              removed: { after: false },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Actor removal failed.' },
        { status: 400 }
      );
    }
  };
}

export const PATCH = createActorPatchHandler();
export const DELETE = createActorDeleteHandler();
