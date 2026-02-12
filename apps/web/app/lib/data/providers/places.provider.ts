/**
 * Places Provider
 * 
 * Provides POI data with two sources:
 * 1. Google Places API (when enabled with strict cost controls)
 * 2. Curated fallback from Sanity (always available)
 * 
 * Strict budget mode rules:
 * - Server-side only
 * - Max 6 results per category
 * - Limited categories (coffee, restaurants, parksTrails)
 * - Long TTL (14+ days)
 * - Minimal fields
 */

import { DATA_CONFIG, PLACES_CONFIG, isProviderEnabled } from '../config';
import { getWithCache, getCacheEntry } from '../cache/sanityCache';

export type PoiCategory = 'coffee' | 'restaurants' | 'parksTrails' | 'shopping' | 'fitness' | 'family';

export interface Poi {
    id?: string;
    name: string;
    category: PoiCategory;
    address?: string;
    rating?: number;
    url?: string;
    note?: string; // For curated POIs
    source: 'google' | 'curated';
}

export interface CuratedPoi {
    category: PoiCategory;
    name: string;
    note?: string;
    url?: string;
}

export interface PlacesResult {
    pois: Poi[];
    source: 'google' | 'curated' | 'mixed';
    sourceLabel: string;
    sourceUrl: string;
    fetchedAt: string;
    fromCache: boolean;
}

const GOOGLE_SOURCE_LABEL = 'Google Places';
const GOOGLE_SOURCE_URL = 'https://maps.google.com';
const CURATED_SOURCE_LABEL = 'Local Recommendations';

const CATEGORY_LABELS: Record<PoiCategory, string> = {
    coffee: 'Coffee & Cafés',
    restaurants: 'Restaurants',
    parksTrails: 'Parks & Trails',
    shopping: 'Shopping',
    fitness: 'Fitness & Recreation',
    family: 'Family Activities',
};

const EXCLUDED_CHAIN_KEYWORDS = [
    'mcdonald',
    'burger king',
    'wendy',
    'taco bell',
    'kfc',
    'subway',
    'popeyes',
    'arbys',
    'sonic',
    'jack in the box',
];

const LIMITED_CHAIN_KEYWORDS = [
    'starbucks',
    'dunkin',
];

const TOWN_ADDRESS_ALIASES: Record<string, string[]> = {
    // Allow sub-areas that are commonly listed as distinct in addresses
    'norwalk': ['rowayton', 'south norwalk', 'sono', 'east norwalk', 'cranbury', 'silvermine'],
    'greenwich': ['cos cob', 'old greenwich', 'riverside', 'byram', 'belle haven', 'mianus'],
    'stamford': ['springdale', 'glenbrook', 'shippan', 'north stamford', 'south end'],
    'westport': ['saugatuck', 'greens farms', 'compo'],
    'fairfield': ['southport'],
    'new-canaan': [],
    'darien': ['tokeneke'],
    'ridgefield': ['branchville', 'georgetown'],
    'wilton': ['cannondale'],
};

export function getCategoryLabel(category: PoiCategory): string {
    return CATEGORY_LABELS[category] || category;
}

/**
 * Get POIs for a location
 * Tries Google Places first if enabled, falls back to curated
 */
export async function getPois(params: {
    townSlug: string;
    townId: string;
    townName: string;
    lat: number;
    lng: number;
    curatedPois?: CuratedPoi[];
    neighborhoodSlug?: string;
    neighborhoodId?: string;
    categories?: PoiCategory[];
}): Promise<PlacesResult> {
    const {
        townSlug,
        townId,
        townName,
        lat,
        lng,
        curatedPois = [],
        neighborhoodSlug,
        neighborhoodId,
        categories = PLACES_CONFIG.categories as unknown as PoiCategory[],
    } = params;

    // Check if Google Places is enabled
    if (isProviderEnabled('googlePlaces')) {
        const googleResult = await getGooglePlacesPois({
            townSlug,
            townId,
            townName,
            lat,
            lng,
            neighborhoodSlug,
            neighborhoodId,
            categories,
        });

        if (googleResult && googleResult.pois.length > 0) {
            return googleResult;
        }
    }

    // Fall back to curated POIs
    return getCuratedPoisResult(curatedPois);
}

/**
 * Get POIs from Google Places API with caching
 */
async function getGooglePlacesPois(params: {
    townSlug: string;
    townId: string;
    townName: string;
    lat: number;
    lng: number;
    neighborhoodSlug?: string;
    neighborhoodId?: string;
    categories: PoiCategory[];
}): Promise<PlacesResult | null> {
    const { townSlug, townId, townName, lat, lng, neighborhoodSlug, neighborhoodId, categories } = params;
    const scope = neighborhoodSlug ? 'neighborhood' : 'town';

    // Try to get all categories from cache
    const allPois: Poi[] = [];
    let anyFromCache = false;
    let latestFetchedAt = new Date().toISOString();

    for (const category of categories) {
        const variant = category;
        
        // Check cache first
        const cached = await getCacheEntry<Poi[]>({
            provider: 'googlePlaces',
            scope,
            townSlug,
            neighborhoodSlug,
            variant,
        });

        if (cached) {
            allPois.push(...cached.payload);
            anyFromCache = true;
            latestFetchedAt = cached.fetchedAt;
            continue;
        }

        // Fetch from Google Places API
        const result = await getWithCache<Poi[]>({
            provider: 'googlePlaces',
            scope,
            townSlug,
            townId,
            neighborhoodSlug,
            neighborhoodId,
            variant,
            fetcher: async () => {
                const pois = await fetchGooglePlaces(lat, lng, category);
                return { data: pois, sourceUrl: GOOGLE_SOURCE_URL };
            },
        });

        if (result) {
            allPois.push(...result.data);
            if (!result.fromCache) {
                anyFromCache = false;
            }
            latestFetchedAt = result.fetchedAt;
        }
    }

    // Apply filters and de-duplication
    const filteredPois = filterPois(allPois, townSlug, townName);

    if (filteredPois.length === 0) {
        return null;
    }

    return {
        pois: filteredPois,
        source: 'google',
        sourceLabel: GOOGLE_SOURCE_LABEL,
        sourceUrl: GOOGLE_SOURCE_URL,
        fetchedAt: latestFetchedAt,
        fromCache: anyFromCache,
    };
}

