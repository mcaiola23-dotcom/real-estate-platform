import type { TenantContext } from '@real-estate/types';
import { getAuthenticatedClient, listThreads } from '@real-estate/integrations/google';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GmailThreadsDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getAuthenticatedClient: typeof getAuthenticatedClient;
  listThreads: typeof listThreads;
}

const defaultDeps: GmailThreadsDeps = {
  requireTenantContext,
  getAuthenticatedClient,
  listThreads,
};

export function createGmailThreadsGetHandler(deps: GmailThreadsDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'email query parameter is required.' },
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
      const maxResults = Math.min(parseInt(url.searchParams.get('limit') ?? '15', 10), 50);
      const threads = await deps.listThreads(client, {
        query: `from:${email} OR to:${email}`,
        maxResults,
      });

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        threads: threads.map((t) => ({
          id: t.id,
          subject: t.subject,
          snippet: t.snippet,
          lastMessageDate: t.lastMessageDate.toISOString(),
          messageCount: t.messageCount,
          isUnread: t.isUnread,
        })),
      });
    } catch (error) {
      console.error('[Gmail Threads] Error:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch email threads.' },
        { status: 500 }
      );
    }
  };
}

export const GET = createGmailThreadsGetHandler();
