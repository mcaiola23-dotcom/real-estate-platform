/**
 * Data Module Configuration
 * 
 * Feature flags and environment configuration for data modules.
 * All API keys are server-side only - never expose to browser.
 */

// Feature flags - default to false if not explicitly enabled
export const DATA_CONFIG = {
    // Walk Score API integration
    enableWalkScore: process.env.DATA_ENABLE_WALKSCORE === 'true',
    walkScoreApiKey: process.env.WALKSCORE_API_KEY || '',

    // Google Places API integration
    enableGooglePlaces: process.env.DATA_ENABLE_GOOGLE_PLACES === 'true',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

    // Mock listings (always available in dev)
    enableListings: process.env.DATA_ENABLE_LISTINGS !== 'false', // Default true
} as const;

// TTL configuration (in milliseconds)
export const CACHE_TTL = {
    walkScore: 30 * 24 * 60 * 60 * 1000, // 30 days
    googlePlaces: 14 * 24 * 60 * 60 * 1000, // 14 days
    acs: 90 * 24 * 60 * 60 * 1000, // 90 days (manual refresh)
    schools: 90 * 24 * 60 * 60 * 1000, // 90 days (manual refresh)
    listings: 24 * 60 * 60 * 1000, // 1 day (mock data)
} as const;

// Google Places strict budget mode settings
export const PLACES_CONFIG = {
    maxResultsPerCategory: 12,
    categories: ['coffee', 'restaurants', 'parksTrails', 'fitness'] as const,
    // Map our categories to Google Places types
    categoryTypeMap: {
        coffee: 'cafe',
        restaurants: 'restaurant',
        parksTrails: 'park',
        shopping: 'shopping_mall',
        fitness: 'gym',
        family: 'amusement_park',
    } as const,
    // Minimal fields to reduce API cost
    // NOTE: For Places API v1 responses, fields must be prefixed with `places.`
    fields: [
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.websiteUri',
        'places.id',
    ],
    // Search radius in meters
    searchRadius: 8000, // ~5 miles
} as const;

// Cache key format: {provider}:{scope}:{townSlug}:{neighborhoodSlug?}:{variant}
export function buildCacheKey(
    provider: 'walkscore' | 'googlePlaces' | 'acs' | 'schools' | 'listingsMock',
    scope: 'town' | 'neighborhood',
    townSlug: string,
    neighborhoodSlug?: string,
    variant: string = 'v1'
): string {
    const parts = [provider, scope, townSlug];
    if (scope === 'neighborhood' && neighborhoodSlug) {
        parts.push(neighborhoodSlug);
    }
    parts.push(variant);
    return parts.join(':');
}

// Helper to check if a provider is available
export function isProviderEnabled(provider: 'walkScore' | 'googlePlaces' | 'listings'): boolean {
    switch (provider) {
        case 'walkScore':
            return DATA_CONFIG.enableWalkScore && !!DATA_CONFIG.walkScoreApiKey;
        case 'googlePlaces':
            return DATA_CONFIG.enableGooglePlaces && !!DATA_CONFIG.googleMapsApiKey;
        case 'listings':
            return DATA_CONFIG.enableListings;
        default:
            return false;
    }
}
