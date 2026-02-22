import type { TenantContext } from '@real-estate/types';
import { generateMarketDigest } from '@real-estate/ai/crm';
import type { MarketDigestInput } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';
import { searchCrmListings } from '../../../lib/data/listings-provider';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface MarketDigestDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  searchCrmListings: typeof searchCrmListings;
  generateMarketDigest: typeof generateMarketDigest;
}

const defaultDeps: MarketDigestDeps = {
  requireTenantContext,
  searchCrmListings,
  generateMarketDigest,
};

export function createMarketDigestGetHandler(deps: MarketDigestDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    // Fetch all listings for market analysis
    const result = deps.searchCrmListings({
      tenantId: tenantContext.tenantId,
      pageSize: 200, // Get all available
    });

    const digestListings: MarketDigestInput['listings'] = result.listings.map((l) => ({
      price: l.price,
      beds: l.beds,
      baths: l.baths,
      sqft: l.sqft,
      status: l.status,
      propertyType: l.propertyType,
      city: l.address.city,
      listedAt: l.listedAt,
      updatedAt: l.updatedAt,
    }));

    const digest = await deps.generateMarketDigest(tenantContext.tenantId, {
      listings: digestListings,
      agentName: null, // Could be populated from tenant settings
      territory: null, // Could be derived from listing cities
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      digest,
    });
  };
}

export const GET = createMarketDigestGetHandler();
