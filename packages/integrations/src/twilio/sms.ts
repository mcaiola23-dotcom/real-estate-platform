import { getTwilioClient, getTwilioConfig } from './config';

export interface SmsParams {
  to: string;
  body: string;
}

export interface SentSms {
  sid: string;
  status: string;
  to: string;
  from: string;
  dateCreated: string;
}

export interface SmsMessage {
  sid: string;
  to: string;
  from: string;
  body: string;
  status: string;
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  dateCreated: string;
  dateSent: string | null;
}

/**
 * Send an SMS message via Twilio.
 */
export async function sendSms(params: SmsParams): Promise<SentSms> {
  const client = getTwilioClient();
  const config = getTwilioConfig();
  if (!client || !config) {
    throw new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
  }

  const message = await client.messages.create({
    to: params.to,
    from: config.phoneNumber,
    body: params.body,
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
    dateCreated: message.dateCreated?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * List recent SMS messages for a phone number (both sent and received).
 */
export async function listMessages(options: {
  phoneNumber?: string;
  limit?: number;
}): Promise<SmsMessage[]> {
  const client = getTwilioClient();
  if (!client) return [];

  const filters: Record<string, unknown> = {
    limit: options.limit ?? 20,
  };

  // Fetch sent + received in parallel when filtering by phone number
  if (options.phoneNumber) {
    const [sent, received] = await Promise.all([
      client.messages.list({ ...filters, to: options.phoneNumber }),
      client.messages.list({ ...filters, from: options.phoneNumber }),
    ]);

    const allMessages = [...sent, ...received]
      .sort((a, b) => {
        const da = a.dateCreated?.getTime() ?? 0;
        const db = b.dateCreated?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, options.limit ?? 20);

    return allMessages.map(mapMessage);
  }

  const messages = await client.messages.list(filters);
  return messages.map(mapMessage);
}

function mapMessage(msg: any): SmsMessage {
  return {
    sid: msg.sid,
    to: msg.to,
    from: msg.from,
    body: msg.body,
    status: msg.status,
    direction: msg.direction,
    dateCreated: msg.dateCreated?.toISOString() ?? '',
    dateSent: msg.dateSent?.toISOString() ?? null,
  };
}
