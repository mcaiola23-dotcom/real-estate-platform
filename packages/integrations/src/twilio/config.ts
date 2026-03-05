import Twilio from 'twilio';

let cachedClient: ReturnType<typeof Twilio> | null = null;

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

/**
 * Read Twilio configuration from environment variables.
 * Returns null if any required variable is missing.
 */
export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN; // secret-scan:allow (env var read, not a literal)
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) return null;
  if (accountSid.startsWith('your_') || authToken.startsWith('your_')) return null;

  return { accountSid, authToken, phoneNumber };
}

/**
 * Get a Twilio REST client (cached per process).
 */
export function getTwilioClient(): ReturnType<typeof Twilio> | null {
  if (cachedClient) return cachedClient;

  const config = getTwilioConfig();
  if (!config) return null;

  cachedClient = Twilio(config.accountSid, config.authToken);
  return cachedClient;
}

/**
 * Validate a Twilio webhook request signature.
 */
export function validateWebhookSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN; // secret-scan:allow (env var read, not a literal)
  if (!authToken) return false;

  return Twilio.validateRequest(authToken, signature, url, params);
}
