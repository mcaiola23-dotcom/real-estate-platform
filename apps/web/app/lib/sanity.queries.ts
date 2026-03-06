import type { TenantContext } from "@real-estate/types";
import { PortableTextBlock } from "sanity";
import { fetchSanityCached, SANITY_CACHE_TAGS } from "./sanity.cache";
import { getDefaultTenantWebsiteConfig, getTenantWebsiteConfig } from "./tenant/website-profile";

const TOWN_REVALIDATE_SECONDS = 3600;
const NEIGHBORHOOD_REVALIDATE_SECONDS = 3600;
const POST_REVALIDATE_SECONDS = 600;
const TENANT_DOC_FILTER = `(tenantId == $tenantId || ($includeLegacyTenantFallback && !defined(tenantId)))`;
const DEFAULT_CONTENT_TENANT_ID = getDefaultTenantWebsiteConfig().tenantId;

type TenantContentScope = Pick<TenantContext, "tenantId" | "tenantSlug">;

type TenantContentQueryScope = {
  tenantId: string;
  includeLegacyTenantFallback: boolean;
};

function resolveTenantContentQueryScope(tenantScope?: TenantContentScope): TenantContentQueryScope {
  const tenantWebsiteConfig = getTenantWebsiteConfig(tenantScope);
  const tenantId = tenantScope?.tenantId ?? tenantWebsiteConfig.tenantId;

  return {
    tenantId,
    includeLegacyTenantFallback: tenantId === DEFAULT_CONTENT_TENANT_ID,
  };
}

function withTenantCacheKey(keyParts: string[], tenantScope: TenantContentQueryScope): string[] {
  return [...keyParts, `tenant:${tenantScope.tenantId}`];
}

export type FAQ = {
  _id: string;
  question: string;
  answer: string;
  schemaEnabled?: boolean;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type CuratedPoi = {
  category: 'coffee' | 'restaurants' | 'parksTrails' | 'shopping' | 'fitness' | 'family';
  name: string;
  note?: string;
  url?: string;
};

export type Town = {
  _id: string;
  name: string;
  slug: string;
  overviewShort?: string;
  overviewLong?: unknown; // Portable text block array
  lifestyle?: string;
  marketNotes?: string;
  faqs?: FAQ[];
  highlights?: string[];
  center?: GeoPoint;
  curatedPois?: CuratedPoi[];
  heroImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  lastReviewedAt?: string;
};

export async function getTownsForHomepage(limit: number = 9, tenantScope?: TenantContentScope): Promise<Town[]> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  return fetchSanityCached<Town[]>(
    `*[_type == "town" && ${TENANT_DOC_FILTER}] | order(name asc)[0...$limit] {
      _id,
      name,
      "slug": slug.current,
      overviewShort,
      "heroImageUrl": heroImage.asset->url
    }`,
    { limit, ...queryScope },
    {
      keyParts: withTenantCacheKey(["towns", "homepage", String(limit)], queryScope),
      tags: [SANITY_CACHE_TAGS.towns],
      revalidateSeconds: TOWN_REVALIDATE_SECONDS,
    }
  );
}

export async function getAllTowns(tenantScope?: TenantContentScope): Promise<Town[]> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  return fetchSanityCached<Town[]>(
    `*[_type == "town" && ${TENANT_DOC_FILTER}] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      overviewShort,
      "heroImageUrl": heroImage.asset->url
    }`,
    queryScope,
    {
      keyParts: withTenantCacheKey(["towns", "all"], queryScope),
      tags: [SANITY_CACHE_TAGS.towns],
      revalidateSeconds: TOWN_REVALIDATE_SECONDS,
    }
  );
}

export type Neighborhood = {
  _id: string;
  name: string;
  slug: string;
  overview?: string;
  description?: unknown; // Portable text block array
  highlights?: string[];
  housingCharacteristics?: string;
  marketNotes?: string;
  locationAccess?: string;
  faqs?: FAQ[];
  seoTitle?: string;
  seoDescription?: string;
  lastReviewedAt?: string;
  center?: GeoPoint;
  curatedPois?: CuratedPoi[];
  town?: {
    _id: string;
    name: string;
    slug: string;
    center?: GeoPoint;
    curatedPois?: CuratedPoi[];
  };
};

