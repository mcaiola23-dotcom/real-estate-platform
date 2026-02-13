import { createContactForTenant, listContactsByTenantId } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { buildPagination, parseContactListQuery } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

export async function GET(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const url = new URL(request.url);
  const query = parseContactListQuery(url.searchParams);
  const contacts = await listContactsByTenantId(tenantContext.tenantId, query);

  return NextResponse.json({
    ok: true,
    tenantId: tenantContext.tenantId,
    contacts,
    pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, contacts.length),
  });
}

export async function POST(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        fullName?: string;
        email?: string;
        phone?: string;
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

  const contact = await createContactForTenant(tenantContext.tenantId, {
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    source: 'crm_manual',
  });

  if (!contact) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Contact create failed. Provide at least one valid email or phone.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      tenantId: tenantContext.tenantId,
      contact,
    },
    { status: 201 }
  );
}
