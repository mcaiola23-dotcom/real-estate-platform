import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { resolveTenantFromHost, TENANT_HEADER_NAMES } from './app/lib/tenant/resolve-tenant';

export const proxy = clerkMiddleware((_auth, req: NextRequest) => {
  const tenantContext = resolveTenantFromHost(req.headers.get('host'));
  const requestHeaders = new Headers(req.headers);

  requestHeaders.set(TENANT_HEADER_NAMES.tenantId, tenantContext.tenantId);
  requestHeaders.set(TENANT_HEADER_NAMES.tenantSlug, tenantContext.tenantSlug);
  requestHeaders.set(TENANT_HEADER_NAMES.tenantDomain, tenantContext.tenantDomain);
  requestHeaders.set(TENANT_HEADER_NAMES.tenantResolution, tenantContext.source);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|brand/|visual/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
