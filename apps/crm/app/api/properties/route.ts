import type { ListingSortField, ListingSortOrder, ListingStatus, PropertyType } from '@real-estate/types/listings';
import { NextResponse } from 'next/server';

import { searchCrmListings } from '../../lib/data/listings-provider';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: { tenantId: string } | null;
  unauthorizedResponse: Response | null;
}

interface PropertiesGetDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  searchCrmListings: typeof searchCrmListings;
}

const defaultDeps: PropertiesGetDeps = {
  requireTenantContext,
  searchCrmListings,
};

export function createPropertiesGetHandler(deps: PropertiesGetDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? undefined;
    const sortField = (url.searchParams.get('sortField') ?? 'listedAt') as ListingSortField;
    const sortOrder = (url.searchParams.get('sortOrder') ?? 'desc') as ListingSortOrder;
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '12', 10) || 12));

    // Parse filter params
    const statusParam = url.searchParams.get('status');
    const propertyTypesParam = url.searchParams.get('propertyTypes');
    const priceMin = url.searchParams.get('priceMin') ? parseInt(url.searchParams.get('priceMin')!, 10) : undefined;
    const priceMax = url.searchParams.get('priceMax') ? parseInt(url.searchParams.get('priceMax')!, 10) : undefined;
    const bedsMin = url.searchParams.get('bedsMin') ? parseInt(url.searchParams.get('bedsMin')!, 10) : undefined;
    const bathsMin = url.searchParams.get('bathsMin') ? parseInt(url.searchParams.get('bathsMin')!, 10) : undefined;

    const filters = {
      ...(statusParam ? { status: statusParam.split(',') as ListingStatus[] } : {}),
      ...(propertyTypesParam ? { propertyTypes: propertyTypesParam.split(',') as PropertyType[] } : {}),
      ...(priceMin !== undefined ? { priceMin } : {}),
      ...(priceMax !== undefined ? { priceMax } : {}),
      ...(bedsMin !== undefined ? { bedsMin } : {}),
      ...(bathsMin !== undefined ? { bathsMin } : {}),
    };

    const result = deps.searchCrmListings({
      tenantId: tenantContext.tenantId,
      q,
      filters,
      sortField,
      sortOrder,
      page,
      pageSize,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      ...result,
    });
  };
}

export const GET = createPropertiesGetHandler();
