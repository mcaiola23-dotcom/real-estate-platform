import { NextResponse } from 'next/server';

import { getCrmListingById } from '../../../lib/data/listings-provider';
import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: { tenantId: string } | null;
  unauthorizedResponse: Response | null;
}

interface PropertyGetDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getCrmListingById: typeof getCrmListingById;
}

const defaultDeps: PropertyGetDeps = {
  requireTenantContext,
  getCrmListingById,
};

export function createPropertyGetHandler(deps: PropertyGetDeps = defaultDeps) {
  return async function GET(
    request: Request,
    { params }: { params: Promise<{ propertyId: string }> }
  ) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { propertyId } = await params;
    const listing = deps.getCrmListingById(propertyId);

    if (!listing) {
      return NextResponse.json({ ok: false, error: 'Property not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      listing,
    });
  };
}

export const GET = createPropertyGetHandler();
