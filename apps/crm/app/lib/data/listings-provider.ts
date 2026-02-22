/**
 * CRM Listings Provider
 *
 * Provides listing data for the CRM Properties view.
 * Currently uses mock data; swappable to IDX/MLS provider later.
 */

import type {
  Listing,
  ListingFilters,
  ListingSearchResult,
  ListingSortField,
  ListingSortOrder,
  PropertyType,
} from '@real-estate/types/listings';
import { DEFAULT_FILTERS } from '@real-estate/types/listings';

export interface CrmListingSearchParams {
  tenantId: string;
  q?: string;
  filters?: ListingFilters;
  sortField?: ListingSortField;
  sortOrder?: ListingSortOrder;
  page?: number;
  pageSize?: number;
}

// Mock data embedded directly — keeps CRM self-contained without cross-app imports
const MOCK_LISTINGS: Listing[] = [
  {
    id: 'crm-prop-001',
    status: 'active',
    address: { street: '12 Compo Road North', city: 'Westport', state: 'CT', zip: '06880', neighborhood: 'compo-beach' },
    price: 2950000, beds: 5, baths: 4, sqft: 4200, lotAcres: 0.42,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-04.jpg'],
    lat: 41.1154, lng: -73.3475,
    mlsNumber: 'MLS-170001',
    listedAt: '2025-01-18T10:00:00Z', updatedAt: '2025-01-30T14:00:00Z',
  },
  {
    id: 'crm-prop-002',
    status: 'active',
    address: { street: '88 Riverside Avenue', city: 'Westport', state: 'CT', zip: '06880', neighborhood: 'downtown-westport' },
    price: 2125000, beds: 4, baths: 3, sqft: 3400, lotAcres: 0.28,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-01.jpg'],
    lat: 41.1412, lng: -73.3597,
    mlsNumber: 'MLS-170002',
    listedAt: '2025-02-01T10:00:00Z', updatedAt: '2025-02-10T14:00:00Z',
  },
  {
    id: 'crm-prop-003',
    status: 'active',
    address: { street: '245 Round Hill Road', city: 'Greenwich', state: 'CT', zip: '06831' },
    price: 4750000, beds: 6, baths: 5, sqft: 6800, lotAcres: 1.2,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-09.jpg'],
    lat: 41.0504, lng: -73.6281,
    mlsNumber: 'MLS-170003',
    listedAt: '2025-01-10T10:00:00Z', updatedAt: '2025-02-05T14:00:00Z',
  },
  {
    id: 'crm-prop-004',
    status: 'pending',
    address: { street: '17 Tokeneke Trail', city: 'Darien', state: 'CT', zip: '06820', neighborhood: 'tokeneke' },
    price: 3200000, beds: 5, baths: 4, sqft: 4600, lotAcres: 0.55,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-08.jpg'],
    lat: 41.0652, lng: -73.4726,
    mlsNumber: 'MLS-170004',
    listedAt: '2025-01-25T10:00:00Z', updatedAt: '2025-02-12T14:00:00Z',
  },
  {
    id: 'crm-prop-005',
    status: 'active',
    address: { street: '501 Oenoke Ridge', city: 'New Canaan', state: 'CT', zip: '06840' },
    price: 5250000, beds: 7, baths: 6, sqft: 8200, lotAcres: 2.1,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-05.jpg'],
    lat: 41.1479, lng: -73.4951,
    mlsNumber: 'MLS-170005',
    listedAt: '2025-02-05T10:00:00Z', updatedAt: '2025-02-15T14:00:00Z',
  },
  {
    id: 'crm-prop-006',
    status: 'active',
    address: { street: '33 Harbor Drive', city: 'Stamford', state: 'CT', zip: '06902', neighborhood: 'harbor-point' },
    price: 875000, beds: 2, baths: 2, sqft: 1650,
    propertyType: 'condo',
    photos: ['/visual/listings/listing-interior-09.jpg'],
    lat: 41.0534, lng: -73.5387,
    mlsNumber: 'MLS-170006',
    listedAt: '2025-02-08T10:00:00Z', updatedAt: '2025-02-14T14:00:00Z',
  },
  {
    id: 'crm-prop-007',
    status: 'sold',
    address: { street: '9 Cannon Road', city: 'Wilton', state: 'CT', zip: '06897' },
    price: 1350000, beds: 4, baths: 3, sqft: 3100, lotAcres: 0.75,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-03.jpg'],
    lat: 41.1959, lng: -73.4382,
    mlsNumber: 'MLS-170007',
    listedAt: '2024-11-15T10:00:00Z', updatedAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'crm-prop-008',
    status: 'active',
    address: { street: '140 Main Street Unit 4B', city: 'Norwalk', state: 'CT', zip: '06851', neighborhood: 'south-norwalk' },
    price: 625000, beds: 2, baths: 2, sqft: 1200,
    propertyType: 'condo',
    photos: ['/visual/listings/listing-interior-12.jpg'],
    lat: 41.0955, lng: -73.4190,
    mlsNumber: 'MLS-170008',
    listedAt: '2025-02-12T10:00:00Z', updatedAt: '2025-02-18T14:00:00Z',
  },
  {
    id: 'crm-prop-009',
    status: 'active',
    address: { street: '78 Branchville Road', city: 'Ridgefield', state: 'CT', zip: '06877' },
    price: 1875000, beds: 5, baths: 4, sqft: 4100, lotAcres: 1.8,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-04.jpg'],
    lat: 41.2812, lng: -73.4983,
    mlsNumber: 'MLS-170009',
    listedAt: '2025-01-22T10:00:00Z', updatedAt: '2025-02-08T14:00:00Z',
  },
  {
    id: 'crm-prop-010',
    status: 'active',
    address: { street: '22 Prospect Street', city: 'Fairfield', state: 'CT', zip: '06824', neighborhood: 'fairfield-beach' },
    price: 1650000, beds: 4, baths: 3, sqft: 2800, lotAcres: 0.35,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-01.jpg'],
    lat: 41.1413, lng: -73.2619,
    mlsNumber: 'MLS-170010',
    listedAt: '2025-02-03T10:00:00Z', updatedAt: '2025-02-16T14:00:00Z',
  },
  {
    id: 'crm-prop-011',
    status: 'pending',
    address: { street: '6 Lockwood Lane', city: 'Darien', state: 'CT', zip: '06820' },
    price: 2450000, beds: 4, baths: 3, sqft: 3800, lotAcres: 0.48,
    propertyType: 'single-family',
    photos: ['/visual/listings/listing-exterior-09.jpg'],
    mlsNumber: 'MLS-170011',
    listedAt: '2025-02-10T10:00:00Z', updatedAt: '2025-02-19T14:00:00Z',
  },
  {
    id: 'crm-prop-012',
    status: 'active',
    address: { street: '55 Old Kings Highway', city: 'New Canaan', state: 'CT', zip: '06840', neighborhood: 'downtown' },
    price: 1125000, beds: 3, baths: 2, sqft: 2200,
    propertyType: 'townhouse',
    photos: ['/visual/listings/listing-interior-12.jpg'],
    mlsNumber: 'MLS-170012',
    listedAt: '2025-02-14T10:00:00Z', updatedAt: '2025-02-20T14:00:00Z',
  },
];

