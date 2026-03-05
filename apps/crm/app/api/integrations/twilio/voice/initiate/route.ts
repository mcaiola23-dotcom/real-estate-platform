import type { TenantContext } from '@real-estate/types';
import { initiateCall } from '@real-estate/integrations/twilio';
import type { CallParams, InitiatedCall } from '@real-estate/integrations/twilio';
import { createActivityForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface VoiceInitiateDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  initiateCall: (params: CallParams) => Promise<InitiatedCall>;
  createActivityForTenant: typeof createActivityForTenant;
}

const defaultDeps: VoiceInitiateDeps = {
  requireTenantContext,
  initiateCall,
  createActivityForTenant,
};

export function createVoiceInitiatePostHandler(deps: VoiceInitiateDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      to?: string;
      agentPhone?: string;
      leadId?: string;
      contactId?: string;
    } | null;

    if (!body?.to) {
      return NextResponse.json(
        { ok: false, error: 'to (phone number) is required.' },
        { status: 400 }
      );
    }

    try {
      const result = await deps.initiateCall({
        to: body.to,
        agentPhone: body.agentPhone,
      });

      if (body.leadId) {
        await deps.createActivityForTenant(tenantContext.tenantId, {
          leadId: body.leadId,
          contactId: body.contactId ?? null,
          activityType: 'call_initiated',
          summary: `Call initiated to ${body.to}`,
          metadataJson: JSON.stringify({
            callSid: result.sid,
            status: result.status,
            to: result.to,
            from: result.from,
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        callSid: result.sid,
        status: result.status,
      });
    } catch (error) {
      console.error('[Twilio Voice] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate call.';
      return NextResponse.json(
        { ok: false, error: message },
        { status: 500 }
      );
    }
  };
}

export const POST = createVoiceInitiatePostHandler();
