import {
  createCommissionForTenant,
  listCommissionsByTenantId,
  getCommissionSettingForTenant,
  upsertCommissionSettingForTenant,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface CommissionsRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listCommissionsByTenantId: typeof listCommissionsByTenantId;
  createCommissionForTenant: typeof createCommissionForTenant;
  getCommissionSettingForTenant: typeof getCommissionSettingForTenant;
  upsertCommissionSettingForTenant: typeof upsertCommissionSettingForTenant;
}

const defaultDeps: CommissionsRouteDeps = {
  requireTenantContext,
  listCommissionsByTenantId,
  createCommissionForTenant,
  getCommissionSettingForTenant,
  upsertCommissionSettingForTenant,
};

export function createCommissionsGetHandler(deps: CommissionsRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId') || undefined;
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : 0;

    const [commissions, settings] = await Promise.all([
      deps.listCommissionsByTenantId(tenantContext.tenantId, { transactionId, limit, offset }),
      deps.getCommissionSettingForTenant(tenantContext.tenantId),
    ]);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      commissions,
      settings,
      pagination: buildPagination(limit, offset, commissions.length),
    });
  };
}

export function createCommissionsPostHandler(deps: CommissionsRouteDeps = defaultDeps) {
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

    // Handle settings update
    if (payload.action === 'update_settings') {
      const setting = await deps.upsertCommissionSettingForTenant(tenantContext.tenantId, {
        defaultCommPct: payload.defaultCommPct !== undefined ? Number(payload.defaultCommPct) : undefined,
        brokerageSplitPct: payload.brokerageSplitPct !== undefined ? Number(payload.brokerageSplitPct) : undefined,
        marketingFee: payload.marketingFee !== undefined ? Number(payload.marketingFee) : undefined,
        referralFee: payload.referralFee !== undefined ? Number(payload.referralFee) : undefined,
      });

      if (!setting) {
        return NextResponse.json({ ok: false, error: 'Settings update failed.' }, { status: 400 });
      }

      return NextResponse.json({ ok: true, tenantId: tenantContext.tenantId, settings: setting });
    }

    // Create commission
    const transactionId = String(payload.transactionId || '').trim();
    if (!transactionId) {
      return NextResponse.json({ ok: false, error: 'transactionId is required.' }, { status: 400 });
    }

    const salePrice = Number(payload.salePrice);
    if (!salePrice || salePrice <= 0) {
      return NextResponse.json({ ok: false, error: 'Valid salePrice is required.' }, { status: 400 });
    }

    const commission = await deps.createCommissionForTenant(tenantContext.tenantId, {
      transactionId,
      leadId: payload.leadId ? String(payload.leadId) : null,
      salePrice,
      commPct: Number(payload.commPct) || 3.0,
      brokerageSplitPct: Number(payload.brokerageSplitPct) || 70.0,
      marketingFees: payload.marketingFees ? Number(payload.marketingFees) : 0,
      referralFees: payload.referralFees ? Number(payload.referralFees) : 0,
      notes: payload.notes ? String(payload.notes).trim() : null,
    });

    if (!commission) {
      return NextResponse.json(
        { ok: false, error: 'Commission creation failed. Verify tenant-scoped IDs.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, commission },
      { status: 201 }
    );
  };
}

export const GET = createCommissionsGetHandler();
export const POST = createCommissionsPostHandler();
