import type { TenantContext } from '@real-estate/types';
import { getLeadByIdForTenant, listActivitiesByTenantId } from '@real-estate/db/crm';
import { evaluateEscalation } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface EscalationDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  evaluateEscalation: typeof evaluateEscalation;
}

const defaultDeps: EscalationDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listActivitiesByTenantId,
  evaluateEscalation,
};

export function createEscalationGetHandler(deps: EscalationDeps = defaultDeps) {
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
      limit: 50,
      offset: 0,
    });

    const result = await deps.evaluateEscalation(tenantContext.tenantId, lead, activities);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      escalation: result,
    });
  };
}

export const GET = createEscalationGetHandler();
