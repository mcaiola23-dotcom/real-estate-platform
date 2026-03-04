import type { PolicyName } from "@/lib/server/rate-limit";

type EndpointPolicy = {
  matchPath: RegExp;
  methods: string[];
  rateLimitPolicyName: PolicyName;
  requireAuth: boolean;
};

const ENDPOINT_POLICIES: EndpointPolicy[] = [
  {
    matchPath: /^api\/v1\/search\/ai$/,
    methods: ["POST"],
    rateLimitPolicyName: "aiSearch",
    requireAuth: false,
  },
  {
    matchPath: /^api\/auth\/register$/,
    methods: ["POST"],
    rateLimitPolicyName: "authRegister",
    requireAuth: false,
  },
  {
    matchPath: /^leads\/?$/,
    methods: ["POST"],
    rateLimitPolicyName: "leadSubmit",
    requireAuth: false,
  },
  {
    matchPath: /^leads\/?$/,
    methods: ["GET"],
    rateLimitPolicyName: "leadRead",
    requireAuth: true,
  },
  {
    matchPath: /^api\/favorites(?:\/.*)?$/,
    methods: ["GET", "POST", "DELETE"],
    rateLimitPolicyName: "favorites",
    requireAuth: true,
  },
  {
    matchPath: /^api\/saved-searches(?:\/.*)?$/,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    rateLimitPolicyName: "savedSearches",
    requireAuth: true,
  },
  {
    matchPath: /^api\/alerts(?:\/.*)?$/,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    rateLimitPolicyName: "alerts",
    requireAuth: true,
  },
];

function toMethodSet(methods: string[]): Set<string> {
  return new Set(methods.map((method) => method.toUpperCase()));
}

export function resolveEndpointPolicy(path: string, method: string): EndpointPolicy | null {
  const normalizedPath = path.replace(/^\/+/, "");
  const normalizedMethod = method.toUpperCase();

  for (const policy of ENDPOINT_POLICIES) {
    if (!policy.matchPath.test(normalizedPath)) continue;
    if (!toMethodSet(policy.methods).has(normalizedMethod)) continue;
    return policy;
  }

  return null;
}

type RawFavoriteRecord = Record<string, unknown>;

function coalesceString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function coalesceNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function coalesceBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function normalizeFavoriteRecord(input: RawFavoriteRecord): RawFavoriteRecord {
  const parcel = asObject(input.parcel);
  const listing = asObject(input.listing);

  return {
    ...input,
    favorite_id: coalesceNumber(input.favorite_id, input.id),
    property_address: coalesceString(
      input.property_address,
      input.address_full,
      input.address,
      parcel?.address_full,
      parcel?.address,
      listing?.address_full,
      listing?.address
    ),
    property_city: coalesceString(
      input.property_city,
      input.city,
      parcel?.city,
      listing?.city
    ),
    property_state: coalesceString(
      input.property_state,
      input.state,
      parcel?.state,
      listing?.state
    ),
    property_zip: coalesceString(
      input.property_zip,
      input.zip_code,
      parcel?.zip_code,
      listing?.zip_code
    ),
    property_price: coalesceNumber(
      input.property_price,
      input.list_price,
      input.avm_estimate,
      parcel?.list_price,
      listing?.list_price
    ),
    property_status: coalesceString(
      input.property_status,
      input.status,
      parcel?.status,
      listing?.status
    ),
    bedrooms: coalesceNumber(input.bedrooms, parcel?.bedrooms, listing?.bedrooms),
    bathrooms: coalesceNumber(input.bathrooms, parcel?.bathrooms, listing?.bathrooms),
    square_feet: coalesceNumber(
      input.square_feet,
      parcel?.square_feet,
      listing?.square_feet
    ),
    property_type: coalesceString(
      input.property_type,
      parcel?.property_type,
      listing?.property_type
    ),
    photo_url: coalesceString(
      input.photo_url,
      input.thumbnail_url,
      parcel?.thumbnail_url,
      listing?.thumbnail_url
    ),
    has_pool: coalesceBoolean(input.has_pool, parcel?.has_pool, listing?.has_pool),
    is_waterfront: coalesceBoolean(
      input.is_waterfront,
      parcel?.is_waterfront,
      listing?.is_waterfront
    ),
  };
}

export function normalizeFavoritesPayload(input: unknown): unknown {
  const payload = asObject(input);
  if (!payload) return input;

  const favorites = Array.isArray(payload.favorites) ? payload.favorites : null;
  if (!favorites) return input;

  return {
    ...payload,
    favorites: favorites.map((favorite) =>
      asObject(favorite) ? normalizeFavoriteRecord(favorite) : favorite
    ),
  };
}

export type { EndpointPolicy };
