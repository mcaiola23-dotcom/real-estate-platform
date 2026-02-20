import { NextResponse } from 'next/server';

import { updateTenantDomainStatus } from '@real-estate/db/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../../lib/admin-access';

interface DomainPatchDependencies {
  updateTenantDomainStatus: typeof updateTenantDomainStatus;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: DomainPatchDependencies = {
  updateTenantDomainStatus,
};

export function createDomainPatchHandler(dependencies: DomainPatchDependencies = defaultDependencies) {
  return async function PATCH(
    request: Request,
    context: { params: Promise<{ tenantId: string; domainId: string }> }
  ) {
    const { tenantId, domainId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.domain.update', tenantId, domainId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as {
      status?: 'active' | 'archived';
      isPrimary?: boolean;
      isVerified?: boolean;
    };

    const updated = await dependencies.updateTenantDomainStatus(tenantId, domainId, {
      status: body.status === 'active' || body.status === 'archived' ? body.status : undefined,
      isPrimary: body.isPrimary,
      isVerified: body.isVerified,
    });

    if (!updated) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.domain.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          domainId,
          error: 'Domain not found for tenant.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              isPrimary: { after: body.isPrimary ?? null },
              isVerified: { after: body.isVerified ?? null },
              status: { after: body.status ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json({ ok: false, error: 'Domain not found for tenant.' }, { status: 404 });
    }

    await safeWriteAdminAuditLog(
      {
        action: 'tenant.domain.update',
        actor: access.actor,
        status: 'succeeded',
        tenantId,
        domainId,
        metadata: buildAuditRequestMetadata(request, {
          changes: {
            isPrimary: { after: body.isPrimary ?? null },
            isVerified: { after: body.isVerified ?? null },
            status: { after: body.status ?? null },
          },
        }),
      },
      accessDependencies.writeAdminAuditLog
    );

    return NextResponse.json({ ok: true, domain: updated });
  };
}

export const PATCH = createDomainPatchHandler();
