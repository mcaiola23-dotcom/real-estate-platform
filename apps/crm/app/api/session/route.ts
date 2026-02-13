import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getTenantContextFromRequest } from '../../lib/tenant/resolve-tenant';

export async function GET(request: Request) {
  const { userId } = await auth();
  const tenantContext = await getTenantContextFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId,
    tenant: tenantContext,
  });
}
