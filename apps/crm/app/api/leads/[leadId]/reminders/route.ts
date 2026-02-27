import {
  createReminderForTenant,
  listRemindersForTenant,
} from '@real-estate/db/crm';
import type { CrmReminderListQuery, TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../../../lib/query-params';
import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadRemindersRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listRemindersForTenant: typeof listRemindersForTenant;
  createReminderForTenant: typeof createReminderForTenant;
}

const defaultDeps: LeadRemindersRouteDeps = {
  requireTenantContext,
  listRemindersForTenant,
  createReminderForTenant,
};

export function createLeadRemindersGetHandler(deps: LeadRemindersRouteDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { leadId } = await context.params;
    const url = new URL(request.url);
    const query: CrmReminderListQuery = {
      leadId,
      status: (url.searchParams.get('status') as CrmReminderListQuery['status']) || undefined,
      limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : undefined,
    };

    const reminders = await deps.listRemindersForTenant(tenantContext.tenantId, query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      reminders,
      pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, reminders.length),
    });
  };
}

export function createLeadRemindersPostHandler(deps: LeadRemindersRouteDeps = defaultDeps) {
  return async function POST(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { leadId } = await context.params;
    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const scheduledFor = String(payload.scheduledFor || '').trim();
    if (!scheduledFor) {
      return NextResponse.json({ ok: false, error: 'scheduledFor is required.' }, { status: 400 });
    }

    const reminder = await deps.createReminderForTenant(tenantContext.tenantId, {
      leadId,
      scheduledFor,
      note: payload.note ? String(payload.note).trim() : null,
      channel: payload.channel ? String(payload.channel).trim() : null,
    });

    if (!reminder) {
      return NextResponse.json(
        { ok: false, error: 'Reminder creation failed. Check input and verify tenant-scoped IDs.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, reminder },
      { status: 201 }
    );
  };
}

export const GET = createLeadRemindersGetHandler();
export const POST = createLeadRemindersPostHandler();
