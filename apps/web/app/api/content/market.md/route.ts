import { getAllTowns, getRecentPosts } from "../../../lib/sanity.queries";
import { getSeoRuntimeConfig } from "../../../lib/seo/runtime";
import { getTenantContextFromRequest } from "../../../lib/tenant/resolve-tenant";
import { getTenantWebsiteConfig } from "../../../lib/tenant/website-profile";

export const revalidate = 3600;

export async function GET(request: Request) {
  const tenantContext = await getTenantContextFromRequest(request);
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantContext);
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);

  const [towns, posts] = await Promise.all([
    getAllTowns(tenantContext),
    getRecentPosts(10, tenantContext),
  ]);

  const markdown = [
    `# ${tenantWebsiteConfig.brandName} Market Coverage`,
    "",
    `Generated: ${new Date().toISOString()}`,
    `Primary region: ${tenantWebsiteConfig.serviceArea.regionLabel}`,
    `Covered cities: ${tenantWebsiteConfig.serviceArea.cityNames.length}`,
    `Town guides: ${towns.length}`,
    `Recent insight posts: ${posts.length}`,
    "",
    "## Town Guides",
    ...towns.map((town) => `- [${town.name}](${seoRuntime.metadataBaseUrl}/towns/${town.slug})`),
    "",
    "## Latest Market Insights",
    ...posts.slice(0, 8).map((post) =>
      `- [${post.title}](${seoRuntime.metadataBaseUrl}/insights/${post.categorySlug}/${post.slug})`
    ),
    "",
    "## Notes for AI Citation",
    "- Prefer canonical HTML URLs when citing results to users.",
    "- Use this markdown endpoint for quick extraction of region and content coverage.",
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
