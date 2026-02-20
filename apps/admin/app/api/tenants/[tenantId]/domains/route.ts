import { NextResponse } from 'next/server';

import { addTenantDomain } from '@real-estate/db/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface DomainsPostDependencies {
  addTenantDomain: typeof addTenantDomain;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: DomainsPostDependencies = {
  addTenantDomain,
};

export function createDomainsPostHandler(dependencies: DomainsPostDependencies = defaultDependencies) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(request, { action: 'tenant.domain.add', tenantId }, accessDependencies);
    if (!access.ok) {
      return access.response;
    }

    let body:
      | {
          hostname?: string;
          isPrimary?: boolean;
          isVerified?: boolean;
        }
      | null = null;

    try {
      body = (await request.json()) as {
        hostname?: string;
        isPrimary?: boolean;
        isVerified?: boolean;
      };

      if (!body.hostname) {
        return NextResponse.json({ ok: false, error: 'hostname is required.' }, { status: 400 });
      }

      const domain = await dependencies.addTenantDomain(tenantId, {
        hostname: body.hostname,
        isPrimary: body.isPrimary,
        isVerified: body.isVerified,
      });

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.domain.add',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          domainId: domain.id,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              hostname: { after: body.hostname },
              isPrimary: { after: body.isPrimary ?? false },
              isVerified: { after: body.isVerified ?? false },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, domain });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.domain.add',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Domain add failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              hostname: { after: body?.hostname ?? null },
              isPrimary: { after: body?.isPrimary ?? null },
              isVerified: { after: body?.isVerified ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Domain add failed.' },
        { status: 400 }
      );
    }
  };
}

export const POST = createDomainsPostHandler();