function applyFilters(listings: Listing[], filters: ListingFilters): Listing[] {
  const merged = { ...DEFAULT_FILTERS, ...filters };
  let result = listings;

  if (merged.status && merged.status.length > 0) {
    result = result.filter((l) => merged.status!.includes(l.status));
  }
  if (merged.priceMin !== undefined) {
    result = result.filter((l) => l.price >= merged.priceMin!);
  }
  if (merged.priceMax !== undefined) {
    result = result.filter((l) => l.price <= merged.priceMax!);
  }
  if (merged.bedsMin !== undefined) {
    result = result.filter((l) => l.beds >= merged.bedsMin!);
  }
  if (merged.bathsMin !== undefined) {
    result = result.filter((l) => l.baths >= merged.bathsMin!);
  }
  if (merged.sqftMin !== undefined) {
    result = result.filter((l) => l.sqft >= merged.sqftMin!);
  }
  if (merged.sqftMax !== undefined) {
    result = result.filter((l) => l.sqft <= merged.sqftMax!);
  }
  if (merged.propertyTypes && merged.propertyTypes.length > 0) {
    result = result.filter((l) => merged.propertyTypes!.includes(l.propertyType));
  }
  return result;
}

function applySort(listings: Listing[], field: ListingSortField, order: ListingSortOrder): Listing[] {
  const sorted = [...listings];
  sorted.sort((a, b) => {
    let aVal: number;
    let bVal: number;
    switch (field) {
      case 'price': aVal = a.price; bVal = b.price; break;
      case 'beds': aVal = a.beds; bVal = b.beds; break;
      case 'sqft': aVal = a.sqft; bVal = b.sqft; break;
      case 'listedAt':
      default:
        aVal = new Date(a.listedAt).getTime();
        bVal = new Date(b.listedAt).getTime();
        break;
    }
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });
  return sorted;
}

