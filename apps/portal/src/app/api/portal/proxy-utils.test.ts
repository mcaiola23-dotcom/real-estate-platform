import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFavoritesPayload, resolveEndpointPolicy } from "./proxy-utils";

test("resolveEndpointPolicy returns AI search policy", () => {
  const policy = resolveEndpointPolicy("api/v1/search/ai", "POST");
  assert.ok(policy);
  assert.equal(policy.requireAuth, false);
  assert.equal(policy.rateLimitPolicyName, "aiSearch");
});

test("resolveEndpointPolicy requires auth for favorites", () => {
  const policy = resolveEndpointPolicy("api/favorites", "GET");
  assert.ok(policy);
  assert.equal(policy.requireAuth, true);
  assert.equal(policy.rateLimitPolicyName, "favorites");
});

test("normalizeFavoritesPayload maps address_full to property_address", () => {
  const normalized = normalizeFavoritesPayload({
    favorites: [
      {
        id: 10,
        parcel: {
          address_full: "123 Main St",
          city: "Fairfield",
          state: "CT",
          zip_code: "06824",
        },
      },
    ],
  }) as { favorites: Array<Record<string, unknown>> };

  assert.equal(normalized.favorites[0].favorite_id, 10);
  assert.equal(normalized.favorites[0].property_address, "123 Main St");
  assert.equal(normalized.favorites[0].property_city, "Fairfield");
  assert.equal(normalized.favorites[0].property_state, "CT");
  assert.equal(normalized.favorites[0].property_zip, "06824");
});
