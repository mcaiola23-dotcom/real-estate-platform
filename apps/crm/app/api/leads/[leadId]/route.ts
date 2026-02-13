import type { CrmLeadStatus } from '@real-estate/types/crm';
import { createActivityForTenant, updateLeadForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

const VALID_STATUSES: Set<CrmLeadStatus> = new Set(['new', 'qualified', 'nurturing', 'won', 'lost']);

interface RouteContext {
  params: Promise<{
    leadId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { leadId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | {
        status?: string;
        notes?: string | null;
      }
    | null;

  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid JSON body.',
      },
      { status: 400 }
    );
  }

  const status =
    payload.status && VALID_STATUSES.has(payload.status as CrmLeadStatus)
      ? (payload.status as CrmLeadStatus)
      : undefined;
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : payload.notes;

  if (!status && payload.notes === undefined) {
    return NextResponse.json(
      {
        ok: false,
        error: 'At least one updatable field is required.',
      },
      { status: 400 }
    );
  }

  const updatedLead = await updateLeadForTenant(tenantContext.tenantId, leadId, {
    status,
    notes,
  });

  if (!updatedLead) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Lead not found or update failed.',
      },
      { status: 404 }
    );
  }

  if (status) {
    await createActivityForTenant(tenantContext.tenantId, {
      activityType: 'lead_status_changed',
      leadId,
      contactId: updatedLead.contactId,
      summary: `Lead status updated to ${status}`,
      metadataJson: JSON.stringify({ status }),
    });
  }

  return NextResponse.json({
    ok: true,
    tenantId: tenantContext.tenantId,
    lead: updatedLead,
  });
}
