import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private windows: Map<string, RateLimitEntry> = new Map();
  private lastPruneAt = 0;

  check(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    this.pruneIfNeeded(now);
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt) {
      const nextResetAt = now + windowMs;
      this.windows.set(key, { count: 1, resetAt: nextResetAt });
      return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    }

    entry.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    if (entry.count > maxRequests) {
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds };
  }

  private pruneIfNeeded(now: number): void {
    if (now - this.lastPruneAt < 60_000) {
      return;
    }
    this.lastPruneAt = now;
    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

const MAX_IP_LENGTH = 64;

export interface WebsiteApiGuardOptions {
  routeId: string;
  maxRequests: number;
  windowMs: number;
  maxBodyBytes: number;
  allowMissingOrigin?: boolean;
}

function getHeaderValue(headers: Headers, names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value) {
      return value;
    }
  }
  return null;
}

function getClientIpAddress(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim().slice(0, MAX_IP_LENGTH);
  }

  const directIp =
    getHeaderValue(request.headers, ['x-real-ip', 'cf-connecting-ip', 'x-client-ip']) ?? 'unknown';
  return directIp.trim().slice(0, MAX_IP_LENGTH) || 'unknown';
}

function parseAllowedOriginsEnv(): Set<string> {
  const raw = process.env.WEB_API_ALLOWED_ORIGINS;
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
}

const allowedOrigins = parseAllowedOriginsEnv();

function hasAllowedOrigin(request: Request, allowMissingOrigin = true): boolean {
  const originHeader = request.headers.get('origin');
  if (!originHeader) {
    return allowMissingOrigin;
  }

  let originHost: string;
  let originValue: string;
  try {
    const originUrl = new URL(originHeader);
    originHost = originUrl.host;
    originValue = originUrl.origin;
  } catch {
    return false;
  }

  const requestHost = getHeaderValue(request.headers, ['x-forwarded-host', 'host']);
  if (requestHost && requestHost.toLowerCase() === originHost.toLowerCase()) {
    return true;
  }

  return allowedOrigins.has(originValue);
}

function parseContentLength(request: Request): number | null {
  const contentLengthHeader = request.headers.get('content-length');
  if (!contentLengthHeader) {
    return null;
  }
  const parsed = Number.parseInt(contentLengthHeader, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function enforceWebsiteApiGuard(
  request: Request,
  options: WebsiteApiGuardOptions
): NextResponse | null {
  if (!hasAllowedOrigin(request, options.allowMissingOrigin ?? true)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Origin not allowed.',
      },
      { status: 403 }
    );
  }

  const contentLength = parseContentLength(request);
  if (contentLength !== null && contentLength > options.maxBodyBytes) {
    return NextResponse.json(
      {
        ok: false,
        error: `Request payload exceeds ${options.maxBodyBytes} bytes.`,
      },
      { status: 413 }
    );
  }

  const ipAddress = getClientIpAddress(request);
  const key = `${options.routeId}:${ipAddress}`;
  const rateLimitResult = rateLimiter.check(key, options.maxRequests, options.windowMs);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Too many requests. Please retry shortly.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      }
    );
  }

  return null;
}

type JsonBodyResult = { ok: true; body: unknown } | { ok: false; response: NextResponse };

export async function readJsonBodyWithLimit(request: Request, maxBodyBytes: number): Promise<JsonBodyResult> {
  const rawBody = await request.text();
  const byteLength = new TextEncoder().encode(rawBody).length;
  if (byteLength > maxBodyBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: `Request payload exceeds ${maxBodyBytes} bytes.`,
        },
        { status: 413 }
      ),
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'Request body is required.',
        },
        { status: 400 }
      ),
    };
  }

  try {
    return {
      ok: true,
      body: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON payload.',
        },
        { status: 400 }
      ),
    };
  }
}

const BOT_TOKEN_MIN_LENGTH = 12;

function isBotTokenRequired(): boolean {
  return process.env.WEB_API_REQUIRE_BOT_TOKEN === 'true';
}

function extractBotToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (!('botToken' in payload)) {
    return null;
  }
  const token = payload.botToken;
  return typeof token === 'string' ? token : null;
}

export function validateBotTokenIfRequired(payload: unknown): NextResponse | null {
  if (!isBotTokenRequired()) {
    return null;
  }

  const token = extractBotToken(payload);
  if (!token || token.trim().length < BOT_TOKEN_MIN_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Bot validation failed.',
      },
      { status: 400 }
    );
  }

  // Hook point for a future Turnstile/reCAPTCHA/hCaptcha server-side verification request.
  return null;
}

export function maskEmail(value: string): string {
  const [localPart, domainPart] = value.split('@');
  if (!localPart || !domainPart) {
    return '[redacted]';
  }
  const visiblePrefix = localPart.slice(0, 1);
  return `${visiblePrefix}***@${domainPart}`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) {
    return '[redacted]';
  }
  return `***-***-${digits.slice(-4)}`;
}
