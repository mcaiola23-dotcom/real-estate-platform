import type { MetadataRoute } from "next";

import { getSeoRuntimeConfig } from "./lib/seo/runtime";
import { getTenantWebsiteConfig } from "./lib/tenant/website-profile";

export default function robots(): MetadataRoute.Robots {
  const tenantWebsiteConfig = getTenantWebsiteConfig();
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);

  if (!seoRuntime.indexingEnabled) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: ["GPTBot", "Anthropic-ai", "PerplexityBot", "Google-Extended"],
        allow: ["/", "/llms.txt", "/.well-known/llms.txt", "/.well-known/llm.json", "/api/content/"],
        disallow: [
          "/api/lead",
          "/api/valuation",
          "/api/website-events",
          "/api/listings/provider",
          "/admin/",
        ],
      },
    ],
    sitemap: `${seoRuntime.metadataBaseUrl}/sitemap.xml`,
    host: seoRuntime.metadataBaseUrl,
  };
}
