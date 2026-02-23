import {
  createAdSpendForTenant,
  listAdSpendsByTenantId,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface AdSpendRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listAdSpendsByTenantId: typeof listAdSpendsByTenantId;
  createAdSpendForTenant: typeof createAdSpendForTenant;
}

const defaultDeps: AdSpendRouteDeps = {
  requireTenantContext,
  listAdSpendsByTenantId,
  createAdSpendForTenant,
};

export function createAdSpendGetHandler(deps: AdSpendRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const platform = url.searchParams.get('platform') || undefined;
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : 0;

    const adSpends = await deps.listAdSpendsByTenantId(tenantContext.tenantId, { platform, limit, offset });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      adSpends,
      pagination: buildPagination(limit, offset, adSpends.length),
    });
  };
}

export function createAdSpendPostHandler(deps: AdSpendRouteDeps = defaultDeps) {
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

    const platform = String(payload.platform || '').trim();
    if (!platform) {
      return NextResponse.json({ ok: false, error: 'platform is required.' }, { status: 400 });
    }

    const amount = Number(payload.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Valid amount is required.' }, { status: 400 });
    }

    const adSpend = await deps.createAdSpendForTenant(tenantContext.tenantId, {
      platform,
      amount,
      startDate: String(payload.startDate || ''),
      endDate: String(payload.endDate || ''),
      notes: payload.notes ? String(payload.notes).trim() : null,
    });

    if (!adSpend) {
      return NextResponse.json({ ok: false, error: 'Ad spend creation failed.' }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, adSpend },
      { status: 201 }
    );
  };
}

export const GET = createAdSpendGetHandler();
export const POST = createAdSpendPostHandler();
