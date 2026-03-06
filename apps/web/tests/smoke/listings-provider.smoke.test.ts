import assert from "node:assert/strict";
import test from "node:test";

import { getListingsProviderKind } from "../../app/lib/data/providers/listings.provider";

test("listings provider kind defaults to mock", { concurrency: false }, () => {
  const previousProvider = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER;
  const previousFallback = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK;

  try {
    delete process.env.NEXT_PUBLIC_LISTINGS_PROVIDER;
    delete process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK;
    assert.equal(getListingsProviderKind(), "mock");
  } finally {
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER = previousProvider;
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK = previousFallback;
  }
});

test("listings provider stays on mock when idx fallback remains enabled", { concurrency: false }, () => {
  const previousProvider = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER;
  const previousFallback = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK;

  try {
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER = "idx";
    delete process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK;
    assert.equal(getListingsProviderKind(), "mock");
  } finally {
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER = previousProvider;
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK = previousFallback;
  }
});

test("listings provider switches to idx when fallback is disabled", { concurrency: false }, () => {
  const previousProvider = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER;
  const previousFallback = process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK;

  try {
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER = "idx";
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK = "false";
    assert.equal(getListingsProviderKind(), "idx");
  } finally {
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER = previousProvider;
    process.env.NEXT_PUBLIC_LISTINGS_PROVIDER_FALLBACK = previousFallback;
  }
});
