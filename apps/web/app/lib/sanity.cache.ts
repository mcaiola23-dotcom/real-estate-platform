import { revalidateTag, unstable_cache } from "next/cache";

import { client } from "./sanity.client";

export const SANITY_CACHE_TAGS = {
  towns: "sanity:towns",
  neighborhoods: "sanity:neighborhoods",
  posts: "sanity:posts",
  sitemap: "sanity:sitemap",
} as const;

export type SanityCacheTag = (typeof SANITY_CACHE_TAGS)[keyof typeof SANITY_CACHE_TAGS];

interface FetchSanityCachedOptions {
  keyParts: string[];
  tags: SanityCacheTag[];
  revalidateSeconds: number;
}

type SanityQueryParams = Record<string, unknown>;

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => `${key}:${stableSerialize(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  return String(value);
}

export async function fetchSanityCached<T>(
  query: string,
  params: SanityQueryParams,
  options: FetchSanityCachedOptions
): Promise<T> {
  const cacheKey = ["sanity", ...options.keyParts, stableSerialize(params), stableSerialize(query)];
  const fetchWithCache = unstable_cache(
    async () => client.fetch<T>(query, params),
    cacheKey,
    {
      revalidate: options.revalidateSeconds,
      tags: options.tags,
    }
  );
  return fetchWithCache();
}

export function isSanityCacheTag(value: string): value is SanityCacheTag {
  return (Object.values(SANITY_CACHE_TAGS) as string[]).includes(value);
}

export function revalidateSanityTags(tags: SanityCacheTag | SanityCacheTag[]): void {
  const normalized = Array.isArray(tags) ? tags : [tags];
  for (const tag of normalized) {
    revalidateTag(tag, "max");
  }
}
