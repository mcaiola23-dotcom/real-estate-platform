import type { TenantContext, TransactionStatus, TransactionSide } from '@real-estate/types';
import {
  getTransactionByIdForTenant,
  updateTransactionForTenant,
} from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

const VALID_STATUSES: Set<TransactionStatus> = new Set([
  'under_contract', 'inspection', 'appraisal', 'title', 'closing', 'closed', 'fallen_through',
]);
const VALID_SIDES: Set<TransactionSide> = new Set(['buyer', 'seller', 'dual']);

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface TransactionDetailDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getTransactionByIdForTenant: typeof getTransactionByIdForTenant;
  updateTransactionForTenant: typeof updateTransactionForTenant;
}

const defaultDeps: TransactionDetailDeps = {
  requireTenantContext,
  getTransactionByIdForTenant,
  updateTransactionForTenant,
};

export function createTransactionGetHandler(deps: TransactionDetailDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const transaction = await deps.getTransactionByIdForTenant(tenantContext.tenantId, transactionId);
    if (!transaction) {
      return NextResponse.json({ ok: false, error: 'Transaction not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      transaction,
    });
  };
}

export function createTransactionPatchHandler(deps: TransactionDetailDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const payload = await request.json().catch(() => null) as {
      propertyAddress?: string;
      status?: string;
      side?: string;
      salePrice?: number | null;
      listPrice?: number | null;
      closingDate?: string | null;
      contractDate?: string | null;
      inspectionDate?: string | null;
      appraisalDate?: string | null;
      titleDate?: string | null;
      notes?: string | null;
    } | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (payload.status && !VALID_STATUSES.has(payload.status as TransactionStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid transaction status.' }, { status: 400 });
    }
    if (payload.side && !VALID_SIDES.has(payload.side as TransactionSide)) {
      return NextResponse.json({ ok: false, error: 'Invalid transaction side.' }, { status: 400 });
    }

    const updated = await deps.updateTransactionForTenant(tenantContext.tenantId, transactionId, {
      propertyAddress: payload.propertyAddress,
      status: payload.status as TransactionStatus | undefined,
      side: payload.side as TransactionSide | undefined,
      salePrice: payload.salePrice,
      listPrice: payload.listPrice,
      closingDate: payload.closingDate,
      contractDate: payload.contractDate,
      inspectionDate: payload.inspectionDate,
      appraisalDate: payload.appraisalDate,
      titleDate: payload.titleDate,
      notes: payload.notes,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Transaction not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      transaction: updated,
    });
  };
}

export const GET = createTransactionGetHandler();
export const PATCH = createTransactionPatchHandler();
