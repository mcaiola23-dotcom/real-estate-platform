import { getSeoRuntimeConfig } from "../../../lib/seo/runtime";
import { getTenantContextFromRequest } from "../../../lib/tenant/resolve-tenant";
import { getTenantWebsiteConfig } from "../../../lib/tenant/website-profile";

export const revalidate = 3600;

export async function GET(request: Request) {
  const tenantContext = await getTenantContextFromRequest(request);
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantContext);
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);

  const markdown = [
    `# ${tenantWebsiteConfig.agentName}`,
    "",
    `Brand: ${tenantWebsiteConfig.brandName}`,
    `Brokerage: ${tenantWebsiteConfig.brokerage.name}`,
    `Website: ${seoRuntime.metadataBaseUrl}`,
    "",
    "## Service Area",
    ...tenantWebsiteConfig.serviceArea.cityNames.map((cityName) => `- ${cityName}, ${tenantWebsiteConfig.serviceArea.stateCode}`),
    "",
    "## Contact",
    `- Phone: ${tenantWebsiteConfig.contact.phoneDisplay}`,
    `- Email: ${tenantWebsiteConfig.contact.email}`,
    "",
    "## About",
    tenantWebsiteConfig.seo.description,
    "",
    "## Citation Links",
    `- Main website: ${seoRuntime.metadataBaseUrl}`,
    `- Home search: ${seoRuntime.metadataBaseUrl}/home-search`,
    `- Insights hub: ${seoRuntime.metadataBaseUrl}/insights`,
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
