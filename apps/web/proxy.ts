import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { getWebsiteRuntimeEnvError } from './app/lib/runtime-env';
import { resolveTenantFromHost, TENANT_HEADER_NAMES } from './app/lib/tenant/resolve-tenant';

const BASE_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;

const BASE_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io",
  "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.sanity.io",
  "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
].join('; ');

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('Content-Security-Policy', BASE_CONTENT_SECURITY_POLICY);
  }

  return response;
}

function buildRuntimeEnvErrorResponse(request: NextRequest): NextResponse {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const body = isApiRoute
    ? JSON.stringify({ ok: false, error: 'Server configuration error.' })
    : 'Server configuration error. Check required environment variables.';
  const response = new NextResponse(body, {
    status: 500,
    headers: {
      'Content-Type': isApiRoute ? 'application/json' : 'text/plain; charset=utf-8',
    },
  });
  return applySecurityHeaders(response);
}

export const proxy = clerkMiddleware(async (_auth, req: NextRequest) => {
  const runtimeEnvError = getWebsiteRuntimeEnvError();
  if (runtimeEnvError) {
    console.error('apps/web runtime configuration error:', runtimeEnvError);
    return buildRuntimeEnvErrorResponse(req);
  }

  const tenantContext = await resolveTenantFromHost(req.headers.get('host'));
  const requestHeaders = new Headers(req.headers);

  requestHeaders.set(TENANT_HEADER_NAMES.tenantId, tenantContext.tenantId);
  requestHeaders.set(TENANT_HEADER_NAMES.tenantSlug, tenantContext.tenantSlug);
  requestHeaders.set(TENANT_HEADER_NAMES.tenantDomain, tenantContext.tenantDomain);
  requestHeaders.set(TENANT_HEADER_NAMES.tenantResolution, tenantContext.source);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return applySecurityHeaders(response);
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
