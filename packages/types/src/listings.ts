/**
 * Shared Listing Types
 *
 * Core type contracts for property listings shared across apps/web and apps/crm.
 * This contract allows both apps to reference the same listing data model without
 * cross-app imports.
 */

export type ListingStatus = 'active' | 'pending' | 'sold';

export type PropertyType =
  | 'single-family'
  | 'condo'
  | 'townhouse'
  | 'multi-family'
  | 'land';

export interface ListingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  neighborhood?: string;
}

export interface Listing {
  id: string;
  status: ListingStatus;
  address: ListingAddress;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft?: number;
  lotAcres?: number;
  propertyType: PropertyType;
  photos: string[];
  lat?: number;
  lng?: number;
  mlsNumber?: string;
  listedAt: string;
  updatedAt: string;
  attribution?: {
    broker?: string;
    office?: string;
    disclaimer?: string;
  };
}

export interface ListingFilters {
  status?: ListingStatus[];
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  sqftMin?: number;
  sqftMax?: number;
  lotAcresMin?: number;
  lotAcresMax?: number;
  propertyTypes?: PropertyType[];
}

export type ListingSortField = 'price' | 'listedAt' | 'beds' | 'sqft';
export type ListingSortOrder = 'asc' | 'desc';

export interface ListingSort {
  field: ListingSortField;
  order: ListingSortOrder;
}

export interface ListingBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ListingSearchResult {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_FILTERS: Required<ListingFilters> = {
  status: ['active'],
  priceMin: 0,
  priceMax: 10000000,
  bedsMin: 0,
  bathsMin: 0,
  sqftMin: 0,
  sqftMax: 100000,
  lotAcresMin: 0,
  lotAcresMax: 100,
  propertyTypes: ['single-family', 'condo', 'townhouse', 'multi-family', 'land'],
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  'single-family': 'Single Family',
  'condo': 'Condo',
  'townhouse': 'Townhouse',
  'multi-family': 'Multi-Family',
  'land': 'Land',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  sold: 'Sold',
};
