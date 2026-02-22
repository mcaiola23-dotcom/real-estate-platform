import type { TenantContext } from '@real-estate/types';
import { getAuthenticatedClient, createCalendarEvent, findCrmEvent, updateCalendarEvent } from '@real-estate/integrations/google';
import { listLeadsByTenantId, getContactByIdForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface CalendarSyncDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getAuthenticatedClient: typeof getAuthenticatedClient;
  listLeadsByTenantId: typeof listLeadsByTenantId;
  getContactByIdForTenant: typeof getContactByIdForTenant;
  createCalendarEvent: typeof createCalendarEvent;
  findCrmEvent: typeof findCrmEvent;
  updateCalendarEvent: typeof updateCalendarEvent;
}

const defaultDeps: CalendarSyncDeps = {
  requireTenantContext,
  getAuthenticatedClient,
  listLeadsByTenantId,
  getContactByIdForTenant,
  createCalendarEvent,
  findCrmEvent,
  updateCalendarEvent,
};

export function createCalendarSyncPostHandler(deps: CalendarSyncDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const actorId = tenantContext.tenantId;
    const client = await deps.getAuthenticatedClient(tenantContext.tenantId, actorId);
    if (!client) {
      return NextResponse.json(
        { ok: false, error: 'Google Calendar not connected. Please connect your Google account first.' },
        { status: 400 }
      );
    }

    try {
      const leads = await deps.listLeadsByTenantId(tenantContext.tenantId, {
        limit: 200,
        offset: 0,
      });

      const leadsWithFollowUp = leads.filter(
        (l) => l.nextActionAt && new Date(l.nextActionAt) > new Date()
      );

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const lead of leadsWithFollowUp) {
        const nextActionAt = new Date(lead.nextActionAt!);
        const actionNote = lead.nextActionNote || 'Follow up';

        // Resolve contact name
        let contactName = 'Unknown';
        if (lead.contactId) {
          const contact = await deps.getContactByIdForTenant(tenantContext.tenantId, lead.contactId);
          if (contact?.fullName) contactName = contact.fullName;
        }

        const summary = `Follow up: ${contactName} — ${actionNote}`;
        const description = [
          `Lead: ${lead.listingAddress || 'N/A'}`,
          `Status: ${lead.status}`,
          `Type: ${lead.leadType}`,
          lead.notes ? `Notes: ${lead.notes.slice(0, 200)}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // Check if a CRM event already exists
        const existing = await deps.findCrmEvent(client, lead.id);

        if (existing) {
          // Update if summary or time changed
          if (existing.summary !== summary || existing.start.getTime() !== nextActionAt.getTime()) {
            await deps.updateCalendarEvent(client, existing.id, {
              summary,
              description,
              startTime: nextActionAt,
              durationMinutes: 30,
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await deps.createCalendarEvent(client, {
            summary,
            description,
            startTime: nextActionAt,
            durationMinutes: 30,
            crmLeadId: lead.id,
          });
          created++;
        }
      }

      return NextResponse.json({
        ok: true,
        tenantId: tenantContext.tenantId,
        sync: { created, updated, skipped, total: leadsWithFollowUp.length },
      });
    } catch (error) {
      console.error('[Calendar Sync] Error:', error);
      return NextResponse.json(
        { ok: false, error: 'Calendar sync failed.' },
        { status: 500 }
      );
    }
  };
}

export const POST = createCalendarSyncPostHandler();
