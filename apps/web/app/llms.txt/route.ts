import { buildLlmsTxt, getLlmDiscoveryResources } from "../lib/seo/llm-discovery";
import { getSeoRuntimeConfig } from "../lib/seo/runtime";
import { getTenantContextFromRequest } from "../lib/tenant/resolve-tenant";
import { getTenantWebsiteConfig } from "../lib/tenant/website-profile";

export const revalidate = 3600;

export async function GET(request: Request) {
  const tenantContext = await getTenantContextFromRequest(request);
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantContext);
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);
  const resources = getLlmDiscoveryResources(seoRuntime.metadataBaseUrl, tenantWebsiteConfig);
  const llmsTxt = buildLlmsTxt(seoRuntime.metadataBaseUrl, tenantWebsiteConfig, resources);

  return new Response(llmsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
