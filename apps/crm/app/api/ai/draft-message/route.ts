import type { TenantContext } from '@real-estate/types';
import type { AiTonePreset } from '@real-estate/ai/types';
import { getLeadByIdForTenant, listActivitiesByTenantId, getContactByIdForTenant } from '@real-estate/db/crm';
import { draftMessage, draftMultipleMessages, draftFromTemplate } from '@real-estate/ai/crm';
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
  draftMultipleMessages: typeof draftMultipleMessages;
  draftFromTemplate: typeof draftFromTemplate;
}

const defaultDeps: DraftMessageDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  listActivitiesByTenantId,
  getContactByIdForTenant,
  draftMessage,
  draftMultipleMessages,
  draftFromTemplate,
};

const VALID_TONES = new Set<AiTonePreset>(['professional', 'friendly', 'casual']);
const VALID_MESSAGE_TYPES = new Set(['email', 'sms', 'note']);

const COMMUNICATION_ACTIVITY_TYPES = new Set(['call_logged', 'text_logged', 'email_logged', 'email_sent']);

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
      multiDraft?: boolean;
      templateBody?: string;
      templateSubject?: string;
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
      limit: 15,
      offset: 0,
    });

    // Extract communication history summaries (for context-aware drafting)
    const communicationHistory = activities
      .filter((a) => COMMUNICATION_ACTIVITY_TYPES.has(a.activityType))
      .slice(0, 5)
      .map((a) => {
        const meta = a.metadataJson ? tryParseJson(a.metadataJson) : null;
        const snippet = (meta?.snippet as string) || (typeof meta?.body === 'string' ? meta.body.slice(0, 100) : '') || '';
        return `${a.activityType}: ${a.summary}${snippet ? ` — ${snippet}` : ''}`;
      });

    const sharedInput = {
      tenantId: tenantContext.tenantId,
      leadId: body.leadId,
      contactName,
      context: body.context,
      tone,
      messageType,
      leadStatus: lead.status,
      recentActivities: activities.slice(0, 5).map((a) => a.summary || a.activityType),
      propertyInterest: lead.listingAddress,
      communicationHistory,
    };

    // Template-based draft
    if (body.templateBody) {
      const result = await deps.draftFromTemplate({
        ...sharedInput,
        templateBody: body.templateBody,
        templateSubject: body.templateSubject ?? null,
      });

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        draft: result,
      });
    }

    // Multi-draft mode
    if (body.multiDraft) {
      const results = await deps.draftMultipleMessages({
        ...sharedInput,
        count: 3,
      });

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        drafts: results,
      });
    }

    // Standard single draft
    const result = await deps.draftMessage(sharedInput);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      draft: result,
    });
  };
}

function tryParseJson(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str); } catch { return null; }
}

export const POST = createDraftMessagePostHandler();
