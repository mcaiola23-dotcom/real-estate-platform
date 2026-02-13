import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { resolveTenantFromHost, TENANT_HEADER_NAMES } from './app/lib/tenant/resolve-tenant';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/health']);

export const proxy = clerkMiddleware(async (auth, req: NextRequest) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const tenantContext = await resolveTenantFromHost(req.headers.get('host'));
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
