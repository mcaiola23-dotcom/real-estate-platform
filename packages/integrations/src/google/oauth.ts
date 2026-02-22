import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
] as const;

export function createGoogleOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google OAuth env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(
  tenantId: string,
  actorId: string,
  scopes: readonly string[] = GOOGLE_SCOPES
): string {
  const client = createGoogleOAuthClient();
  const state = JSON.stringify({ tenantId, actorId });

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [...scopes],
    state,
  });
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  scopes: string[];
}> {
  const client = createGoogleOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Google OAuth token exchange did not return required tokens.');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    scopes: tokens.scope?.split(' ') ?? [],
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresAt: Date | null;
}> {
  const client = createGoogleOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Google OAuth token refresh did not return an access token.');
  }

  return {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}
