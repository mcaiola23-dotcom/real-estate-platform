import { createActivityForTenant, listActivitiesByTenantId } from '@real-estate/db/crm';
import type { CrmActivityListQuery, TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination, parseActivityListQuery } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ActivitiesRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  parseActivityListQuery: (params: URLSearchParams) => CrmActivityListQuery;
  listActivitiesByTenantId: typeof listActivitiesByTenantId;
  createActivityForTenant: typeof createActivityForTenant;
}

const defaultDeps: ActivitiesRouteDeps = {
  requireTenantContext,
  parseActivityListQuery,
  listActivitiesByTenantId,
  createActivityForTenant,
};

export function createActivitiesGetHandler(deps: ActivitiesRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    if (!tenantContext) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tenant resolution failed.',
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const query = deps.parseActivityListQuery(url.searchParams);

    const activities = await deps.listActivitiesByTenantId(tenantContext.tenantId, query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      activities,
      pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, activities.length),
    });
  };
}

export function createActivitiesPostHandler(deps: ActivitiesRouteDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    if (!tenantContext) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tenant resolution failed.',
        },
        { status: 401 }
      );
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

    const activity = await deps.createActivityForTenant(tenantContext.tenantId, {
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
  };
}

export const GET = createActivitiesGetHandler();
export const POST = createActivitiesPostHandler();
