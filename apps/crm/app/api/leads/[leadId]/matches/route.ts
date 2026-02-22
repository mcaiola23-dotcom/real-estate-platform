import type { TenantContext } from '@real-estate/types';
import { getLeadByIdForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';
import { getLeadPropertyMatches, type ListingMatchResult } from '../../../../lib/data/listings-provider';

interface RouteContext {
  params: Promise<{
    leadId: string;
  }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadMatchesDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  getLeadPropertyMatches: typeof getLeadPropertyMatches;
}

const defaultDeps: LeadMatchesDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  getLeadPropertyMatches,
};

export function createLeadMatchesGetHandler(deps: LeadMatchesDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { leadId } = await context.params;

    const lead = await deps.getLeadByIdForTenant(tenantContext.tenantId, leadId);
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found.' }, { status: 404 });
    }

    const url = new URL(request.url);
    const limit = Math.min(10, Math.max(1, parseInt(url.searchParams.get('limit') ?? '5', 10) || 5));

    const matches: ListingMatchResult[] = deps.getLeadPropertyMatches(
      {
        propertyType: lead.propertyType,
        beds: lead.beds,
        baths: lead.baths,
        priceMin: lead.priceMin,
        priceMax: lead.priceMax,
      },
      limit
    );

    return NextResponse.json({
      ok: true,
      leadId,
      tenantId: tenantContext.tenantId,
      matches: matches.map((m) => ({
        listing: m.listing,
        score: m.score,
        matchReasons: m.matchReasons,
      })),
      total: matches.length,
    });
  };
}

export const GET = createLeadMatchesGetHandler();
