import type { TenantContext } from '@real-estate/types';
import type { AiTonePreset } from '@real-estate/ai/types';
import { getLeadByIdForTenant, listActivitiesByTenantId, getContactByIdForTenant } from '@real-estate/db/crm';
import { draftMessage } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface DraftMessageDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  getContactByIdForTenant: typeof getContactByIdForTenant;
  draftMessage: typeof draftMessage;
}

const defaultDeps: DraftMessageDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listActivitiesByTenantId,
  getContactByIdForTenant,
  draftMessage,
};

const VALID_TONES = new Set<AiTonePreset>(['professional', 'friendly', 'casual']);
const VALID_MESSAGE_TYPES = new Set(['email', 'sms', 'note']);

export function createDraftMessagePostHandler(deps: DraftMessageDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      leadId?: string;
      context?: string;
      tone?: string;
      messageType?: string;
    } | null;

    if (!body?.leadId || !body.context) {
      return NextResponse.json(
        { ok: false, error: 'leadId and context are required.' },
        { status: 400 },
      );
    }

    const tone = (VALID_TONES.has(body.tone as AiTonePreset) ? body.tone : 'professional') as AiTonePreset;
    const messageType = (VALID_MESSAGE_TYPES.has(body.messageType ?? '') ? body.messageType : 'email') as 'email' | 'sms' | 'note';

    const lead = await deps.getLeadByIdForTenant(tenantContext.tenantId, body.leadId);
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found.' }, { status: 404 });
    }

    // Resolve contact name
    let contactName: string | null = null;
    if (lead.contactId) {
      const contact = await deps.getContactByIdForTenant(tenantContext.tenantId, lead.contactId);
      contactName = contact?.fullName ?? null;
    }

    const activities = await deps.listActivitiesByTenantId(tenantContext.tenantId, {
      leadId: body.leadId,
      limit: 10,
      offset: 0,
    });

    const result = await deps.draftMessage({
      tenantId: tenantContext.tenantId,
      leadId: body.leadId,
      contactName,
      context: body.context,
      tone,
      messageType,
      leadStatus: lead.status,
      recentActivities: activities.slice(0, 5).map((a) => a.summary || a.activityType),
      propertyInterest: lead.listingAddress,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      draft: result,
    });
  };
}

export const POST = createDraftMessagePostHandler();
