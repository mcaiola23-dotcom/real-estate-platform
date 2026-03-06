import { getNeighborhoodsByTown, getTownBySlug } from "../../../../lib/sanity.queries";
import { getSeoRuntimeConfig } from "../../../../lib/seo/runtime";
import { getTenantContextFromRequest } from "../../../../lib/tenant/resolve-tenant";
import { getTenantWebsiteConfig } from "../../../../lib/tenant/website-profile";

export const revalidate = 3600;

interface TownRouteContext {
  params: Promise<{ townSlug: string }>;
}

export async function GET(request: Request, context: TownRouteContext) {
  const { townSlug } = await context.params;
  if (!townSlug) {
    return new Response("# Town Not Found\n\nMissing town slug.\n", {
      status: 400,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }

  const tenantContext = await getTenantContextFromRequest(request);
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantContext);
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);

  const [town, neighborhoods] = await Promise.all([
    getTownBySlug(townSlug, tenantContext),
    getNeighborhoodsByTown(townSlug, tenantContext),
  ]);

  if (!town) {
    return new Response(`# Town Not Found\n\nNo town content was found for slug: ${townSlug}\n`, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }

  const highlights = town.highlights && town.highlights.length > 0
    ? town.highlights.map((highlight) => `- ${highlight}`)
    : ["- Highlights currently unavailable."];

  const markdown = [
    `# ${town.name} Real Estate Overview`,
    "",
    `Canonical URL: ${seoRuntime.metadataBaseUrl}/towns/${town.slug}`,
    `Tenant: ${tenantWebsiteConfig.brandName}`,
    "",
    "## Summary",
    town.overviewShort || "Summary unavailable.",
    "",
    "## Lifestyle",
    town.lifestyle || "Lifestyle details unavailable.",
    "",
    "## Market Notes",
    town.marketNotes || "Market notes unavailable.",
    "",
    "## Highlights",
    ...highlights,
    "",
    "## Neighborhoods",
    ...neighborhoods.map((neighborhood) =>
      `- [${neighborhood.name}](${seoRuntime.metadataBaseUrl}/towns/${town.slug}/${neighborhood.slug})`
    ),
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
