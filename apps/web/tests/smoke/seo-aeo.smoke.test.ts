import assert from "node:assert/strict";
import test from "node:test";

import { buildLlmsTxt, getLlmDiscoveryResources } from "../../app/lib/seo/llm-discovery";
import { getDefaultTenantWebsiteConfig } from "../../app/lib/tenant/website-profile";

test("llm discovery resources include core AI endpoints", () => {
  const tenantWebsiteConfig = getDefaultTenantWebsiteConfig();
  const resources = getLlmDiscoveryResources("https://example.com", tenantWebsiteConfig);
  const urls = resources.map((resource) => resource.url);

  assert.ok(urls.includes("https://example.com/.well-known/llm.json"));
  assert.ok(urls.includes("https://example.com/api/content/agent.md"));
  assert.ok(urls.includes("https://example.com/api/content/market.md"));
  assert.ok(urls.some((url) => url.startsWith("https://example.com/api/content/towns/")));
});

test("llms.txt builder returns cite-ready plain text", () => {
  const tenantWebsiteConfig = getDefaultTenantWebsiteConfig();
  const resources = getLlmDiscoveryResources("https://example.com", tenantWebsiteConfig);
  const llmsTxt = buildLlmsTxt("https://example.com", tenantWebsiteConfig, resources);

  assert.ok(llmsTxt.includes("LLM Content Directory"));
  assert.ok(llmsTxt.includes("Citation Guidance"));
  assert.ok(llmsTxt.includes("https://example.com/api/content/agent.md"));
});
