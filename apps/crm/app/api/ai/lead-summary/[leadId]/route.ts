import type { TenantContext } from '@real-estate/types';
import { getLeadByIdForTenant, listActivitiesByTenantId, getContactByIdForTenant } from '@real-estate/db/crm';
import { generateLeadSummary } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadSummaryDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  getContactByIdForTenant: typeof getContactByIdForTenant;
  generateLeadSummary: typeof generateLeadSummary;
}

const defaultDeps: LeadSummaryDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listActivitiesByTenantId,
  getContactByIdForTenant,
  generateLeadSummary,
};

export function createLeadSummaryGetHandler(deps: LeadSummaryDeps = defaultDeps) {
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

    const activities = await deps.listActivitiesByTenantId(tenantContext.tenantId, {
      leadId,
      limit: 100,
      offset: 0,
    });

    // Resolve contact name
    let contactName: string | null = null;
    if (lead.contactId) {
      const contact = await deps.getContactByIdForTenant(tenantContext.tenantId, lead.contactId);
      contactName = contact?.fullName ?? null;
    }

    const favoriteCount = activities.filter((a) => a.activityType === 'listing_favorited').length;
    const searchCount = activities.filter((a) => a.activityType === 'search_performed').length;

    const summary = await deps.generateLeadSummary(tenantContext.tenantId, {
      lead,
      contactName,
      activities,
      favoriteCount,
      searchCount,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      summary,
    });
  };
}

export const GET = createLeadSummaryGetHandler();
