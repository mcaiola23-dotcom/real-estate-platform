import type { TenantContext } from '@real-estate/types';
import { getAuthenticatedClient, listCalendarEvents } from '@real-estate/integrations/google';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface CalendarEventsDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getAuthenticatedClient: typeof getAuthenticatedClient;
  listCalendarEvents: typeof listCalendarEvents;
}

const defaultDeps: CalendarEventsDeps = {
  requireTenantContext,
  getAuthenticatedClient,
  listCalendarEvents,
};

export function createCalendarEventsGetHandler(deps: CalendarEventsDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const actorId = tenantContext.tenantId;
    const client = await deps.getAuthenticatedClient(tenantContext.tenantId, actorId);
    if (!client) {
      return NextResponse.json(
        { ok: false, error: 'Google Calendar not connected.' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const days = Math.min(parseInt(url.searchParams.get('days') ?? '14', 10), 90);

    const now = new Date();
    const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    try {
      const events = await deps.listCalendarEvents(client, now, timeMax);

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        events: events.map((e) => ({
          id: e.id,
          summary: e.summary,
          description: e.description,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          htmlLink: e.htmlLink,
          isCrmEvent: e.isCrmEvent,
          crmLeadId: e.crmLeadId,
        })),
        range: { from: now.toISOString(), to: timeMax.toISOString(), days },
      });
    } catch (error) {
      console.error('[Calendar Events] Error:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch calendar events.' },
        { status: 500 }
      );
    }
  };
}

export const GET = createCalendarEventsGetHandler();
