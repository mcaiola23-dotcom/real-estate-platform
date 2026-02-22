import type { TenantContext } from '@real-estate/types';
import { listTransactionDocuments, addTransactionDocument } from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface DocumentsDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listTransactionDocuments: typeof listTransactionDocuments;
  addTransactionDocument: typeof addTransactionDocument;
}

const defaultDeps: DocumentsDeps = {
  requireTenantContext,
  listTransactionDocuments,
  addTransactionDocument,
};

export function createDocumentsGetHandler(deps: DocumentsDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const documents = await deps.listTransactionDocuments(tenantContext.tenantId, transactionId);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      documents,
    });
  };
}

export function createDocumentsPostHandler(deps: DocumentsDeps = defaultDeps) {
  return async function POST(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const payload = await request.json().catch(() => null) as {
      documentType?: string;
      fileName?: string;
      status?: string;
      notes?: string | null;
    } | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (!payload.documentType?.trim()) {
      return NextResponse.json({ ok: false, error: 'documentType is required.' }, { status: 400 });
    }
    if (!payload.fileName?.trim()) {
      return NextResponse.json({ ok: false, error: 'fileName is required.' }, { status: 400 });
    }

    const document = await deps.addTransactionDocument(tenantContext.tenantId, transactionId, {
      documentType: payload.documentType.trim(),
      fileName: payload.fileName.trim(),
      status: payload.status,
      notes: payload.notes,
    });

    if (!document) {
      return NextResponse.json({ ok: false, error: 'Transaction not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      document,
    }, { status: 201 });
  };
}

export const GET = createDocumentsGetHandler();
export const POST = createDocumentsPostHandler();
