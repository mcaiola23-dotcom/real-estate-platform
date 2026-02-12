/**
 * Sanity-based persistent cache for API responses
 * 
 * Uses the dataCacheEntry document type to store cached data.
 * This ensures cache persists across serverless function invocations.
 */

import { client } from '../../sanity.client';
import { writeClient } from '../../sanity.server';
import { CACHE_TTL, buildCacheKey } from '../config';

export type CacheProvider = 'walkscore' | 'googlePlaces' | 'acs' | 'schools' | 'listingsMock';
export type CacheScope = 'town' | 'neighborhood';

export interface CacheEntry<T = unknown> {
    key: string;
    provider: CacheProvider;
    scope: CacheScope;
    payload: T;
    fetchedAt: string;
    expiresAt: string;
    sourceUrl?: string;
}

export interface CacheGetOptions {
    provider: CacheProvider;
    scope: CacheScope;
    townSlug: string;
    neighborhoodSlug?: string;
    variant?: string;
}

export interface CacheSetOptions<T> extends CacheGetOptions {
    payload: T;
    townId: string;
    neighborhoodId?: string;
    sourceUrl?: string;
    ttlOverride?: number;
}

/**
 * Get a cached entry by key
 * Returns null if not found or expired
 */
export async function getCacheEntry<T>(options: CacheGetOptions): Promise<CacheEntry<T> | null> {
    const key = buildCacheKey(
        options.provider,
        options.scope,
        options.townSlug,
        options.neighborhoodSlug,
        options.variant
    );

    const now = new Date().toISOString();

    const entry = await client.fetch<{
        key: string;
        provider: CacheProvider;
        scope: CacheScope;
        payload: string;
        fetchedAt: string;
        expiresAt: string;
        sourceUrl?: string;
    } | null>(
        `*[_type == "dataCacheEntry" && key == $key && expiresAt > $now][0] {
            key,
            provider,
            scope,
            payload,
            fetchedAt,
            expiresAt,
            sourceUrl
        }`,
        { key, now }
    );

    if (!entry) {
        return null;
    }

    try {
        const parsedPayload = JSON.parse(entry.payload) as T;
        return {
            ...entry,
            payload: parsedPayload,
        };
    } catch {
        // Invalid JSON in cache, treat as miss
        console.error(`[Cache] Invalid JSON for key: ${key}`);
        return null;
    }
}

/**
 * Set a cache entry
 * Will upsert (create or update) the cache document
 */
export async function setCacheEntry<T>(options: CacheSetOptions<T>): Promise<void> {
    const key = buildCacheKey(
        options.provider,
        options.scope,
        options.townSlug,
        options.neighborhoodSlug,
        options.variant
    );

    const now = new Date();
    const ttl = options.ttlOverride ?? getTTLForProvider(options.provider);
    const expiresAt = new Date(now.getTime() + ttl);

    const payload = JSON.stringify(options.payload);

    // Check if entry exists
    const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "dataCacheEntry" && key == $key][0] { _id }`,
        { key }
    );

    if (existing) {
        // Update existing entry
        await writeClient
            .patch(existing._id)
            .set({
                payload,
                fetchedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                sourceUrl: options.sourceUrl,
            })
            .commit();
    } else {
        // Create new entry
        await writeClient.create({
            _type: 'dataCacheEntry',
            key,
            provider: options.provider,
            scope: options.scope,
            town: { _type: 'reference', _ref: options.townId },
            neighborhood: options.neighborhoodId
                ? { _type: 'reference', _ref: options.neighborhoodId }
                : undefined,
            payload,
            fetchedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            sourceUrl: options.sourceUrl,
        });
    }
}

/**
 * Delete a cache entry
 */
export async function deleteCacheEntry(options: CacheGetOptions): Promise<void> {
    const key = buildCacheKey(
        options.provider,
        options.scope,
        options.townSlug,
        options.neighborhoodSlug,
        options.variant
    );

    const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "dataCacheEntry" && key == $key][0] { _id }`,
        { key }
    );

    if (existing) {
        await writeClient.delete(existing._id);
    }
}

/**
 * Get the configured TTL for a provider
 */
function getTTLForProvider(provider: CacheProvider): number {
    switch (provider) {
        case 'walkscore':
            return CACHE_TTL.walkScore;
        case 'googlePlaces':
            return CACHE_TTL.googlePlaces;
        case 'acs':
            return CACHE_TTL.acs;
        case 'schools':
            return CACHE_TTL.schools;
        case 'listingsMock':
            return CACHE_TTL.listings;
        default:
            return CACHE_TTL.listings;
    }
}

/**
 * Wrapper to get data with cache-first strategy
 * If cached data exists and is not expired, return it.
 * Otherwise, fetch fresh data, cache it, and return it.
 */
export async function getWithCache<T>(
    options: CacheGetOptions & {
        townId: string;
        neighborhoodId?: string;
        fetcher: () => Promise<{ data: T; sourceUrl?: string }>;
    }
): Promise<{ data: T; fromCache: boolean; fetchedAt: string; sourceUrl?: string } | null> {
    // Try cache first
    const cached = await getCacheEntry<T>(options);
    if (cached) {
        return {
            data: cached.payload,
            fromCache: true,
            fetchedAt: cached.fetchedAt,
            sourceUrl: cached.sourceUrl,
        };
    }

    // Fetch fresh data
    try {
        const { data, sourceUrl } = await options.fetcher();
        
        // Cache the result
        await setCacheEntry({
            ...options,
            payload: data,
            sourceUrl,
        });

        return {
            data,
            fromCache: false,
            fetchedAt: new Date().toISOString(),
            sourceUrl,
        };
    } catch (error) {
        console.error(`[Cache] Fetch failed for ${options.provider}:`, error);
        return null;
    }
}
