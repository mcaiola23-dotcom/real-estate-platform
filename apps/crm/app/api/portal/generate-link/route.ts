import type { TenantContext } from '@real-estate/types';
import { getLeadByIdForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';
import { generatePortalToken } from '../../lib/portal-token';

// ---------------------------------------------------------------------------
// Dependency injection types
// ---------------------------------------------------------------------------

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GenerateLinkDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  generatePortalToken: typeof generatePortalToken;
}

const defaultDeps: GenerateLinkDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  generatePortalToken,
};

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createGenerateLinkPostHandler(deps: GenerateLinkDeps = defaultDeps) {
  return async function POST(request: Request) {
    // Require authenticated tenant context
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json(
        { ok: false, error: 'Tenant resolution failed.' },
        { status: 401 }
      );
    }

    // Parse request body
    const payload = (await request.json().catch(() => null)) as {
      leadId?: string;
    } | null;

    if (!payload?.leadId) {
      return NextResponse.json(
        { ok: false, error: 'leadId is required.' },
        { status: 400 }
      );
    }

    // Verify lead exists and belongs to tenant
    const lead = await deps.getLeadByIdForTenant(tenantContext.tenantId, payload.leadId);
    if (!lead) {
      return NextResponse.json(
        { ok: false, error: 'Lead not found.' },
        { status: 404 }
      );
    }

    // Generate signed token with 7-day expiry
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const token = deps.generatePortalToken({
      tenantId: tenantContext.tenantId,
      leadId: payload.leadId,
      exp: Date.now() + SEVEN_DAYS_MS,
    });

    return NextResponse.json({
      ok: true,
      portalUrl: `/portal/${token}`,
      expiresIn: '7 days',
    });
  };
}

export const POST = createGenerateLinkPostHandler();
