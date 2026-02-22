import type { TenantContext } from '@real-estate/types';
import { extractInsights } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ExtractInsightsDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  extractInsights: typeof extractInsights;
}

const defaultDeps: ExtractInsightsDeps = {
  requireTenantContext,
  extractInsights,
};

export function createExtractInsightsPostHandler(deps: ExtractInsightsDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      text?: string;
      leadId?: string;
      leadContext?: string;
    } | null;

    if (!body?.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'text is required.' },
        { status: 400 },
      );
    }

    const result = await deps.extractInsights(
      tenantContext.tenantId,
      body.text.trim(),
      body.leadId?.trim() ?? null,
      body.leadContext?.trim() ?? null,
    );

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      result,
    });
  };
}

export const POST = createExtractInsightsPostHandler();
