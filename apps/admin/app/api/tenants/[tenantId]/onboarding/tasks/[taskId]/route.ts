import { NextResponse } from 'next/server';

import { updateTenantOnboardingTask } from '@real-estate/db/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../../../lib/admin-access';

interface TenantOnboardingTaskRouteDependencies {
  updateTenantOnboardingTask: typeof updateTenantOnboardingTask;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantOnboardingTaskRouteDependencies = {
  updateTenantOnboardingTask,
};

export function createTenantOnboardingTaskPatchHandler(
  dependencies: TenantOnboardingTaskRouteDependencies = defaultDependencies
) {
  return async function PATCH(
    request: Request,
    context: { params: Promise<{ tenantId: string; taskId: string }> }
  ) {
    const { tenantId, taskId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.onboarding.task.update', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: {
      status?: 'pending' | 'in_progress' | 'blocked' | 'done' | 'skipped';
      priority?: 'critical' | 'high' | 'normal' | 'low';
      ownerRole?: 'sales' | 'ops' | 'build' | 'client';
      ownerActorId?: string | null;
      dueAt?: string | null;
      blockedByClient?: boolean;
      blockerReason?: string | null;
      title?: string;
      description?: string | null;
    } | null = null;

    try {
      body = (await request.json()) as {
        status?: 'pending' | 'in_progress' | 'blocked' | 'done' | 'skipped';
        priority?: 'critical' | 'high' | 'normal' | 'low';
        ownerRole?: 'sales' | 'ops' | 'build' | 'client';
        ownerActorId?: string | null;
        dueAt?: string | null;
        blockedByClient?: boolean;
        blockerReason?: string | null;
        title?: string;
        description?: string | null;
      };
      const task = await dependencies.updateTenantOnboardingTask(tenantId, taskId, {
        status: body?.status,
        priority: body?.priority,
        ownerRole: body?.ownerRole,
        ownerActorId: body?.ownerActorId,
        dueAt: body?.dueAt,
        blockedByClient: body?.blockedByClient,
        blockerReason: body?.blockerReason,
        title: body?.title,
        description: body?.description,
      });

      if (!task) {
        return NextResponse.json({ ok: false, error: 'Onboarding task not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.onboarding.task.update',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              taskId: { after: taskId },
              status: { after: body?.status ?? null },
              priority: { after: body?.priority ?? null },
              ownerRole: { after: body?.ownerRole ?? null },
              ownerActorId: { after: body?.ownerActorId ?? null },
              dueAt: { after: body?.dueAt ?? null },
              blockedByClient: { after: body?.blockedByClient ?? null },
              blockerReason: { after: body?.blockerReason ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, task });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.onboarding.task.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Onboarding task update failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              taskId: { after: taskId },
              status: { after: body?.status ?? null },
              priority: { after: body?.priority ?? null },
              ownerRole: { after: body?.ownerRole ?? null },
              ownerActorId: { after: body?.ownerActorId ?? null },
              dueAt: { after: body?.dueAt ?? null },
              blockedByClient: { after: body?.blockedByClient ?? null },
              blockerReason: { after: body?.blockerReason ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Onboarding task update failed.' },
        { status: 400 }
      );
    }
  };
}

export const PATCH = createTenantOnboardingTaskPatchHandler();
