import type { TenantContext, CrmLead, CrmActivity } from '@real-estate/types';
import { getLeadByIdForTenant, listLeadsByTenantId, listActivitiesByTenantId } from '@real-estate/db/crm';
import { predictLeadConversion } from '@real-estate/ai/crm';
import type { PredictiveScoreResult } from '@real-estate/ai/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface PredictiveScoreDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  listLeadsByTenantId: typeof listLeadsByTenantId;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  predictLeadConversion: typeof predictLeadConversion;
}

const defaultDeps: PredictiveScoreDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listLeadsByTenantId,
  listActivitiesByTenantId,
  predictLeadConversion,
};

export function createPredictiveScoreGetHandler(deps: PredictiveScoreDeps = defaultDeps) {
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

    // Fetch lead activities
    const activities = await deps.listActivitiesByTenantId(tenantContext.tenantId, {
      leadId,
      limit: 200,
      offset: 0,
    });

    // Fetch closed leads (won + lost) for historical distribution
    // listLeadsByTenantId only accepts single status, so we make two calls
    const [wonLeads, lostLeads] = await Promise.all([
      deps.listLeadsByTenantId(tenantContext.tenantId, { status: 'won', limit: 200, offset: 0 }),
      deps.listLeadsByTenantId(tenantContext.tenantId, { status: 'lost', limit: 200, offset: 0 }),
    ]);

    // Fetch activities for each closed lead
    const closedLeads = [...wonLeads, ...lostLeads];
    const closedLeadBundles = await Promise.all(
      closedLeads.map(async (cl) => {
        const clActivities = await deps.listActivitiesByTenantId(tenantContext.tenantId, {
          leadId: cl.id,
          limit: 100,
          offset: 0,
        });
        return {
          lead: toLeadInput(cl),
          activities: toActivityInputs(clActivities),
        };
      }),
    );

    const prediction = await deps.predictLeadConversion(
      tenantContext.tenantId,
      toLeadInput(lead),
      toActivityInputs(activities),
      closedLeadBundles,
    );

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      prediction,
    });
  };
}

// Map CrmLead to the minimal LeadInput expected by the scoring engine
function toLeadInput(lead: CrmLead) {
  return {
    id: lead.id,
    tenantId: lead.tenantId,
    status: lead.status,
    leadType: lead.leadType,
    source: lead.source,
    contactId: lead.contactId,
    listingAddress: lead.listingAddress,
    propertyType: lead.propertyType,
    timeframe: lead.timeframe,
    priceMin: lead.priceMin,
    priceMax: lead.priceMax,
    createdAt: lead.createdAt,
    closedAt: lead.closedAt,
  };
}

// Map CrmActivity[] to ActivityInput[]
function toActivityInputs(activities: CrmActivity[]) {
  return activities.map((a) => ({
    activityType: a.activityType,
    occurredAt: a.occurredAt,
    leadId: a.leadId,
  }));
}

export const GET = createPredictiveScoreGetHandler();
