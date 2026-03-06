import { getAllTowns, getRecentPosts } from "../../lib/sanity.queries";
import { getLlmDiscoveryResources } from "../../lib/seo/llm-discovery";
import { getSeoRuntimeConfig } from "../../lib/seo/runtime";
import { getTenantContextFromRequest } from "../../lib/tenant/resolve-tenant";
import { getTenantWebsiteConfig } from "../../lib/tenant/website-profile";

export const revalidate = 3600;

export async function GET(request: Request) {
  const tenantContext = await getTenantContextFromRequest(request);
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantContext);
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);

  const [towns, posts] = await Promise.all([getAllTowns(tenantContext), getRecentPosts(8, tenantContext)]);

  const resources = getLlmDiscoveryResources(seoRuntime.metadataBaseUrl, tenantWebsiteConfig);

  return Response.json({
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    tenant: {
      tenantId: tenantWebsiteConfig.tenantId,
      tenantSlug: tenantWebsiteConfig.tenantSlug,
      brandName: tenantWebsiteConfig.brandName,
      agentName: tenantWebsiteConfig.agentName,
      brokerage: tenantWebsiteConfig.brokerage.name,
      contactEmail: tenantWebsiteConfig.contact.email,
      contactPhone: tenantWebsiteConfig.contact.phoneE164,
      serviceArea: tenantWebsiteConfig.serviceArea.cityNames,
    },
    seo: {
      siteName: tenantWebsiteConfig.seo.siteName,
      description: tenantWebsiteConfig.seo.description,
      metadataBaseUrl: seoRuntime.metadataBaseUrl,
      indexingEnabled: seoRuntime.indexingEnabled,
    },
    contentSummary: {
      townCount: towns.length,
      latestPostCount: posts.length,
      featuredTowns: towns.slice(0, 6).map((town) => ({
        name: town.name,
        slug: town.slug,
        url: `${seoRuntime.metadataBaseUrl}/towns/${town.slug}`,
      })),
      latestPosts: posts.slice(0, 6).map((post) => ({
        title: post.title,
        slug: post.slug,
        categorySlug: post.categorySlug,
        url: `${seoRuntime.metadataBaseUrl}/insights/${post.categorySlug}/${post.slug}`,
      })),
    },
    resources,
  });
}
