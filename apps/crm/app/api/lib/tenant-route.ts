import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getTenantContextFromRequest } from '../../lib/tenant/resolve-tenant';

export async function requireTenantContext(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return {
      tenantContext: null,
      unauthorizedResponse: NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      ),
    };
  }

  const tenantContext = await getTenantContextFromRequest(request);
  return {
    tenantContext,
    unauthorizedResponse: null,
  };
}
