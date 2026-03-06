import assert from "node:assert/strict";
import test from "node:test";

import { getSeoRuntimeConfig } from "../../app/lib/seo/runtime";
import { TENANT_HEADER_NAMES, getTenantContextFromHeaders } from "../../app/lib/tenant/resolve-tenant";
import { getDefaultTenantWebsiteConfig, getTenantWebsiteConfig } from "../../app/lib/tenant/website-profile";

test("tenant resolution honors forwarded tenant headers", async () => {
  const headers = new Headers({
    [TENANT_HEADER_NAMES.tenantId]: "tenant_custom",
    [TENANT_HEADER_NAMES.tenantSlug]: "custom",
    [TENANT_HEADER_NAMES.tenantDomain]: "custom.localhost",
    [TENANT_HEADER_NAMES.tenantResolution]: "host_match",
    host: "ignored.localhost",
  });

  const tenant = await getTenantContextFromHeaders(headers);

  assert.deepEqual(tenant, {
    tenantId: "tenant_custom",
    tenantSlug: "custom",
    tenantDomain: "custom.localhost",
    source: "host_match",
  });
});

test("tenant website config resolves explicit and default tenants", () => {
  const defaultConfig = getDefaultTenantWebsiteConfig();
  const explicitConfig = getTenantWebsiteConfig({ tenantSlug: defaultConfig.tenantSlug });

  assert.equal(explicitConfig.tenantId, defaultConfig.tenantId);
  assert.equal(explicitConfig.brandName, defaultConfig.brandName);
});

test("seo runtime stays blocked outside production and normalizes base url", { concurrency: false }, () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousEnableIndexing = process.env.SEO_ENABLE_INDEXING;
  const previousMetadataBase = process.env.SEO_METADATA_BASE_URL;
  const previousPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const setNodeEnv = (value: string | undefined) => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  };

  try {
    setNodeEnv("development");
    process.env.SEO_ENABLE_INDEXING = "true";
    process.env.SEO_METADATA_BASE_URL = "https://tenant.example.com/some/path";
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const developmentConfig = getSeoRuntimeConfig("https://fallback.example.com");
    assert.equal(developmentConfig.indexingEnabled, false);
    assert.equal(developmentConfig.metadataBaseUrl, "https://tenant.example.com");

    setNodeEnv("production");
    process.env.SEO_ENABLE_INDEXING = "true";
    process.env.SEO_METADATA_BASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SITE_URL = "https://public.example.com/site";

    const productionConfig = getSeoRuntimeConfig("https://fallback.example.com");
    assert.equal(productionConfig.indexingEnabled, true);
    assert.equal(productionConfig.metadataBaseUrl, "https://public.example.com");
  } finally {
    setNodeEnv(previousNodeEnv);
    process.env.SEO_ENABLE_INDEXING = previousEnableIndexing;
    process.env.SEO_METADATA_BASE_URL = previousMetadataBase;
    process.env.NEXT_PUBLIC_SITE_URL = previousPublicSiteUrl;
  }
});
