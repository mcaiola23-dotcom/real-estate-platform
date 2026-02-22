import type { TenantContext } from '@real-estate/types';
import { updateTransactionParty } from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ transactionId: string; partyId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface PartyPatchDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  updateTransactionParty: typeof updateTransactionParty;
}

const defaultDeps: PartyPatchDeps = {
  requireTenantContext,
  updateTransactionParty,
};

export function createPartyPatchHandler(deps: PartyPatchDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { partyId } = await context.params;
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

    const updated = await deps.updateTransactionParty(tenantContext.tenantId, partyId, {
      role: payload.role,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Party not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      party: updated,
    });
  };
}

export const PATCH = createPartyPatchHandler();
