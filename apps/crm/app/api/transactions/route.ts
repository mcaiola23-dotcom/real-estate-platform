import type { TenantContext, TransactionStatus, TransactionSide } from '@real-estate/types';
import {
  listTransactionsForTenant,
  createTransactionForTenant,
} from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../lib/tenant-route';
import { parseTransactionListQuery } from '../lib/query-params';

const VALID_STATUSES: Set<TransactionStatus> = new Set([
  'under_contract', 'inspection', 'appraisal', 'title', 'closing', 'closed', 'fallen_through',
]);
const VALID_SIDES: Set<TransactionSide> = new Set(['buyer', 'seller', 'dual']);

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface TransactionsListDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listTransactionsForTenant: typeof listTransactionsForTenant;
}

interface TransactionsCreateDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  createTransactionForTenant: typeof createTransactionForTenant;
}

const defaultListDeps: TransactionsListDeps = {
  requireTenantContext,
  listTransactionsForTenant,
};

const defaultCreateDeps: TransactionsCreateDeps = {
  requireTenantContext,
  createTransactionForTenant,
};

export function createTransactionsGetHandler(deps: TransactionsListDeps = defaultListDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = parseTransactionListQuery(url.searchParams);
    const result = await deps.listTransactionsForTenant(tenantContext.tenantId, query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      transactions: result.transactions,
      pagination: result.pagination,
    });
  };
}

export function createTransactionsPostHandler(deps: TransactionsCreateDeps = defaultCreateDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const payload = await request.json().catch(() => null) as {
      propertyAddress?: string;
      side?: string;
      status?: string;
      leadId?: string | null;
      contactId?: string | null;
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

    const propertyAddress = payload.propertyAddress?.trim();
    if (!propertyAddress) {
      return NextResponse.json({ ok: false, error: 'propertyAddress is required.' }, { status: 400 });
    }

    const side = payload.side as TransactionSide;
    if (!side || !VALID_SIDES.has(side)) {
      return NextResponse.json({ ok: false, error: 'side must be buyer, seller, or dual.' }, { status: 400 });
    }

    const status = payload.status as TransactionStatus | undefined;
    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid transaction status.' }, { status: 400 });
    }

    const transaction = await deps.createTransactionForTenant(tenantContext.tenantId, {
      propertyAddress,
      side,
      status,
      leadId: payload.leadId,
      contactId: payload.contactId,
      salePrice: payload.salePrice,
      listPrice: payload.listPrice,
      closingDate: payload.closingDate,
      contractDate: payload.contractDate,
      inspectionDate: payload.inspectionDate,
      appraisalDate: payload.appraisalDate,
      titleDate: payload.titleDate,
      notes: payload.notes,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      transaction,
    }, { status: 201 });
  };
}

export const GET = createTransactionsGetHandler();
export const POST = createTransactionsPostHandler();
