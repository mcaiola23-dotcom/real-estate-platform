import type { TenantContext } from '@real-estate/types';
import { updateTransactionMilestone } from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ transactionId: string; milestoneId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface MilestonePatchDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  updateTransactionMilestone: typeof updateTransactionMilestone;
}

const defaultDeps: MilestonePatchDeps = {
  requireTenantContext,
  updateTransactionMilestone,
};

export function createMilestonePatchHandler(deps: MilestonePatchDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { milestoneId } = await context.params;
    const payload = await request.json().catch(() => null) as {
      scheduledAt?: string | null;
      completedAt?: string | null;
    } | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const updated = await deps.updateTransactionMilestone(tenantContext.tenantId, milestoneId, {
      scheduledAt: payload.scheduledAt,
      completedAt: payload.completedAt,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Milestone not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      milestone: updated,
    });
  };
}

export const PATCH = createMilestonePatchHandler();
