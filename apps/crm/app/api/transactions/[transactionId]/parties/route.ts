import type { TenantContext } from '@real-estate/types';
import { listTransactionParties, addTransactionParty } from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface PartiesDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listTransactionParties: typeof listTransactionParties;
  addTransactionParty: typeof addTransactionParty;
}

const defaultDeps: PartiesDeps = {
  requireTenantContext,
  listTransactionParties,
  addTransactionParty,
};

export function createPartiesGetHandler(deps: PartiesDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const parties = await deps.listTransactionParties(tenantContext.tenantId, transactionId);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      parties,
    });
  };
}

export function createPartiesPostHandler(deps: PartiesDeps = defaultDeps) {
  return async function POST(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const payload = await request.json().catch(() => null) as {
      role?: string;
      name?: string;
      email?: string | null;
      phone?: string | null;
      company?: string | null;
    } | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const name = payload.name?.trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required.' }, { status: 400 });
    }
    if (!payload.role?.trim()) {
      return NextResponse.json({ ok: false, error: 'role is required.' }, { status: 400 });
    }

    const party = await deps.addTransactionParty(tenantContext.tenantId, transactionId, {
      role: payload.role.trim(),
      name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
    });

    if (!party) {
      return NextResponse.json({ ok: false, error: 'Transaction not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      party,
    }, { status: 201 });
  };
}

export const GET = createPartiesGetHandler();
export const POST = createPartiesPostHandler();
