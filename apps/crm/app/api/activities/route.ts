import { createActivityForTenant, listActivitiesByTenantId } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { buildPagination, parseActivityListQuery } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

export async function GET(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const url = new URL(request.url);
  const query = parseActivityListQuery(url.searchParams);

  const activities = await listActivitiesByTenantId(tenantContext.tenantId, query);

  return NextResponse.json({
    ok: true,
    tenantId: tenantContext.tenantId,
    activities,
    pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, activities.length),
  });
}

export async function POST(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        summary?: string;
        activityType?: string;
        leadId?: string;
        contactId?: string;
      }
    | null;

  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid JSON body.',
      },
      { status: 400 }
    );
  }

  const summary = payload.summary?.trim() || '';
  if (!summary) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Summary is required.',
      },
      { status: 400 }
    );
  }

  const activity = await createActivityForTenant(tenantContext.tenantId, {
    activityType: payload.activityType?.trim() || 'note',
    summary,
    leadId: payload.leadId?.trim() || null,
    contactId: payload.contactId?.trim() || null,
  });

  if (!activity) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Activity create failed. Verify tenant-scoped lead/contact IDs if provided.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      tenantId: tenantContext.tenantId,
      activity,
    },
    { status: 201 }
  );
}
