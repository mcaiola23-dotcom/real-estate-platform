import assert from "node:assert/strict";
import test from "node:test";

import {
  enforceWebsiteApiGuard,
  maskEmail,
  maskPhone,
  readJsonBodyWithLimit,
} from "../../app/lib/api-security";
import {
  LeadSubmissionSchema,
  ValuationRequestSchema,
  WebsiteEventRequestSchema,
} from "../../app/lib/validators";

test("api guard allows same-origin requests under payload limits", () => {
  const request = new Request("http://localhost:3000/api/lead", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "content-length": "42",
      "x-forwarded-for": "10.1.1.1",
    },
    body: JSON.stringify({ ok: true }),
  });

  const response = enforceWebsiteApiGuard(request, {
    routeId: "smoke-allow",
    maxRequests: 10,
    windowMs: 60_000,
    maxBodyBytes: 5_000,
  });

  assert.equal(response, null);
});

test("api guard blocks oversized payloads and rate limits repeated calls", () => {
  const oversizedRequest = new Request("http://localhost:3000/api/lead", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "content-length": "9000",
      "x-forwarded-for": "10.2.2.2",
    },
  });

  const tooLarge = enforceWebsiteApiGuard(oversizedRequest, {
    routeId: "smoke-too-large",
    maxRequests: 5,
    windowMs: 60_000,
    maxBodyBytes: 100,
  });
  assert.equal(tooLarge?.status, 413);

  const request = new Request("http://localhost:3000/api/website-events", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "x-forwarded-for": "10.3.3.3",
    },
    body: JSON.stringify({ ok: true }),
  });

  const first = enforceWebsiteApiGuard(request, {
    routeId: "smoke-rate-limit",
    maxRequests: 1,
    windowMs: 60_000,
    maxBodyBytes: 5_000,
  });
  const second = enforceWebsiteApiGuard(request, {
    routeId: "smoke-rate-limit",
    maxRequests: 1,
    windowMs: 60_000,
    maxBodyBytes: 5_000,
  });

  assert.equal(first, null);
  assert.equal(second?.status, 429);
});

test("json body helper handles valid and invalid payloads", async () => {
  const validRequest = new Request("http://localhost:3000/api/test", {
    method: "POST",
    body: JSON.stringify({ hello: "world" }),
  });
  const validBody = await readJsonBodyWithLimit(validRequest, 256);

  assert.equal(validBody.ok, true);
  if (validBody.ok) {
    assert.deepEqual(validBody.body, { hello: "world" });
  }

  const invalidRequest = new Request("http://localhost:3000/api/test", {
    method: "POST",
    body: "{bad-json",
  });
  const invalidBody = await readJsonBodyWithLimit(invalidRequest, 256);

  assert.equal(invalidBody.ok, false);
  if (!invalidBody.ok) {
    assert.equal(invalidBody.response.status, 400);
  }
});

test("public route schemas accept valid payloads", () => {
  const valuation = ValuationRequestSchema.safeParse({
    address: "123 Main Street, Stamford CT",
    propertyType: "single-family",
    beds: "3",
    baths: "2",
    sqft: 1800,
  });
  assert.equal(valuation.success, true);

  const lead = LeadSubmissionSchema.safeParse({
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "(203) 555-1000",
    message: "Interested in this listing",
  });
  assert.equal(lead.success, true);

  const websiteEvent = WebsiteEventRequestSchema.safeParse({
    eventType: "website.search.performed",
    payload: {
      source: "home_search",
      searchContext: {
        query: "waterfront",
        filtersJson: null,
        sortField: "listedAt",
        sortOrder: "desc",
        page: 1,
      },
      resultCount: 12,
      actor: null,
    },
  });
  assert.equal(websiteEvent.success, true);
});

test("masking helpers redact sensitive fields", () => {
  assert.equal(maskEmail("agent@example.com"), "a***@example.com");
  assert.equal(maskPhone("(203) 555-1212"), "***-***-1212");
});
