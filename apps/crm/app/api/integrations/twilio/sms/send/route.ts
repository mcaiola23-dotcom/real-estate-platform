import type { TenantContext } from '@real-estate/types';
import { sendSms } from '@real-estate/integrations/twilio';
import type { SmsParams, SentSms } from '@real-estate/integrations/twilio';
import { createActivityForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface SmsSendDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  sendSms: (params: SmsParams) => Promise<SentSms>;
  createActivityForTenant: typeof createActivityForTenant;
}

const defaultDeps: SmsSendDeps = {
  requireTenantContext,
  sendSms,
  createActivityForTenant,
};

export function createSmsSendPostHandler(deps: SmsSendDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      to?: string;
      body?: string;
      leadId?: string;
      contactId?: string;
    } | null;

    if (!body?.to || !body.body) {
      return NextResponse.json(
        { ok: false, error: 'to and body are required.' },
        { status: 400 }
      );
    }

    try {
      const result = await deps.sendSms({
        to: body.to,
        body: body.body,
      });

      // Log activity
      if (body.leadId) {
        await deps.createActivityForTenant(tenantContext.tenantId, {
          leadId: body.leadId,
          contactId: body.contactId ?? null,
          activityType: 'sms_sent',
          summary: `SMS sent to ${body.to}: ${body.body.slice(0, 100)}${body.body.length > 100 ? '...' : ''}`,
          metadataJson: JSON.stringify({
            sid: result.sid,
            status: result.status,
            to: result.to,
            from: result.from,
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        sid: result.sid,
        status: result.status,
      });
    } catch (error) {
      console.error('[Twilio SMS] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to send SMS.';
      return NextResponse.json(
        { ok: false, error: message },
        { status: 500 }
      );
    }
  };
}

export const POST = createSmsSendPostHandler();
