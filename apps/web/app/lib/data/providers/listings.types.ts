/**
 * Listings Types — Web App
 *
 * Re-exports shared listing types from @real-estate/types and adds
 * web-app-specific types (provider interface, search params with TenantScope).
 */

import type {
  Listing,
  ListingBounds,
  ListingFilters,
  ListingSearchResult,
  ListingSort,
  ListingStatus,
} from '@real-estate/types/listings';
import type { TenantScope } from './tenant-context';

// Re-export all shared listing types so existing web app imports work unchanged
export type {
  ListingStatus,
  PropertyType,
  ListingAddress,
  Listing,
  ListingFilters,
  ListingSortField,
  ListingSortOrder,
  ListingSort,
  ListingBounds,
  ListingSearchResult,
} from '@real-estate/types/listings';

export {
  DEFAULT_FILTERS,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
} from '@real-estate/types/listings';

// Web-app-specific types that reference TenantScope

export interface ListingSearchParams {
  scope: 'global' | 'town' | 'neighborhood';
  tenantContext?: TenantScope;
  townSlug?: string;
  neighborhoodSlug?: string;
  townSlugs?: string[];
  neighborhoodSlugs?: string[];
  bounds?: ListingBounds;
  q?: string;
  filters?: ListingFilters;
  sort?: ListingSort;
  page?: number;
  pageSize?: number;
}

export interface ListingSuggestParams {
  q: string;
  tenantContext?: TenantScope;
  townSlugs?: string[];
  status?: ListingStatus[];
  limit?: number;
}

export interface ListingsProvider {
  searchListings(params: ListingSearchParams): Promise<ListingSearchResult>;
  getListingById(id: string): Promise<Listing | null>;
  getAvailableFilters(): ListingFilters;
  suggestListings(params: ListingSuggestParams): Promise<Listing[]>;
}
