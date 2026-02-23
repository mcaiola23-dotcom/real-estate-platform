import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { isDevAuthBypassEnabled } from '../../lib/auth/mode';
import { getTenantContextFromRequest } from '../../lib/tenant/resolve-tenant';

export async function requireTenantContext(request: Request) {
  if (isDevAuthBypassEnabled()) {
    const tenantContext = await getTenantContextFromRequest(request);
    return {
      tenantContext,
      unauthorizedResponse: null,
    };
  }

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

// ---------------------------------------------------------------------------
// In-memory rate limiter
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Usage:
 *   if (!rateLimiter.check(key, 60, 60_000)) {
 *     return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
 *   }
 */
export class RateLimiter {
  private windows: Map<string, RateLimitEntry> = new Map();

  /**
   * Check whether the request identified by `key` is within the rate limit.
   *
   * @param key         Unique identifier for the caller (e.g. tenantId, userId, IP).
   * @param maxRequests Maximum number of requests allowed within the window.
   * @param windowMs    Duration of the rate-limit window in milliseconds.
   * @returns `true` if the request is allowed, `false` if rate-limited.
   */
  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.windows.get(key);

    // No existing window or window has expired — start a fresh window.
    if (!entry || now >= entry.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    // Within window — increment and check.
    entry.count += 1;
    if (entry.count > maxRequests) {
      return false;
    }
    return true;
  }

  /** Remove expired entries to prevent unbounded memory growth. */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}

/** Singleton rate limiter instance shared across all CRM API routes. */
export const rateLimiter = new RateLimiter();
