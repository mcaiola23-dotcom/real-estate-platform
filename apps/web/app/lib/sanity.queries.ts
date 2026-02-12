import { client } from "./sanity.client";
import { PortableTextBlock } from "sanity";

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
};

export async function getTownsForHomepage(limit: number = 9): Promise<Town[]> {
  return client.fetch(
    `*[_type == "town"] | order(name asc)[0...$limit] {
      _id,
      name,
      "slug": slug.current,
      overviewShort,
      "heroImageUrl": heroImage.asset->url
    }`,
    { limit }
  );
}

export async function getAllTowns(): Promise<Town[]> {
  return client.fetch(
    `*[_type == "town"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      overviewShort,
      "heroImageUrl": heroImage.asset->url
    }`
  );
}

export type Neighborhood = {
  _id: string;
  name: string;
  slug: string;
  overview?: string;
  description?: unknown; // Portable text block array
  highlights?: string[];
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

export async function getTownBySlug(slug: string): Promise<Town | null> {
  return client.fetch(
    `*[_type == "town" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      overviewShort,
      overviewLong,
      lifestyle,
      marketNotes,
      highlights,
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
    { slug }
  );
}

export async function getNeighborhoodBySlug(townSlug: string, neighborhoodSlug: string): Promise<Neighborhood | null> {
  return client.fetch(
    `*[_type == "neighborhood" && slug.current == $neighborhoodSlug && town->slug.current == $townSlug][0] {
      _id,
      name,
      "slug": slug.current,
      overview,
      description,
      highlights,
      "center": center { "lat": lat, "lng": lng },
      curatedPois[] {
        category,
        name,
        note,
        url
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
    { townSlug, neighborhoodSlug }
  );
}

export async function getNeighborhoodsByTown(townSlug: string): Promise<Neighborhood[]> {
  return client.fetch(
    `*[_type == "neighborhood" && town->slug.current == $townSlug] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      overview
    }`,
    { townSlug }
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

export async function getRecentPosts(limit: number = 100): Promise<Post[]> {
  const posts = await client.fetch(
    `*[_type == "post"] | order(publishedAt desc)[0...$limit] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      author,
      "featuredImageUrl": featuredImage.asset->url
    }`,
    { limit }
  );

  return posts.map((post: any) => ({
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
    categoryLabel: getCategoryLabelFromValue(post.category),
  }));
}

export async function getPostsByCategoryLabel(categorySlug: string): Promise<Post[]> {
  const categoryValue = getCategoryValueFromSlug(categorySlug);

  if (!categoryValue) {
    return [];
  }

  const posts = await client.fetch(
    `*[_type == "post" && category == $categoryValue] | order(publishedAt desc) {
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            category,
            author,
            "featuredImageUrl": featuredImage.asset->url
        }`,
    { categoryValue }
  );

  return posts.map((post: any) => ({
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
    categoryLabel: getCategoryLabelFromValue(post.category),
  }));
}

export async function getPostByCategoryLabelAndSlug(categorySlug: string, postSlug: string): Promise<Post | null> {
  const categoryValue = getCategoryValueFromSlug(categorySlug);

  if (!categoryValue) {
    return null;
  }

  const post = await client.fetch(
    `*[_type == "post" && slug.current == $postSlug && category == $categoryValue][0] {
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            category,
            author,
            body,
            "featuredImageUrl": featuredImage.asset->url
        }`,
    { postSlug, categoryValue }
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

export async function getAllNeighborhoods(): Promise<Neighborhood[]> {
  return client.fetch(
    `*[_type == "neighborhood"] {
      _id,
      name,
      "slug": slug.current,
      town->{
        "slug": slug.current
      }
    }`
  );
}

export async function getAllPosts(): Promise<Post[]> {
  const posts = await client.fetch(
    `*[_type == "post"] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category
    }`
  );

  return posts.map((post: any) => ({
    ...post,
    categorySlug: getCategorySlugFromValue(post.category),
  }));
}
