import { getTwilioClient, getTwilioConfig } from './config';

export interface CallParams {
  to: string;
  /** If provided, Twilio will connect a two-leg call from the agent to the lead */
  agentPhone?: string;
}

export interface InitiatedCall {
  sid: string;
  status: string;
  to: string;
  from: string;
}

/**
 * Initiate a click-to-call via Twilio.
 * Two-leg call: Twilio calls the agent first, then bridges to the lead.
 */
export async function initiateCall(params: CallParams): Promise<InitiatedCall> {
  const client = getTwilioClient();
  const config = getTwilioConfig();
  if (!client || !config) {
    throw new Error('Twilio is not configured.');
  }

  const from = config.phoneNumber;
  const twiml = `<Response><Dial callerId="${from}">${params.to}</Dial></Response>`;

  // If agent phone provided, call agent first then bridge
  const callTo = params.agentPhone ?? params.to;

  const call = await client.calls.create({
    to: callTo,
    from,
    twiml,
  });

  return {
    sid: call.sid,
    status: call.status,
    to: call.toFormatted ?? call.to,
    from: call.fromFormatted ?? call.from,
  };
}
