import { listMessages } from '@real-estate/integrations/twilio';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../../../lib/tenant-route';

export async function GET(request: Request) {
  const { tenantContext, unauthorizedResponse } = await requireTenantContext(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  if (!tenantContext) {
    return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('phoneNumber');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);

  if (!phoneNumber) {
    return NextResponse.json(
      { ok: false, error: 'phoneNumber query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const messages = await listMessages({ phoneNumber, limit });
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    console.error('[Twilio SMS History] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch SMS history.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
