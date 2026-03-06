import type { MetadataRoute } from "next";

import { getAllNeighborhoods, getAllPosts, getAllTowns } from "./lib/sanity.queries";
import { getSeoRuntimeConfig } from "./lib/seo/runtime";
import { getTenantWebsiteConfig } from "./lib/tenant/website-profile";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantWebsiteConfig = getTenantWebsiteConfig();
  const seoRuntime = getSeoRuntimeConfig(tenantWebsiteConfig.seo.metadataBaseUrl);
  if (!seoRuntime.indexingEnabled) {
    return [];
  }

  const baseUrl = seoRuntime.metadataBaseUrl;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/services/buy",
    "/services/sell",
    "/services/investing",
    "/towns",
    "/insights",
    "/home-value",
    "/contact",
    "/fair-housing",
    "/privacy",
    "/terms",
    "/llms.txt",
    "/.well-known/llms.txt",
    "/.well-known/llm.json",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  const towns = await getAllTowns();
  const townRoutes: MetadataRoute.Sitemap = towns.map((town) => ({
    url: `${baseUrl}/towns/${town.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const neighborhoods = await getAllNeighborhoods();
  const neighborhoodRoutes: MetadataRoute.Sitemap = neighborhoods
    .filter((neighborhood) => neighborhood.town?.slug && neighborhood.slug)
    .map((neighborhood) => ({
      url: `${baseUrl}/towns/${neighborhood.town!.slug}/${neighborhood.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const posts = await getAllPosts();
  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((post) => post.categorySlug && post.slug)
    .map((post) => ({
      url: `${baseUrl}/insights/${post.categorySlug}/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...townRoutes, ...neighborhoodRoutes, ...postRoutes];
}
