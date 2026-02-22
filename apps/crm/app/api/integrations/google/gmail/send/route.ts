import type { TenantContext } from '@real-estate/types';
import { getAuthenticatedClient, sendEmail } from '@real-estate/integrations/google';
import { createActivityForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GmailSendDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getAuthenticatedClient: typeof getAuthenticatedClient;
  sendEmail: typeof sendEmail;
  createActivityForTenant: typeof createActivityForTenant;
}

const defaultDeps: GmailSendDeps = {
  requireTenantContext,
  getAuthenticatedClient,
  sendEmail,
  createActivityForTenant,
};

export function createGmailSendPostHandler(deps: GmailSendDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      to?: string;
      subject?: string;
      body?: string;
      leadId?: string;
      contactId?: string;
      replyToMessageId?: string;
    } | null;

    if (!body?.to || !body.subject || !body.body) {
      return NextResponse.json(
        { ok: false, error: 'to, subject, and body are required.' },
        { status: 400 }
      );
    }

    const actorId = tenantContext.tenantId;
    const client = await deps.getAuthenticatedClient(tenantContext.tenantId, actorId);
    if (!client) {
      return NextResponse.json(
        { ok: false, error: 'Gmail not connected. Please connect your Google account first.' },
        { status: 400 }
      );
    }

    try {
      const result = await deps.sendEmail(client, {
        to: body.to,
        subject: body.subject,
        body: body.body,
        replyToMessageId: body.replyToMessageId,
      });

      // Log activity
      if (body.leadId) {
        await deps.createActivityForTenant(tenantContext.tenantId, {
          leadId: body.leadId,
          contactId: body.contactId ?? null,
          activityType: 'email_sent',
          summary: `Email sent to ${body.to}: ${body.subject}`,
          metadataJson: JSON.stringify({
            messageId: result.messageId,
            threadId: result.threadId,
            to: body.to,
            subject: body.subject,
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        messageId: result.messageId,
        threadId: result.threadId,
      });
    } catch (error) {
      console.error('[Gmail Send] Error:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to send email.' },
        { status: 500 }
      );
    }
  };
}

export const POST = createGmailSendPostHandler();
