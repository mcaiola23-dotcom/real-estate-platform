import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';
import {
  upsertIntegrationToken,
  getIntegrationToken,
  deleteIntegrationToken,
} from '@real-estate/db/integrations';
import { createGoogleOAuthClient, refreshAccessToken } from './oauth';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'INTEGRATION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(':');

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error('Invalid encrypted token format.');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export async function storeGoogleTokens(
  tenantId: string,
  actorId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date | null;
    scopes: string[];
  }
): Promise<void> {
  const accessTokenEnc = encryptToken(tokens.accessToken);
  const refreshTokenEnc = encryptToken(tokens.refreshToken);

  await upsertIntegrationToken(tenantId, actorId, 'google', {
    accessTokenEnc,
    refreshTokenEnc,
    scopesJson: JSON.stringify(tokens.scopes),
    expiresAt: tokens.expiresAt,
  });
}

export async function getGoogleTokens(
  tenantId: string,
  actorId: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  scopes: string[];
  expiresAt: Date | null;
} | null> {
  const record = await getIntegrationToken(tenantId, actorId, 'google');
  if (!record) return null;

  return {
    accessToken: decryptToken(record.accessTokenEnc),
    refreshToken: decryptToken(record.refreshTokenEnc),
    scopes: JSON.parse(record.scopesJson) as string[],
    expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
  };
}

export async function deleteGoogleTokens(
  tenantId: string,
  actorId: string
): Promise<void> {
  const tokens = await getGoogleTokens(tenantId, actorId);
  if (tokens) {
    // Attempt to revoke at Google (best effort)
    try {
      const client = createGoogleOAuthClient();
      client.setCredentials({ access_token: tokens.accessToken });
      await client.revokeToken(tokens.accessToken);
    } catch {
      // Revocation failure is non-fatal — token will expire naturally
    }
  }
  await deleteIntegrationToken(tenantId, actorId, 'google');
}

/**
 * Returns a ready-to-use OAuth2Client with valid credentials.
 * Transparently refreshes the access token if expired.
 * Returns null if no tokens are stored.
 */
export async function getAuthenticatedClient(
  tenantId: string,
  actorId: string
): Promise<OAuth2Client | null> {
  const tokens = await getGoogleTokens(tenantId, actorId);
  if (!tokens) return null;

  const client = createGoogleOAuthClient();

  // Check if access token is expired (with 5-minute buffer)
  const isExpired =
    tokens.expiresAt && tokens.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    const refreshed = await refreshAccessToken(tokens.refreshToken);
    client.setCredentials({
      access_token: refreshed.accessToken,
      refresh_token: tokens.refreshToken,
    });

    // Persist the refreshed access token
    await storeGoogleTokens(tenantId, actorId, {
      accessToken: refreshed.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: refreshed.expiresAt,
      scopes: tokens.scopes,
    });
  } else {
    client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  return client;
}
