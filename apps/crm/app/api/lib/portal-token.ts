import { createHmac } from 'crypto';

const SECRET = process.env.PORTAL_SECRET || 'dev-portal-secret-key';

export interface PortalTokenPayload {
  tenantId: string;
  leadId: string;
  exp: number;
}

/**
 * Generate an HMAC-signed token encoding a JSON payload as base64url.
 * Format: `<base64url-data>.<base64url-signature>`
 */
export function generatePortalToken(payload: PortalTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Verify and decode an HMAC-signed portal token.
 * Returns the decoded payload if valid and not expired, or `null` otherwise.
 */
export function verifyPortalToken(token: string): PortalTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, sig] = parts;
  if (!data || !sig) return null;

  const expected = createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as PortalTokenPayload;
    if (!payload.tenantId || !payload.leadId) return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
