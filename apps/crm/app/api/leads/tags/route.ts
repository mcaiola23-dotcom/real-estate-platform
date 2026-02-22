import type { TenantContext } from '@real-estate/types';
import { listAllLeadTagsForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadTagsDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listAllLeadTagsForTenant: typeof listAllLeadTagsForTenant;
}

const defaultDeps: LeadTagsDeps = {
  requireTenantContext,
  listAllLeadTagsForTenant,
};

export function createLeadTagsGetHandler(deps: LeadTagsDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    if (!tenantContext) {
      return NextResponse.json(
        { ok: false, error: 'Tenant resolution failed.' },
        { status: 401 }
      );
    }

    const tags = await deps.listAllLeadTagsForTenant(tenantContext.tenantId);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      tags,
    });
  };
}

export const GET = createLeadTagsGetHandler();
