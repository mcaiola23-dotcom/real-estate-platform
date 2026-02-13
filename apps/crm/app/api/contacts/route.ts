import { createContactForTenant, listContactsByTenantId } from '@real-estate/db/crm';
import type { CrmContactListQuery, TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination, parseContactListQuery } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ContactsRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  parseContactListQuery: (params: URLSearchParams) => CrmContactListQuery;
  listContactsByTenantId: typeof listContactsByTenantId;
  createContactForTenant: typeof createContactForTenant;
}

const defaultDeps: ContactsRouteDeps = {
  requireTenantContext,
  parseContactListQuery,
  listContactsByTenantId,
  createContactForTenant,
};

export function createContactsGetHandler(deps: ContactsRouteDeps = defaultDeps) {
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
    const query = deps.parseContactListQuery(url.searchParams);
    const contacts = await deps.listContactsByTenantId(tenantContext.tenantId, query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      contacts,
      pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, contacts.length),
    });
  };
}

export function createContactsPostHandler(deps: ContactsRouteDeps = defaultDeps) {
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

    const contact = await deps.createContactForTenant(tenantContext.tenantId, {
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
  };
}

export const GET = createContactsGetHandler();
export const POST = createContactsPostHandler();
