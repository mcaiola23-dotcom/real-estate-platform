import { NextResponse } from 'next/server';

import { updateTenantLifecycleStatus } from '@real-estate/db/control-plane';
import type { Tenant } from '@real-estate/types/tenant';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface TenantStatusPatchDependencies {
  updateTenantLifecycleStatus: typeof updateTenantLifecycleStatus;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantStatusPatchDependencies = {
  updateTenantLifecycleStatus,
};

function parseTenantStatus(value: unknown): Tenant['status'] | null {
  if (value === 'active' || value === 'suspended' || value === 'archived') {
    return value;
  }
  return null;
}

export function createTenantStatusPatchHandler(dependencies: TenantStatusPatchDependencies = defaultDependencies) {
  return async function PATCH(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.status.update', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: { status?: unknown } | null = null;
    try {
      body = (await request.json()) as { status?: unknown };
      const status = parseTenantStatus(body.status);
      if (!status) {
        return NextResponse.json({ ok: false, error: 'status must be active, suspended, or archived.' }, { status: 400 });
      }

      const tenant = await dependencies.updateTenantLifecycleStatus(tenantId, status);
      if (!tenant) {
        await safeWriteAdminAuditLog(
          {
            action: 'tenant.status.update',
            actor: access.actor,
            status: 'failed',
            tenantId,
            error: 'Tenant not found.',
            metadata: buildAuditRequestMetadata(request, {
              changes: {
                status: { after: status },
              },
            }),
          },
          accessDependencies.writeAdminAuditLog
        );
        return NextResponse.json({ ok: false, error: 'Tenant not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.status.update',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              status: { after: status },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, tenant });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.status.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Tenant status update failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              status: { after: parseTenantStatus(body?.status) ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Tenant status update failed.' },
        { status: 400 }
      );
    }
  };
}

export const PATCH = createTenantStatusPatchHandler();
