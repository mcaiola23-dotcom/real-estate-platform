import { listLeadsByTenantId, createLeadForTenant } from '@real-estate/db/crm';
import type { CreateCrmLeadInput } from '@real-estate/db/crm';
import type { CrmLeadListQuery, TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination, parseLeadListQuery } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadsGetDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  parseLeadListQuery: (params: URLSearchParams) => CrmLeadListQuery;
  listLeadsByTenantId: typeof listLeadsByTenantId;
}

const defaultDeps: LeadsGetDeps = {
  requireTenantContext,
  parseLeadListQuery,
  listLeadsByTenantId,
};

export function createLeadsGetHandler(deps: LeadsGetDeps = defaultDeps) {
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
    const query = deps.parseLeadListQuery(url.searchParams);

    const leads = await deps.listLeadsByTenantId(tenantContext.tenantId, query);
    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      leads,
      pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, leads.length),
    });
  };
}

export const GET = createLeadsGetHandler();

export async function POST(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (!tenantContext) {
    return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
  }

  let body: CreateCrmLeadInput;
  try {
    body = (await request.json()) as CreateCrmLeadInput;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const lead = await createLeadForTenant(tenantContext.tenantId, body);
  if (!lead) {
    return NextResponse.json({ ok: false, error: 'Failed to create lead.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lead }, { status: 201 });
}
