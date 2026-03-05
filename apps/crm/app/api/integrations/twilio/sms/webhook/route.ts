import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@real-estate/integrations/twilio';

/**
 * Twilio inbound SMS webhook.
 * Validates the request signature and logs the inbound message.
 * In production, this would match the From number to a contact and create an Activity.
 */
export async function POST(request: Request) {
  const url = request.url;
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  const signature = request.headers.get('x-twilio-signature') ?? '';

  if (!validateWebhookSignature(url, params, signature)) {
    console.warn('[Twilio Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const from = params.From ?? '';
  const body = params.Body ?? '';
  const messageSid = params.MessageSid ?? '';

  console.log(`[Twilio Webhook] Inbound SMS from ${from}: ${body.slice(0, 100)}`);

  // TODO: Match `from` to a CrmContact.phone, then log an 'sms_received' activity.
  // This requires tenant resolution from the phone number, which needs a lookup table.
  // For now, just acknowledge receipt.

  // Return TwiML empty response (no auto-reply)
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    }
  );
}
