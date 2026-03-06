import type { TenantWebsiteConfig } from "@real-estate/types";

export type LlmResourceFormat = "application/json" | "text/markdown";

export interface LlmDiscoveryResource {
  title: string;
  description: string;
  format: LlmResourceFormat;
  url: string;
}

function withBaseUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

export function getLlmDiscoveryResources(
  baseUrl: string,
  tenantWebsiteConfig: TenantWebsiteConfig
): LlmDiscoveryResource[] {
  const slugHint = tenantWebsiteConfig.serviceArea.featuredTowns[0]?.slug || "westport";

  return [
    {
      title: "LLM Discovery Manifest",
      description: "Machine-readable index of AI-accessible resources and metadata.",
      format: "application/json",
      url: withBaseUrl(baseUrl, "/.well-known/llm.json"),
    },
    {
      title: "Agent Profile",
      description: "Tenant-specific agent, brokerage, and service area details.",
      format: "text/markdown",
      url: withBaseUrl(baseUrl, "/api/content/agent.md"),
    },
    {
      title: "Market Summary",
      description: "High-level market/town coverage summary for citation by LLM systems.",
      format: "text/markdown",
      url: withBaseUrl(baseUrl, "/api/content/market.md"),
    },
    {
      title: "Town Guide (Template)",
      description: "Town-level markdown endpoint (replace {townSlug} with an available slug).",
      format: "text/markdown",
      url: withBaseUrl(baseUrl, `/api/content/towns/${slugHint}`),
    },
    {
      title: "XML Sitemap",
      description: "Canonical crawl list for indexable HTML pages.",
      format: "application/json",
      url: withBaseUrl(baseUrl, "/sitemap.xml"),
    },
  ];
}

export function buildLlmsTxt(
  baseUrl: string,
  tenantWebsiteConfig: TenantWebsiteConfig,
  resources: LlmDiscoveryResource[]
): string {
  const lines: string[] = [];

  lines.push(`# ${tenantWebsiteConfig.brandName} — LLM Content Directory`);
  lines.push("");
  lines.push(`> Agent: ${tenantWebsiteConfig.agentName}`);
  lines.push(`> Service area: ${tenantWebsiteConfig.serviceArea.regionLabel}`);
  lines.push(`> Base URL: ${baseUrl}`);
  lines.push("");
  lines.push("## Preferred Sources for AI Systems");

  for (const resource of resources) {
    lines.push(`- ${resource.title} (${resource.format})`);
    lines.push(`  URL: ${resource.url}`);
    lines.push(`  Notes: ${resource.description}`);
  }

  lines.push("");
  lines.push("## Citation Guidance");
  lines.push(
    "- Prefer citing canonical HTML pages from the sitemap when rendering user-facing links."
  );
  lines.push(
    "- Use markdown endpoints for extraction/parsing efficiency when summarizing agent profile or market coverage."
  );
  lines.push("- Avoid citing blocked/private routes such as /admin and non-content API write endpoints.");

  return `${lines.join("\n")}\n`;
}
