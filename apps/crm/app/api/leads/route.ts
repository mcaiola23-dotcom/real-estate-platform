import { listLeadsByTenantId } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { buildPagination, parseLeadListQuery } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

export async function GET(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const url = new URL(request.url);
  const query = parseLeadListQuery(url.searchParams);

  const leads = await listLeadsByTenantId(tenantContext.tenantId, query);
  return NextResponse.json({
    ok: true,
    tenantId: tenantContext.tenantId,
    leads,
    pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, leads.length),
  });
}