/**
 * Fetch POIs from Google Places API (Nearby Search)
 * Uses strict budget mode: minimal fields, limited results
 */
async function fetchGooglePlaces(
    lat: number,
    lng: number,
    category: PoiCategory
): Promise<Poi[]> {
    const apiKey = DATA_CONFIG.googleMapsApiKey;

    if (!apiKey) {
        throw new Error('Google Maps API key not configured');
    }

    const placeType = PLACES_CONFIG.categoryTypeMap[category];
    
    // Use the Places API (new) with Nearby Search
    const url = `https://places.googleapis.com/v1/places:searchNearby`;
    
    const requestBody = {
        includedTypes: [placeType],
        maxResultCount: PLACES_CONFIG.maxResultsPerCategory,
        locationRestriction: {
            circle: {
                center: { latitude: lat, longitude: lng },
                radius: PLACES_CONFIG.searchRadius,
            },
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': PLACES_CONFIG.fields.join(','),
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Places] API error: ${response.status}`, errorText);
        // Soft-fail so the page doesn't crash; caller will fall back to curated POIs.
        return [];
    }

    const data = await response.json();
    const places = data.places || [];

    return places.map((place: {
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        rating?: number;
        websiteUri?: string;
    }) => ({
        id: place.id,
        name: place.displayName?.text || 'Unknown',
        category,
        address: place.formattedAddress,
        rating: place.rating,
        url: place.websiteUri,
        source: 'google' as const,
    }));
}

/**
 * Convert curated POIs to result format
 */
function getCuratedPoisResult(curatedPois: CuratedPoi[] | null | undefined): PlacesResult {
    // Handle null/undefined curatedPois
    const safePois = curatedPois || [];
    
    const pois: Poi[] = safePois.map((poi) => ({
        name: poi.name,
        category: poi.category,
        note: poi.note,
        url: poi.url,
        source: 'curated' as const,
    }));

    return {
        pois,
        source: 'curated',
        sourceLabel: CURATED_SOURCE_LABEL,
        sourceUrl: '',
        fetchedAt: new Date().toISOString(),
        fromCache: false,
    };
}

/**
 * Group POIs by category
 */
export function groupPoisByCategory(pois: Poi[]): Record<PoiCategory, Poi[]> {
    const grouped: Record<PoiCategory, Poi[]> = {
        coffee: [],
        restaurants: [],
        parksTrails: [],
        shopping: [],
        fitness: [],
        family: [],
    };

    for (const poi of pois) {
        if (grouped[poi.category]) {
            grouped[poi.category].push(poi);
        }
    }

    return grouped;
}

function filterPois(pois: Poi[], townSlug: string, townName: string): Poi[] {
    const townNameLower = townName.toLowerCase();
    const aliasMatches = (TOWN_ADDRESS_ALIASES[townSlug] || []).map((alias) => alias.toLowerCase());
    const chainCounts = new Map<string, number>();
    const seenKeysByCategory: Record<PoiCategory, Set<string>> = {
        coffee: new Set(),
        restaurants: new Set(),
        parksTrails: new Set(),
        shopping: new Set(),
        fitness: new Set(),
        family: new Set(),
    };

    return pois.filter((poi) => {
        // Address must match town name
        if (!matchesTown(poi.address, townNameLower, aliasMatches)) {
            return false;
        }

        const nameLower = poi.name.toLowerCase();
        const chainKey = getChainKey(nameLower);

        // Exclude lower-level fast food chains
        if (chainKey && EXCLUDED_CHAIN_KEYWORDS.some((keyword) => chainKey.includes(keyword))) {
            return false;
        }

        // Limit Starbucks/Dunkin to one per town
        if (chainKey && LIMITED_CHAIN_KEYWORDS.some((keyword) => chainKey.includes(keyword))) {
            const count = chainCounts.get(chainKey) || 0;
            if (count >= 1) {
                return false;
            }
            chainCounts.set(chainKey, count + 1);
        }

        // De-duplicate by place id (preferred) or name+address, per category
        const dedupeKey = poi.id
            ? `id:${poi.id}`
            : `name:${nameLower}|addr:${(poi.address || '').toLowerCase()}`;

        const seenKeys = seenKeysByCategory[poi.category];
        if (seenKeys.has(dedupeKey)) {
            return false;
        }
        seenKeys.add(dedupeKey);

        return true;
    });
}

function matchesTown(address: string | undefined, townNameLower: string, aliases: string[]): boolean {
    if (!address) {
        return false;
    }
    const addressLower = address.toLowerCase();
    const baseMatch =
        addressLower.includes(`, ${townNameLower}`) ||
        addressLower.includes(`${townNameLower}, ct`) ||
        addressLower.includes(` ${townNameLower},`) ||
        addressLower.includes(` ${townNameLower} `);

    if (baseMatch) {
        return true;
    }

    return aliases.some((alias) => addressLower.includes(alias));
}

function getChainKey(nameLower: string): string | null {
    for (const keyword of [...EXCLUDED_CHAIN_KEYWORDS, ...LIMITED_CHAIN_KEYWORDS]) {
        if (nameLower.includes(keyword)) {
            return keyword;
        }
    }
    return null;
}
