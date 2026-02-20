import { NextResponse } from 'next/server';

import { setTenantSupportSessionState } from '@real-estate/db/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../../../lib/admin-access';

interface SupportSessionRouteDependencies {
  setTenantSupportSessionState: typeof setTenantSupportSessionState;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: SupportSessionRouteDependencies = {
  setTenantSupportSessionState,
};

export function createSupportSessionPostHandler(
  dependencies: SupportSessionRouteDependencies = defaultDependencies
) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string; actorId: string }> }) {
    const { tenantId, actorId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.support-session.start', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: { durationMinutes?: unknown } | null = null;

    try {
      body = (await request.json()) as { durationMinutes?: unknown };
      const parsedDuration =
        typeof body.durationMinutes === 'number'
          ? body.durationMinutes
          : typeof body.durationMinutes === 'string'
            ? Number.parseInt(body.durationMinutes, 10)
            : undefined;
      const durationMinutes =
        parsedDuration !== undefined && Number.isFinite(parsedDuration) ? Math.trunc(parsedDuration) : undefined;

      const actor = await dependencies.setTenantSupportSessionState(tenantId, actorId, {
        active: true,
        durationMinutes,
      });
      if (!actor) {
        return NextResponse.json({ ok: false, error: 'Actor not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.support-session.start',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              supportSessionActive: { after: true },
              durationMinutes: { after: durationMinutes ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, actor });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.support-session.start',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Support session start failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              supportSessionActive: { after: true },
              durationMinutes: {
                after:
                  typeof body?.durationMinutes === 'number' || typeof body?.durationMinutes === 'string'
                    ? body.durationMinutes
                    : null,
              },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Support session start failed.' },
        { status: 400 }
      );
    }
  };
}

export function createSupportSessionDeleteHandler(
  dependencies: SupportSessionRouteDependencies = defaultDependencies
) {
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
      { action: 'tenant.support-session.end', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    try {
      const actor = await dependencies.setTenantSupportSessionState(tenantId, actorId, {
        active: false,
      });
      if (!actor) {
        return NextResponse.json({ ok: false, error: 'Actor not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.support-session.end',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              supportSessionActive: { after: false },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, actor });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.support-session.end',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Support session end failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              targetActorId: { after: actorId },
              supportSessionActive: { after: false },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Support session end failed.' },
        { status: 400 }
      );
    }
  };
}

export const POST = createSupportSessionPostHandler();
export const DELETE = createSupportSessionDeleteHandler();
