import type { TenantContext } from '@real-estate/types';
import { generateListingDescription } from '@real-estate/ai/crm';
import type { ListingDescriptionTone } from '@real-estate/ai/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ListingDescriptionDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  generateListingDescription: typeof generateListingDescription;
}

const defaultDeps: ListingDescriptionDeps = {
  requireTenantContext,
  generateListingDescription,
};

const VALID_TONES: ListingDescriptionTone[] = ['luxury', 'family-friendly', 'investment-focused', 'first-time-buyer'];

export function createListingDescriptionPostHandler(deps: ListingDescriptionDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      address?: string;
      propertyType?: string;
      beds?: number;
      baths?: number;
      sqft?: number;
      lotAcres?: number | null;
      price?: number | null;
      features?: string[];
      agentNotes?: string | null;
      tone?: string;
    } | null;

    if (!body?.address || !body.propertyType || !body.beds || !body.baths || !body.sqft) {
      return NextResponse.json(
        { ok: false, error: 'Required fields: address, propertyType, beds, baths, sqft.' },
        { status: 400 },
      );
    }

    const tone: ListingDescriptionTone = VALID_TONES.includes(body.tone as ListingDescriptionTone)
      ? (body.tone as ListingDescriptionTone)
      : 'luxury';

    const result = await deps.generateListingDescription(tenantContext.tenantId, {
      address: body.address,
      propertyType: body.propertyType,
      beds: body.beds,
      baths: body.baths,
      sqft: body.sqft,
      lotAcres: body.lotAcres ?? null,
      price: body.price ?? null,
      features: body.features ?? [],
      agentNotes: body.agentNotes ?? null,
      tone,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      result,
    });
  };
}

export const POST = createListingDescriptionPostHandler();
