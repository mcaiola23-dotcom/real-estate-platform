import { NextResponse } from 'next/server';

import { listTenantControlActors, upsertTenantControlActor } from '@real-estate/db/control-plane';
import type { ControlPlaneActorPermission, ControlPlaneActorRole } from '@real-estate/types/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface ActorsRouteDependencies {
  listTenantControlActors: typeof listTenantControlActors;
  upsertTenantControlActor: typeof upsertTenantControlActor;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: ActorsRouteDependencies = {
  listTenantControlActors,
  upsertTenantControlActor,
};

function parseRole(value: unknown): ControlPlaneActorRole | null {
  if (value === 'admin' || value === 'operator' || value === 'support' || value === 'viewer') {
    return value;
  }
  return null;
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

export function createActorsGetHandler(dependencies: ActorsRouteDependencies = defaultDependencies) {
  return async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const actors = await dependencies.listTenantControlActors(tenantId);
    return NextResponse.json({ ok: true, actors });
  };
}

export function createActorsPostHandler(dependencies: ActorsRouteDependencies = defaultDependencies) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.actor.add', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body:
      | {
          actorId?: unknown;
          displayName?: unknown;
          email?: unknown;
          role?: unknown;
          permissions?: unknown;
        }
      | null = null;

    try {
      body = (await request.json()) as {
        actorId?: unknown;
        displayName?: unknown;
        email?: unknown;
        role?: unknown;
        permissions?: unknown;
      };

      const actorId = typeof body.actorId === 'string' ? body.actorId.trim() : '';
      const role = parseRole(body.role);
      if (!actorId || !role) {
        return NextResponse.json({ ok: false, error: 'actorId and role are required.' }, { status: 400 });
      }

      const actor = await dependencies.upsertTenantControlActor(tenantId, {
        actorId,
        displayName: typeof body.displayName === 'string' ? body.displayName : null,
        email: typeof body.email === 'string' ? body.email : null,
        role,
        permissions: parsePermissions(body.permissions),
      });

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.actor.add',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actor.actorId },
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
          action: 'tenant.actor.add',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Actor upsert failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: {
                after: typeof body?.actorId === 'string' ? body.actorId : null,
              },
              role: { after: parseRole(body?.role ?? null) ?? null },
              permissions: { after: parsePermissions(body?.permissions) ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Actor upsert failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createActorsGetHandler();
export const POST = createActorsPostHandler();
