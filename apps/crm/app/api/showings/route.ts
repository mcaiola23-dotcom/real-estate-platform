import {
  createShowingForTenant,
  listShowingsByTenantId,
} from '@real-estate/db/crm';
import type { CrmShowingListQuery, TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ShowingsRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listShowingsByTenantId: typeof listShowingsByTenantId;
  createShowingForTenant: typeof createShowingForTenant;
}

const defaultDeps: ShowingsRouteDeps = {
  requireTenantContext,
  listShowingsByTenantId,
  createShowingForTenant,
};

export function createShowingsGetHandler(deps: ShowingsRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query: CrmShowingListQuery = {
      leadId: url.searchParams.get('leadId') || undefined,
      status: url.searchParams.get('status') || undefined,
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : undefined,
    };

    const showings = await deps.listShowingsByTenantId(tenantContext.tenantId, query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      showings,
      pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, showings.length),
    });
  };
}

export function createShowingsPostHandler(deps: ShowingsRouteDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const propertyAddress = String(payload.propertyAddress || '').trim();
    const scheduledAt = String(payload.scheduledAt || '').trim();

    if (!propertyAddress) {
      return NextResponse.json({ ok: false, error: 'propertyAddress is required.' }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ ok: false, error: 'scheduledAt is required.' }, { status: 400 });
    }

    const showing = await deps.createShowingForTenant(tenantContext.tenantId, {
      propertyAddress,
      scheduledAt,
      leadId: payload.leadId ? String(payload.leadId) : null,
      contactId: payload.contactId ? String(payload.contactId) : null,
      duration: payload.duration ? Number(payload.duration) : null,
      status: payload.status ? String(payload.status) : 'scheduled',
      notes: payload.notes ? String(payload.notes).trim() : null,
      calendarEventId: payload.calendarEventId ? String(payload.calendarEventId) : null,
    });

    if (!showing) {
      return NextResponse.json(
        { ok: false, error: 'Showing creation failed. Check input and verify tenant-scoped IDs.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, showing },
      { status: 201 }
    );
  };
}

export const GET = createShowingsGetHandler();
export const POST = createShowingsPostHandler();
