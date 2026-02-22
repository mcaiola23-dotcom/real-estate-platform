import type { TenantContext } from '@real-estate/types';
import { deleteGoogleTokens } from '@real-estate/integrations/google';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface GoogleDisconnectDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  deleteGoogleTokens: typeof deleteGoogleTokens;
}

const defaultDeps: GoogleDisconnectDeps = {
  requireTenantContext,
  deleteGoogleTokens,
};

export function createGoogleDisconnectPostHandler(deps: GoogleDisconnectDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    try {
      const actorId = tenantContext.tenantId;
      await deps.deleteGoogleTokens(tenantContext.tenantId, actorId);

      return NextResponse.json({
        ok: true,
        message: 'Google account disconnected.',
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Failed to disconnect Google account.' },
        { status: 500 }
      );
    }
  };
}

export const POST = createGoogleDisconnectPostHandler();
