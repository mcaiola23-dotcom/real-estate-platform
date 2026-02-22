import type { TenantContext } from '@real-estate/types';
import { getIntegrationToken } from '@real-estate/db/integrations';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GoogleStatusDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getIntegrationToken: typeof getIntegrationToken;
}

const defaultDeps: GoogleStatusDeps = {
  requireTenantContext,
  getIntegrationToken,
};

export function createGoogleStatusGetHandler(deps: GoogleStatusDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const actorId = tenantContext.tenantId;
    const token = await deps.getIntegrationToken(tenantContext.tenantId, actorId, 'google');

    if (!token) {
      return NextResponse.json({
        ok: true,
        connected: false,
        provider: 'google',
      });
    }

    const scopes: string[] = JSON.parse(token.scopesJson);
    const hasCalendar = scopes.some((s) => s.includes('calendar'));
    const hasGmail = scopes.some((s) => s.includes('gmail'));

    return NextResponse.json({
      ok: true,
      connected: true,
      provider: 'google',
      scopes,
      capabilities: {
        calendar: hasCalendar,
        gmail: hasGmail,
      },
      connectedAt: token.createdAt,
      updatedAt: token.updatedAt,
    });
  };
}

export const GET = createGoogleStatusGetHandler();
