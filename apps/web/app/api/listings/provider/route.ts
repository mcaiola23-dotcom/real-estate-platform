import { NextResponse } from "next/server";
import { z } from "zod";

import { enforceWebsiteApiGuard, readJsonBodyWithLimit } from "../../../lib/api-security";
import { callIdxBridge, getIdxBridgeConfigError } from "../../../lib/data/providers/idx-bridge";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 128_000;

const ListingStatusSchema = z.enum(["active", "pending", "sold"]);
const PropertyTypeSchema = z.enum(["single-family", "condo", "townhouse", "multi-family", "land"]);
const SortFieldSchema = z.enum(["price", "listedAt", "beds", "sqft"]);
const SortOrderSchema = z.enum(["asc", "desc"]);

const ListingBoundsSchema = z.object({
  north: z.number().finite(),
  south: z.number().finite(),
  east: z.number().finite(),
  west: z.number().finite(),
});

const ListingFiltersSchema = z
  .object({
    status: z.array(ListingStatusSchema).optional(),
    priceMin: z.number().finite().optional(),
    priceMax: z.number().finite().optional(),
    bedsMin: z.number().finite().optional(),
    bathsMin: z.number().finite().optional(),
    sqftMin: z.number().finite().optional(),
    sqftMax: z.number().finite().optional(),
    lotAcresMin: z.number().finite().optional(),
    lotAcresMax: z.number().finite().optional(),
    propertyTypes: z.array(PropertyTypeSchema).optional(),
  })
  .optional();

const ListingSortSchema = z
  .object({
    field: SortFieldSchema,
    order: SortOrderSchema,
  })
  .optional();

const TenantScopeSchema = z
  .object({
    tenantId: z.string().min(1),
    tenantSlug: z.string().min(1),
    tenantDomain: z.string().min(1),
  })
  .optional();

const SearchListingsSchema = z.object({
  action: z.literal("searchListings"),
  payload: z.object({
    scope: z.enum(["global", "town", "neighborhood"]),
    tenantContext: TenantScopeSchema,
    townSlug: z.string().min(1).optional(),
    neighborhoodSlug: z.string().min(1).optional(),
    townSlugs: z.array(z.string().min(1)).optional(),
    neighborhoodSlugs: z.array(z.string().min(1)).optional(),
    bounds: ListingBoundsSchema.optional(),
    q: z.string().optional(),
    filters: ListingFiltersSchema,
    sort: ListingSortSchema,
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(200).optional(),
  }),
});

const GetListingByIdSchema = z.object({
  action: z.literal("getListingById"),
  payload: z.object({
    id: z.string().min(1),
  }),
});

const GetListingsByIdsSchema = z.object({
  action: z.literal("getListingsByIds"),
  payload: z.object({
    ids: z.array(z.string().min(1)).max(500),
  }),
});

const SuggestListingsSchema = z.object({
  action: z.literal("suggestListings"),
  payload: z.object({
    q: z.string().min(1),
    tenantContext: TenantScopeSchema,
    townSlugs: z.array(z.string().min(1)).optional(),
    status: z.array(ListingStatusSchema).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
});

const ListNeighborhoodsSchema = z.object({
  action: z.literal("listNeighborhoods"),
  payload: z.object({
    townSlugs: z.array(z.string().min(1)).optional(),
  }),
});

const ListingsProviderRequestSchema = z.discriminatedUnion("action", [
  SearchListingsSchema,
  GetListingByIdSchema,
  GetListingsByIdsSchema,
  SuggestListingsSchema,
  ListNeighborhoodsSchema,
]);

export async function POST(request: Request) {
  const guard = enforceWebsiteApiGuard(request, {
    routeId: "website:listings-provider",
    maxRequests: 180,
    windowMs: 60_000,
    maxBodyBytes: MAX_BODY_BYTES,
    allowMissingOrigin: true,
  });

  if (guard) {
    return guard;
  }

  const parsedBody = await readJsonBodyWithLimit(request, MAX_BODY_BYTES);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsedRequest = ListingsProviderRequestSchema.safeParse(parsedBody.body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid listings provider request.",
        details: parsedRequest.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const bridgeResult = await callIdxBridge(parsedRequest.data.action, parsedRequest.data.payload);
    return NextResponse.json({ ok: true, data: bridgeResult });
  } catch (error) {
    const configError = getIdxBridgeConfigError();
    if (configError) {
      return NextResponse.json(
        {
          ok: false,
          error: configError,
        },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : "IDX bridge request failed.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 502 }
    );
  }
}
