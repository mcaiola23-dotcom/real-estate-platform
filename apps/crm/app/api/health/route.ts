import { listLeadsByTenantId, listContactsByTenantId, listActivitiesByTenantId } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../lib/tenant-route';

export async function GET(request: Request) {
  const { tenantContext } = await requireTenantContext(request);
  const tenantId = tenantContext?.tenantId ?? 'tenant_fairfield';

  let leadCount = -1;
  let contactCount = -1;
  let activityCount = -1;
  let error: string | null = null;

  try {
    const [leads, contacts, activities] = await Promise.all([
      listLeadsByTenantId(tenantId, { limit: 200 }),
      listContactsByTenantId(tenantId, { limit: 200 }),
      listActivitiesByTenantId(tenantId, { limit: 200 }),
    ]);
    leadCount = leads.length;
    contactCount = contacts.length;
    activityCount = activities.length;
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    ok: true,
    service: '@real-estate/crm',
    tenant: {
      tenantId,
      slug: tenantContext?.tenantSlug ?? '(unknown)',
      domain: tenantContext?.tenantDomain ?? '(unknown)',
      source: tenantContext?.source ?? '(unknown)',
    },
    env: {
      cwd: process.cwd(),
      databaseUrl: process.env.DATABASE_URL ? '(set)' : '(not set)',
      nodeEnv: process.env.NODE_ENV,
    },
    data: {
      leadCount,
      contactCount,
      activityCount,
      error,
    },
  });
}
