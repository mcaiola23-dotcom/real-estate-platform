import type { TenantContext } from '@real-estate/types';
import { listTransactionMilestones, addTransactionMilestone } from '@real-estate/db/transactions';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ transactionId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface MilestonesDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listTransactionMilestones: typeof listTransactionMilestones;
  addTransactionMilestone: typeof addTransactionMilestone;
}

const defaultDeps: MilestonesDeps = {
  requireTenantContext,
  listTransactionMilestones,
  addTransactionMilestone,
};

export function createMilestonesGetHandler(deps: MilestonesDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const milestones = await deps.listTransactionMilestones(tenantContext.tenantId, transactionId);

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      milestones,
    });
  };
}

export function createMilestonesPostHandler(deps: MilestonesDeps = defaultDeps) {
  return async function POST(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const payload = await request.json().catch(() => null) as {
      milestoneType?: string;
      scheduledAt?: string | null;
      completedAt?: string | null;
    } | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (!payload.milestoneType?.trim()) {
      return NextResponse.json({ ok: false, error: 'milestoneType is required.' }, { status: 400 });
    }

    const milestone = await deps.addTransactionMilestone(tenantContext.tenantId, transactionId, {
      milestoneType: payload.milestoneType.trim(),
      scheduledAt: payload.scheduledAt,
      completedAt: payload.completedAt,
    });

    if (!milestone) {
      return NextResponse.json({ ok: false, error: 'Transaction not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      milestone,
    }, { status: 201 });
  };
}

export const GET = createMilestonesGetHandler();
export const POST = createMilestonesPostHandler();
