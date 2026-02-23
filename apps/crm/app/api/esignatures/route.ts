import {
  createESignatureRequestForTenant,
  listESignatureRequestsByTenantId,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ESignaturesRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listESignatureRequestsByTenantId: typeof listESignatureRequestsByTenantId;
  createESignatureRequestForTenant: typeof createESignatureRequestForTenant;
}

const defaultDeps: ESignaturesRouteDeps = {
  requireTenantContext,
  listESignatureRequestsByTenantId,
  createESignatureRequestForTenant,
};

export function createESignaturesGetHandler(deps: ESignaturesRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = {
      transactionId: url.searchParams.get('transactionId') || undefined,
      status: url.searchParams.get('status') || undefined,
      limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : undefined,
    };

    const esignatures = await deps.listESignatureRequestsByTenantId(tenantContext.tenantId, query);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      esignatures,
      pagination: buildPagination(query.limit ?? 50, query.offset ?? 0, esignatures.length),
    });
  };
}

export function createESignaturesPostHandler(deps: ESignaturesRouteDeps = defaultDeps) {
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

    const documentName = String(payload.documentName || '').trim();
    const recipientEmail = String(payload.recipientEmail || '').trim();

    if (!documentName) {
      return NextResponse.json({ ok: false, error: 'documentName is required.' }, { status: 400 });
    }
    if (!recipientEmail) {
      return NextResponse.json({ ok: false, error: 'recipientEmail is required.' }, { status: 400 });
    }

    const esignature = await deps.createESignatureRequestForTenant(tenantContext.tenantId, {
      documentName,
      recipientEmail,
      transactionId: payload.transactionId ? String(payload.transactionId) : null,
      status: payload.status ? String(payload.status) : 'pending',
    });

    if (!esignature) {
      return NextResponse.json(
        { ok: false, error: 'E-signature request creation failed. Check input and verify tenant-scoped IDs.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, esignature },
      { status: 201 }
    );
  };
}

export const GET = createESignaturesGetHandler();
export const POST = createESignaturesPostHandler();