export async function getTownBySlug(slug: string, tenantScope?: TenantContentScope): Promise<Town | null> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  return fetchSanityCached<Town | null>(
    `*[_type == "town" && slug.current == $slug && ${TENANT_DOC_FILTER}][0] {
      _id,
      name,
      "slug": slug.current,
      overviewShort,
      overviewLong,
      lifestyle,
      marketNotes,
      highlights,
      seoTitle,
      seoDescription,
      lastReviewedAt,
      "center": center { "lat": lat, "lng": lng },
      curatedPois[] {
        category,
        name,
        note,
        url
      },
      faqs[]->{
        _id,
        question,
        answer,
        schemaEnabled
      }
    }`,
    { slug, ...queryScope },
    {
      keyParts: withTenantCacheKey(["towns", "by-slug", slug], queryScope),
      tags: [SANITY_CACHE_TAGS.towns],
      revalidateSeconds: TOWN_REVALIDATE_SECONDS,
    }
  );
}

export async function getNeighborhoodBySlug(
  townSlug: string,
  neighborhoodSlug: string,
  tenantScope?: TenantContentScope
): Promise<Neighborhood | null> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  return fetchSanityCached<Neighborhood | null>(
    `*[_type == "neighborhood" && slug.current == $neighborhoodSlug && town->slug.current == $townSlug && ${TENANT_DOC_FILTER}][0] {
      _id,
      name,
      "slug": slug.current,
      overview,
      description,
      highlights,
      housingCharacteristics,
      marketNotes,
      locationAccess,
      seoTitle,
      seoDescription,
      lastReviewedAt,
      "center": center { "lat": lat, "lng": lng },
      curatedPois[] {
        category,
        name,
        note,
        url
      },
      faqs[]->{
        _id,
        question,
        answer,
        schemaEnabled
      },
      town->{
        _id,
        name,
        "slug": slug.current,
        "center": center { "lat": lat, "lng": lng },
        curatedPois[] {
          category,
          name,
          note,
          url
        }
      }
    }`,
    { townSlug, neighborhoodSlug, ...queryScope },
    {
      keyParts: withTenantCacheKey(["neighborhoods", "by-slug", townSlug, neighborhoodSlug], queryScope),
      tags: [SANITY_CACHE_TAGS.neighborhoods, SANITY_CACHE_TAGS.towns],
      revalidateSeconds: NEIGHBORHOOD_REVALIDATE_SECONDS,
    }
  );
}

export async function getNeighborhoodsByTown(
  townSlug: string,
  tenantScope?: TenantContentScope
): Promise<Neighborhood[]> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  return fetchSanityCached<Neighborhood[]>(
    `*[_type == "neighborhood" && town->slug.current == $townSlug && ${TENANT_DOC_FILTER}] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      overview
    }`,
    { townSlug, ...queryScope },
    {
      keyParts: withTenantCacheKey(["neighborhoods", "by-town", townSlug], queryScope),
      tags: [SANITY_CACHE_TAGS.neighborhoods, SANITY_CACHE_TAGS.towns],
      revalidateSeconds: NEIGHBORHOOD_REVALIDATE_SECONDS,
    }
  );
}

export type Post = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  category: string;
  categorySlug: string; // The URL-friendly slug
  categoryLabel: string; // The UI label
  author?: string;
  body?: PortableTextBlock[];
  featuredImageUrl?: string; // Featured image URL
};

// Map URL slug -> DB Value
const CATEGORY_SLUG_TO_VALUE: Record<string, string> = {
  "market-update": "market-update",
  "community": "community",
  "real-estate-tips": "real-estate-tips",
  "news": "news",
  "investing": "investing",
  "commercial": "commercial",
};

// Map DB Value -> URL Slug
const CATEGORY_VALUE_TO_SLUG: Record<string, string> = {
  "market-update": "market-update",
  "community": "community",
  "real-estate-tips": "real-estate-tips",
  "tips": "real-estate-tips", // Legacy support
  "news": "news",
  "investing": "investing",
  "commercial": "commercial",
};

// Map DB Value -> UI Label
const CATEGORY_VALUE_TO_LABEL: Record<string, string> = {
  "market-update": "Market Update",
  "community": "Community",
  "real-estate-tips": "Real Estate Tips",
  "tips": "Real Estate Tips", // Legacy support
  "news": "News",
  "investing": "Investing",
  "commercial": "Commercial",
};

export function getCategoryValueFromSlug(slug: string): string | undefined {
  return CATEGORY_SLUG_TO_VALUE[slug];
}

export function getCategorySlugFromValue(value: string): string {
  return CATEGORY_VALUE_TO_SLUG[value] || value;
}

export function getCategoryLabelFromValue(value: string): string {
  return CATEGORY_VALUE_TO_LABEL[value] || "Uncategorized";
}

