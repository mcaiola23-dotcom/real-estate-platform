import type { TenantContext } from '@real-estate/types';
import { getAuthenticatedClient, getThread } from '@real-estate/integrations/google';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GmailThreadDetailDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getAuthenticatedClient: typeof getAuthenticatedClient;
  getThread: typeof getThread;
}

const defaultDeps: GmailThreadDetailDeps = {
  requireTenantContext,
  getAuthenticatedClient,
  getThread,
};

export function createGmailThreadDetailGetHandler(deps: GmailThreadDetailDeps = defaultDeps) {
  return async function GET(
    request: Request,
    { params }: { params: Promise<{ threadId: string }> }
  ) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { threadId } = await params;
    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: 'threadId is required.' },
        { status: 400 }
      );
    }

    const actorId = tenantContext.tenantId;
    const client = await deps.getAuthenticatedClient(tenantContext.tenantId, actorId);
    if (!client) {
      return NextResponse.json(
        { ok: false, error: 'Gmail not connected.' },
        { status: 400 }
      );
    }

    try {
      const messages = await deps.getThread(client, threadId);

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        threadId,
        messages: messages.map((m) => ({
          id: m.id,
          from: m.from,
          to: m.to,
          subject: m.subject,
          date: m.date.toISOString(),
          body: m.body,
          isHtml: m.isHtml,
        })),
      });
    } catch (error) {
      console.error('[Gmail Thread Detail] Error:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch thread.' },
        { status: 500 }
      );
    }
  };
}

export const GET = createGmailThreadDetailGetHandler();
