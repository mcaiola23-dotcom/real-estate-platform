import type { TenantContext, CrmLead, CrmActivity, TenantControlActor } from '@real-estate/types';
import { getLeadByIdForTenant, listLeadsByTenantId, listActivitiesByTenantId } from '@real-estate/db/crm';
import { listTenantControlActors } from '@real-estate/db/control-plane';
import { computeLeadRouting } from '@real-estate/ai/crm';
import type { LeadRoutingResult } from '@real-estate/ai/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadRoutingDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  listLeadsByTenantId: typeof listLeadsByTenantId;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  listTenantControlActors: typeof listTenantControlActors;
  computeLeadRouting: typeof computeLeadRouting;
}

const defaultDeps: LeadRoutingDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listLeadsByTenantId,
  listActivitiesByTenantId,
  listTenantControlActors,
  computeLeadRouting,
};

export function createLeadRoutingGetHandler(deps: LeadRoutingDeps = defaultDeps) {
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

    // Fetch actors, all leads, and all activities for routing computation
    const [actors, allLeads, allActivities] = await Promise.all([
      deps.listTenantControlActors(tenantContext.tenantId),
      deps.listLeadsByTenantId(tenantContext.tenantId, { limit: 200, offset: 0 }),
      deps.listActivitiesByTenantId(tenantContext.tenantId, { limit: 200, offset: 0 }),
    ]);

    const routing = await deps.computeLeadRouting(
      tenantContext.tenantId,
      toLeadInput(lead),
      actors.map(toActorInput),
      allLeads.map(toLeadInput),
      allActivities.map(toActivityInput),
    );

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      routing,
    });
  };
}

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
    assignedTo: lead.assignedTo,
    createdAt: lead.createdAt,
    closedAt: lead.closedAt,
  };
}

function toActorInput(actor: TenantControlActor) {
  return {
    actorId: actor.actorId,
    displayName: actor.displayName,
  };
}

function toActivityInput(activity: CrmActivity) {
  return {
    activityType: activity.activityType,
    occurredAt: activity.occurredAt,
    leadId: activity.leadId,
  };
}

export const GET = createLeadRoutingGetHandler();
