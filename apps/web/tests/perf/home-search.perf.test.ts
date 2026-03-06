import assert from "node:assert/strict";
import test from "node:test";

import { listNeighborhoods, searchListings, suggestListings } from "../../app/lib/data/providers/listings.provider";

async function measureMs(fn: () => Promise<void>): Promise<number> {
  const startedAt = performance.now();
  await fn();
  return performance.now() - startedAt;
}

test("home-search provider: repeated listing searches stay within budget", async () => {
  const durationMs = await measureMs(async () => {
    for (let index = 0; index < 80; index += 1) {
      await searchListings({
        scope: "global",
        townSlugs: ["stamford", "greenwich"],
        q: "main",
        page: 1,
        pageSize: 12,
        filters: {
          status: ["active"],
          bedsMin: 2,
          bathsMin: 2,
          priceMin: 250000,
          priceMax: 2500000,
        },
        sort: { field: "listedAt", order: "desc" },
      });
    }
  });

  assert.ok(durationMs < 4_000, `Expected repeated searches <4000ms, got ${Math.round(durationMs)}ms`);
});

test("home-search provider: repeated autocomplete suggestions stay within budget", async () => {
  const durationMs = await measureMs(async () => {
    for (let index = 0; index < 150; index += 1) {
      await suggestListings({
        q: "stamford",
        limit: 6,
        status: ["active", "pending"],
      });
    }
  });

  assert.ok(durationMs < 3_500, `Expected repeated suggestions <3500ms, got ${Math.round(durationMs)}ms`);
});

test("home-search provider: neighborhood options return quickly for scoped towns", async () => {
  const durationMs = await measureMs(async () => {
    for (let index = 0; index < 120; index += 1) {
      await listNeighborhoods(["stamford", "norwalk", "westport"]);
    }
  });

  assert.ok(durationMs < 2_500, `Expected neighborhood lookups <2500ms, got ${Math.round(durationMs)}ms`);
});
