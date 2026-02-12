/**
 * Mock Listings Provider
 * 
 * Provides mock listing data for the listings UI.
 * Can be swapped with a real IDX provider later.
 */

import mockData from '../../../data/listings/mock-listings.json';
import {
    Listing,
    ListingSearchParams,
    ListingSearchResult,
    ListingsProvider,
    ListingFilters,
    DEFAULT_FILTERS,
    ListingSuggestParams,
} from './listings.types';

// Town slug to city name mapping
const TOWN_CITY_MAP: Record<string, string> = {
    'westport': 'Westport',
    'greenwich': 'Greenwich',
    'darien': 'Darien',
    'new-canaan': 'New Canaan',
    'fairfield': 'Fairfield',
    'norwalk': 'Norwalk',
    'ridgefield': 'Ridgefield',
    'stamford': 'Stamford',
    'wilton': 'Wilton',
};

class MockListingsProvider implements ListingsProvider {
    private listings: Listing[];

    constructor() {
        this.listings = mockData.listings as Listing[];
    }

    async searchListings(params: ListingSearchParams): Promise<ListingSearchResult> {
        const {
            scope,
            townSlug = '',
            neighborhoodSlug,
            townSlugs,
            neighborhoodSlugs,
            bounds,
            q,
            filters = {},
            sort = { field: 'listedAt', order: 'desc' },
            page = 1,
            pageSize = 12,
        } = params;

        // Get town name for filtering
        const townName = TOWN_CITY_MAP[townSlug];

        // Filter by scope (global, town, neighborhood)
        let filtered = this.listings.filter((listing) => {
            if (scope === 'town') {
                return listing.address.city.toLowerCase() === townName?.toLowerCase();
            }
            if (scope === 'neighborhood' && neighborhoodSlug) {
                return (
                    listing.address.city.toLowerCase() === townName?.toLowerCase() &&
                    listing.address.neighborhood === neighborhoodSlug
                );
            }
            return true;
        });

        // Global filters for town/neighborhood scopes
        if (scope === 'global') {
            if (townSlugs && townSlugs.length > 0) {
                const allowedTowns = townSlugs
                    .map((slug) => TOWN_CITY_MAP[slug]?.toLowerCase())
                    .filter(Boolean);
                filtered = filtered.filter((listing) =>
                    allowedTowns.includes(listing.address.city.toLowerCase())
                );
            }

            if (neighborhoodSlugs && neighborhoodSlugs.length > 0) {
                const allowedNeighborhoods = new Set(neighborhoodSlugs);
                filtered = filtered.filter((listing) =>
                    listing.address.neighborhood
                        ? allowedNeighborhoods.has(listing.address.neighborhood)
                        : false
                );
            }
        }

        // Bounds filtering (requires lat/lng)
        if (bounds) {
            const { north, south, east, west } = bounds;
            filtered = filtered.filter((listing) => {
                if (listing.lat === undefined || listing.lng === undefined) {
                    return false;
                }
                return (
                    listing.lat <= north &&
                    listing.lat >= south &&
                    listing.lng <= east &&
                    listing.lng >= west
                );
            });
        }

        // Text query (address/city/zip)
        if (q && q.trim().length > 0) {
            const query = q.trim().toLowerCase();
            filtered = filtered.filter((listing) => {
                const street = listing.address.street.toLowerCase();
                const city = listing.address.city.toLowerCase();
                const zip = listing.address.zip.toLowerCase();
                return (
                    street.includes(query) ||
                    city.includes(query) ||
                    zip.includes(query)
                );
            });
        }

        // Apply filters
        const mergedFilters = { ...DEFAULT_FILTERS, ...filters };

        if (mergedFilters.status && mergedFilters.status.length > 0) {
            filtered = filtered.filter((l) => mergedFilters.status!.includes(l.status));
        }

        if (mergedFilters.priceMin !== undefined) {
            filtered = filtered.filter((l) => l.price >= mergedFilters.priceMin!);
        }

        if (mergedFilters.priceMax !== undefined) {
            filtered = filtered.filter((l) => l.price <= mergedFilters.priceMax!);
        }

        if (mergedFilters.bedsMin !== undefined) {
            filtered = filtered.filter((l) => l.beds >= mergedFilters.bedsMin!);
        }

        if (mergedFilters.bathsMin !== undefined) {
            filtered = filtered.filter((l) => l.baths >= mergedFilters.bathsMin!);
        }

        if (mergedFilters.sqftMin !== undefined) {
            filtered = filtered.filter((l) => l.sqft >= mergedFilters.sqftMin!);
        }

        if (mergedFilters.sqftMax !== undefined) {
            filtered = filtered.filter((l) => l.sqft <= mergedFilters.sqftMax!);
        }

        if (mergedFilters.lotAcresMin !== undefined) {
            filtered = filtered.filter((l) => {
                if (l.lotAcres === undefined) return false;
                return l.lotAcres >= mergedFilters.lotAcresMin!;
            });
        }

        if (mergedFilters.lotAcresMax !== undefined) {
            filtered = filtered.filter((l) => {
                if (l.lotAcres === undefined) return false;
                return l.lotAcres <= mergedFilters.lotAcresMax!;
            });
        }

        if (mergedFilters.propertyTypes && mergedFilters.propertyTypes.length > 0) {
            filtered = filtered.filter((l) =>
                mergedFilters.propertyTypes!.includes(l.propertyType)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal: number | string;
            let bVal: number | string;

            switch (sort.field) {
                case 'price':
                    aVal = a.price;
                    bVal = b.price;
                    break;
                case 'beds':
                    aVal = a.beds;
                    bVal = b.beds;
                    break;
                case 'sqft':
                    aVal = a.sqft;
                    bVal = b.sqft;
                    break;
                case 'listedAt':
                default:
                    aVal = new Date(a.listedAt).getTime();
                    bVal = new Date(b.listedAt).getTime();
                    break;
            }

            if (sort.order === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        // Paginate
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const paginated = filtered.slice(startIndex, startIndex + pageSize);

        return {
            listings: paginated,
            total,
            page,
            pageSize,
            totalPages,
        };
    }

    async getListingById(id: string): Promise<Listing | null> {
        return this.listings.find((l) => l.id === id) || null;
    }

    getAvailableFilters(): ListingFilters {
        return DEFAULT_FILTERS;
    }

    async suggestListings(params: ListingSuggestParams): Promise<Listing[]> {
        const { q, townSlugs, status, limit = 8 } = params;
        const query = q.trim().toLowerCase();

        if (!query) {
            return [];
        }

        const allowedTowns = townSlugs?.length
            ? townSlugs
                  .map((slug) => TOWN_CITY_MAP[slug]?.toLowerCase())
                  .filter(Boolean)
            : null;

        const candidates = this.listings.filter((listing) => {
            if (status?.length && !status.includes(listing.status)) {
                return false;
            }

            if (allowedTowns && allowedTowns.length > 0) {
                if (!allowedTowns.includes(listing.address.city.toLowerCase())) {
                    return false;
                }
            }

            const street = listing.address.street.toLowerCase();
            const city = listing.address.city.toLowerCase();
            const zip = listing.address.zip.toLowerCase();

            return (
                street.includes(query) ||
                city.includes(query) ||
                zip.includes(query)
            );
        });

        const scored = candidates
            .map((listing) => {
                const street = listing.address.street.toLowerCase();
                const city = listing.address.city.toLowerCase();
                const zip = listing.address.zip.toLowerCase();
                const streetStarts = street.startsWith(query);
                const streetIncludes = street.includes(query);
                const cityIncludes = city.includes(query);
                const zipIncludes = zip.includes(query);

                let score = 3;
                if (streetStarts) {
                    score = 0;
                } else if (streetIncludes) {
                    score = 1;
                } else if (cityIncludes || zipIncludes) {
                    score = 2;
                }

                const recency = Math.max(
                    new Date(listing.updatedAt).getTime(),
                    new Date(listing.listedAt).getTime()
                );

                return { listing, score, recency };
            })
            .sort((a, b) => {
                if (a.score !== b.score) {
                    return a.score - b.score;
                }
                return b.recency - a.recency;
            })
            .slice(0, limit)
            .map((item) => item.listing);

        return scored;
    }
}

// Singleton instance
let providerInstance: MockListingsProvider | null = null;

export function getListingsProvider(): ListingsProvider {
    if (!providerInstance) {
        providerInstance = new MockListingsProvider();
    }
    return providerInstance;
}

/**
 * Helper to search listings
 */
export async function searchListings(
    params: ListingSearchParams
): Promise<ListingSearchResult> {
    const provider = getListingsProvider();
    return provider.searchListings(params);
}

/**
 * Helper to get a single listing
 */
export async function getListingById(id: string): Promise<Listing | null> {
    const provider = getListingsProvider();
    return provider.getListingById(id);
}

/**
 * Helper to get autocomplete suggestions
 */
export async function suggestListings(
    params: ListingSuggestParams
): Promise<Listing[]> {
    const provider = getListingsProvider();
    return provider.suggestListings(params);
}

/**
 * Format price for display
 */
export function formatListingPrice(price: number): string {
    if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
}

/**
 * Format full price
 */
export function formatFullPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(price);
}
