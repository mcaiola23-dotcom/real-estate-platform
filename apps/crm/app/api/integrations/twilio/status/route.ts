import { NextResponse } from 'next/server';
import { getTwilioConfig } from '@real-estate/integrations/twilio';

export async function GET() {
  const config = getTwilioConfig();

  return NextResponse.json({
    ok: true,
    connected: config !== null,
    phoneNumber: config?.phoneNumber ?? null,
  });
}
