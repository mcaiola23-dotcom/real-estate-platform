/**
 * Walk Score Provider
 * 
 * Integrates with Walk Score API for walk, bike, and transit scores.
 * Caches results in Sanity to minimize API calls.
 */

import { DATA_CONFIG, isProviderEnabled } from '../config';
import { getWithCache, getCacheEntry } from '../cache/sanityCache';

export interface WalkScoreData {
    walkScore: number | null;
    walkDescription: string | null;
    bikeScore: number | null;
    bikeDescription: string | null;
    transitScore: number | null;
    transitDescription: string | null;
}

export interface WalkScoreResult {
    data: WalkScoreData | null;
    source: string;
    sourceUrl: string;
    fetchedAt: string;
    fromCache: boolean;
    available: boolean;
    unavailableReason?: string;
}

const WALK_SCORE_API_URL = 'https://api.walkscore.com/score';
const SOURCE = 'Walk Score';
const SOURCE_URL = 'https://www.walkscore.com';

/**
 * Get Walk Score data for a location
 * Uses caching to minimize API calls
 */
export async function getWalkScore(params: {
    townSlug: string;
    townId: string;
    townName: string;
    lat: number;
    lng: number;
    address?: string;
    neighborhoodSlug?: string;
    neighborhoodId?: string;
}): Promise<WalkScoreResult> {
    const {
        townSlug,
        townId,
        townName,
        lat,
        lng,
        address,
        neighborhoodSlug,
        neighborhoodId,
    } = params;

    // Check if Walk Score is enabled
    if (!isProviderEnabled('walkScore')) {
        return {
            data: null,
            source: SOURCE,
            sourceUrl: SOURCE_URL,
            fetchedAt: new Date().toISOString(),
            fromCache: false,
            available: false,
            unavailableReason: 'Walk Score integration not enabled',
        };
    }

    const scope = neighborhoodSlug ? 'neighborhood' : 'town';

    // Try to get cached data first
    const cached = await getCacheEntry<WalkScoreData>({
        provider: 'walkscore',
        scope,
        townSlug,
        neighborhoodSlug,
    });

    if (cached) {
        return {
            data: cached.payload,
            source: SOURCE,
            sourceUrl: cached.sourceUrl || SOURCE_URL,
            fetchedAt: cached.fetchedAt,
            fromCache: true,
            available: true,
        };
    }

    // Fetch fresh data from Walk Score API
    const result = await getWithCache<WalkScoreData>({
        provider: 'walkscore',
        scope,
        townSlug,
        townId,
        neighborhoodSlug,
        neighborhoodId,
        fetcher: async () => {
            const data = await fetchWalkScoreFromApi(lat, lng, address || townName);
            return { data, sourceUrl: SOURCE_URL };
        },
    });

    if (!result) {
        return {
            data: null,
            source: SOURCE,
            sourceUrl: SOURCE_URL,
            fetchedAt: new Date().toISOString(),
            fromCache: false,
            available: false,
            unavailableReason: 'Failed to fetch Walk Score data',
        };
    }

    return {
        data: result.data,
        source: SOURCE,
        sourceUrl: result.sourceUrl || SOURCE_URL,
        fetchedAt: result.fetchedAt,
        fromCache: result.fromCache,
        available: true,
    };
}

/**
 * Fetch Walk Score from the API
 */
async function fetchWalkScoreFromApi(
    lat: number,
    lng: number,
    address: string
): Promise<WalkScoreData> {
    const apiKey = DATA_CONFIG.walkScoreApiKey;

    if (!apiKey) {
        throw new Error('Walk Score API key not configured');
    }

    // Build the API URL
    const url = new URL(WALK_SCORE_API_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('address', address);
    url.searchParams.set('transit', '1');
    url.searchParams.set('bike', '1');
    url.searchParams.set('wsapikey', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Walk Score API error: ${response.status}`);
    }

    const data = await response.json();

    return {
        walkScore: data.walkscore ?? null,
        walkDescription: data.description ?? null,
        bikeScore: data.bike?.score ?? null,
        bikeDescription: data.bike?.description ?? null,
        transitScore: data.transit?.score ?? null,
        transitDescription: data.transit?.description ?? null,
    };
}

/**
 * Get description text for a score
 */
export function getScoreLabel(score: number | null): string {
    if (score === null) return 'Not available';
    if (score >= 90) return 'Walker\'s Paradise';
    if (score >= 70) return 'Very Walkable';
    if (score >= 50) return 'Somewhat Walkable';
    if (score >= 25) return 'Car-Dependent';
    return 'Almost All Errands Require a Car';
}

/**
 * Get CSS color class for score
 */
export function getScoreColor(score: number | null): string {
    if (score === null) return 'text-stone-400';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-orange-600';
}
