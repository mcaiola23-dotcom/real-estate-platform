import type { TenantContext } from '@real-estate/types';
import { updateTransactionDocument } from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ transactionId: string; docId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface DocumentPatchDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  updateTransactionDocument: typeof updateTransactionDocument;
}

const defaultDeps: DocumentPatchDeps = {
  requireTenantContext,
  updateTransactionDocument,
};

export function createDocumentPatchHandler(deps: DocumentPatchDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { docId } = await context.params;
    const payload = await request.json().catch(() => null) as {
      status?: string;
      notes?: string | null;
      fileName?: string;
    } | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const document = await deps.updateTransactionDocument(tenantContext.tenantId, docId, {
      status: payload.status,
      notes: payload.notes,
      fileName: payload.fileName,
    });

    if (!document) {
      return NextResponse.json({ ok: false, error: 'Document not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      document,
    });
  };
}

export const PATCH = createDocumentPatchHandler();
