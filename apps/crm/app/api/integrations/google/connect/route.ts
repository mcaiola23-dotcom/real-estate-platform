import type { TenantContext } from '@real-estate/types';
import { generateAuthUrl } from '@real-estate/integrations/google';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GoogleConnectDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  generateAuthUrl: typeof generateAuthUrl;
}

const defaultDeps: GoogleConnectDeps = {
  requireTenantContext,
  generateAuthUrl,
};

export function createGoogleConnectGetHandler(deps: GoogleConnectDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    try {
      // Use tenantId as actorId in single-user-per-tenant context
      const actorId = tenantContext.tenantId;
      const authUrl = deps.generateAuthUrl(tenantContext.tenantId, actorId);

      return NextResponse.json({
        ok: true,
        authUrl,
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Failed to generate Google auth URL.' },
        { status: 500 }
      );
    }
  };
}

export const GET = createGoogleConnectGetHandler();
