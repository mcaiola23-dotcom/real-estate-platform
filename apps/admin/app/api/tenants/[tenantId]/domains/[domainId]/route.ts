import { NextResponse } from 'next/server';

import { updateTenantDomainStatus } from '@real-estate/db/control-plane';

interface DomainPatchDependencies {
  updateTenantDomainStatus: typeof updateTenantDomainStatus;
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

    const body = (await request.json()) as {
      isPrimary?: boolean;
      isVerified?: boolean;
    };

    const updated = await dependencies.updateTenantDomainStatus(tenantId, domainId, {
      isPrimary: body.isPrimary,
      isVerified: body.isVerified,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Domain not found for tenant.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, domain: updated });
  };
}

export const PATCH = createDomainPatchHandler();
