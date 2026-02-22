import type { TenantContext } from '@real-estate/types';
import { findPotentialDuplicateLeads } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface DuplicatesDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  findPotentialDuplicateLeads: typeof findPotentialDuplicateLeads;
}

const defaultDeps: DuplicatesDeps = {
  requireTenantContext,
  findPotentialDuplicateLeads,
};

export function createDuplicatesGetHandler(deps: DuplicatesDeps = defaultDeps) {
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

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim() || undefined;
    const phone = searchParams.get('phone')?.trim() || undefined;
    const address = searchParams.get('address')?.trim() || undefined;
    const excludeLeadId = searchParams.get('excludeLeadId')?.trim() || undefined;

    if (!email && !phone && !address) {
      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        duplicates: [],
      });
    }

    const duplicates = await deps.findPotentialDuplicateLeads(tenantContext.tenantId, {
      excludeLeadId,
      email,
      phone,
      address,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      duplicates,
    });
  };
}

export const GET = createDuplicatesGetHandler();