function applyTextSearch(listings: Listing[], q: string): Listing[] {
  const query = q.trim().toLowerCase();
  if (!query) return listings;
  return listings.filter((l) => {
    const street = l.address.street.toLowerCase();
    const city = l.address.city.toLowerCase();
    const zip = l.address.zip.toLowerCase();
    const mls = (l.mlsNumber ?? '').toLowerCase();
    return street.includes(query) || city.includes(query) || zip.includes(query) || mls.includes(query);
  });
}

export function searchCrmListings(params: CrmListingSearchParams): ListingSearchResult {
  const {
    q,
    filters = {},
    sortField = 'listedAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 12,
  } = params;

  let results = MOCK_LISTINGS;
  if (q) results = applyTextSearch(results, q);
  results = applyFilters(results, filters);
  results = applySort(results, sortField, sortOrder);

  const total = results.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = results.slice(start, start + pageSize);

  return { listings: paginated, total, page, pageSize, totalPages };
}

export function getCrmListingById(propertyId: string): Listing | null {
  return MOCK_LISTINGS.find((l) => l.id === propertyId) ?? null;
}

export function getAllPropertyTypes(): PropertyType[] {
  return ['single-family', 'condo', 'townhouse', 'multi-family', 'land'];
}

/** Match score breakdown for a listing against a lead's preferences. */
export interface ListingMatchResult {
  listing: Listing;
  score: number;
  matchReasons: string[];
}

/**
 * Map CRM lead propertyType strings to listing PropertyType values.
 * Lead propertyType is freeform (from the editable modal), so we map common values.
 */
function normalizePropertyType(leadPropertyType: string | null): PropertyType | null {
  if (!leadPropertyType) return null;
  const lower = leadPropertyType.toLowerCase().trim();
  const map: Record<string, PropertyType> = {
    'single family': 'single-family',
    'single-family': 'single-family',
    'condo': 'condo',
    'condo/townhome': 'condo',
    'townhome': 'townhouse',
    'townhouse': 'townhouse',
    'multifamily': 'multi-family',
    'multi-family': 'multi-family',
    'land': 'land',
  };
  return map[lower] ?? null;
}

export interface LeadMatchCriteria {
  propertyType?: string | null;
  beds?: number | null;
  baths?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
}

/**
 * Match a lead's property preferences against listing inventory.
 * Returns listings sorted by match score (best first), limited to top N.
 * Only considers active and pending listings.
 */
export function getLeadPropertyMatches(
  criteria: LeadMatchCriteria,
  limit: number = 5
): ListingMatchResult[] {
  const { propertyType, beds, baths, priceMin, priceMax } = criteria;
  const normalizedType = normalizePropertyType(propertyType ?? null);

  // Only match against available listings (active or pending)
  const available = MOCK_LISTINGS.filter((l) => l.status === 'active' || l.status === 'pending');

  const scored: ListingMatchResult[] = [];

  for (const listing of available) {
    let score = 0;
    const matchReasons: string[] = [];

    // Price range match (2 points — most important)
    if (priceMin !== null && priceMin !== undefined && priceMax !== null && priceMax !== undefined) {
      if (listing.price >= priceMin && listing.price <= priceMax) {
        score += 2;
        matchReasons.push('Price in range');
      }
    } else if (priceMin !== null && priceMin !== undefined) {
      if (listing.price >= priceMin) {
        score += 1;
        matchReasons.push('Above minimum price');
      }
    } else if (priceMax !== null && priceMax !== undefined) {
      if (listing.price <= priceMax) {
        score += 1;
        matchReasons.push('Below maximum price');
      }
    }

    // Property type match (2 points)
    if (normalizedType && listing.propertyType === normalizedType) {
      score += 2;
      matchReasons.push('Property type match');
    }

    // Beds match (1 point — listing meets or exceeds)
    if (beds !== null && beds !== undefined && listing.beds >= beds) {
      score += 1;
      matchReasons.push(`${listing.beds}+ beds`);
    }

    // Baths match (1 point — listing meets or exceeds)
    if (baths !== null && baths !== undefined && listing.baths >= baths) {
      score += 1;
      matchReasons.push(`${listing.baths}+ baths`);
    }

    // Only include listings that match at least 1 criterion
    if (score > 0) {
      scored.push({ listing, score, matchReasons });
    }
  }

  // Sort by score descending, then by recency
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.listing.listedAt).getTime() - new Date(a.listing.listedAt).getTime();
  });

  return scored.slice(0, limit);
}