export async function getRecentPosts(limit: number = 100, tenantScope?: TenantContentScope): Promise<Post[]> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  const posts = await fetchSanityCached<Array<Omit<Post, "categorySlug" | "categoryLabel">>>(
    `*[_type == "post" && ${TENANT_DOC_FILTER}] | order(publishedAt desc)[0...$limit] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      author,
      "featuredImageUrl": featuredImage.asset->url
    }`,
    { limit, ...queryScope },
    {
      keyParts: withTenantCacheKey(["posts", "recent", String(limit)], queryScope),
      tags: [SANITY_CACHE_TAGS.posts],
      revalidateSeconds: POST_REVALIDATE_SECONDS,
    }
  );

  return posts.map((post) => ({
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
    categoryLabel: getCategoryLabelFromValue(post.category),
  }));
}

export async function getPostsByCategoryLabel(
  categorySlug: string,
  tenantScope?: TenantContentScope
): Promise<Post[]> {
  const categoryValue = getCategoryValueFromSlug(categorySlug);

  if (!categoryValue) {
    return [];
  }

  const queryScope = resolveTenantContentQueryScope(tenantScope);

  const posts = await fetchSanityCached<Array<Omit<Post, "categorySlug" | "categoryLabel">>>(
    `*[_type == "post" && category == $categoryValue && ${TENANT_DOC_FILTER}] | order(publishedAt desc) {
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            category,
            author,
            "featuredImageUrl": featuredImage.asset->url
        }`,
    { categoryValue, ...queryScope },
    {
      keyParts: withTenantCacheKey(["posts", "by-category", categoryValue], queryScope),
      tags: [SANITY_CACHE_TAGS.posts],
      revalidateSeconds: POST_REVALIDATE_SECONDS,
    }
  );

  return posts.map((post) => ({
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
    categoryLabel: getCategoryLabelFromValue(post.category),
  }));
}

export async function getPostByCategoryLabelAndSlug(
  categorySlug: string,
  postSlug: string,
  tenantScope?: TenantContentScope
): Promise<Post | null> {
  const categoryValue = getCategoryValueFromSlug(categorySlug);

  if (!categoryValue) {
    return null;
  }

  const queryScope = resolveTenantContentQueryScope(tenantScope);

  const post = await fetchSanityCached<Omit<Post, "categorySlug" | "categoryLabel"> | null>(
    `*[_type == "post" && slug.current == $postSlug && category == $categoryValue && ${TENANT_DOC_FILTER}][0] {
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            category,
            author,
            body,
            "featuredImageUrl": featuredImage.asset->url
        }`,
    { postSlug, categoryValue, ...queryScope },
    {
      keyParts: withTenantCacheKey(["posts", "by-category-and-slug", categoryValue, postSlug], queryScope),
      tags: [SANITY_CACHE_TAGS.posts],
      revalidateSeconds: POST_REVALIDATE_SECONDS,
    }
  );

  if (!post) {
    return null;
  }

  return {
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
    categoryLabel: getCategoryLabelFromValue(post.category),
  };
}

export async function getAllNeighborhoods(tenantScope?: TenantContentScope): Promise<Neighborhood[]> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  return fetchSanityCached<Neighborhood[]>(
    `*[_type == "neighborhood" && ${TENANT_DOC_FILTER}] {
      _id,
      name,
      "slug": slug.current,
      town->{
        "slug": slug.current
      }
    }`,
    queryScope,
    {
      keyParts: withTenantCacheKey(["neighborhoods", "all"], queryScope),
      tags: [SANITY_CACHE_TAGS.neighborhoods, SANITY_CACHE_TAGS.sitemap],
      revalidateSeconds: NEIGHBORHOOD_REVALIDATE_SECONDS,
    }
  );
}

export async function getAllPosts(tenantScope?: TenantContentScope): Promise<Post[]> {
  const queryScope = resolveTenantContentQueryScope(tenantScope);

  const posts = await fetchSanityCached<Array<Omit<Post, "categorySlug" | "categoryLabel">>>(
    `*[_type == "post" && ${TENANT_DOC_FILTER}] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category
    }`,
    queryScope,
    {
      keyParts: withTenantCacheKey(["posts", "all"], queryScope),
      tags: [SANITY_CACHE_TAGS.posts, SANITY_CACHE_TAGS.sitemap],
      revalidateSeconds: POST_REVALIDATE_SECONDS,
    }
  );

  return posts.map((post) => ({
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
    categoryLabel: getCategoryLabelFromValue(post.category),
  }));
}
