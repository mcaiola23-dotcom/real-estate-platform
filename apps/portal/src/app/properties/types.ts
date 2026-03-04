export interface PropertySearchResult {
  parcel_id: string
  listing_id?: number | null
  listing_id_str?: string | null
  address: string
  city: string
  state: string
  zip_code?: string | null
  status?: string | null
  list_price?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  square_feet?: number | null
  property_type?: string | null
  thumbnail_url?: string | null
  highlight_state: string
  days_on_market?: number | null
  centroid?: number[] | null
}

export interface PropertySearchResponse {
  summary: {
    total_results: number
    page: number
    page_size: number
    filter_hash: string
  }
  results: PropertySearchResult[]
  map: {
    highlight_ids: string[]
    selected_id?: string | null
    bbox?: number[] | null
    view?: {
      center: number[]
      zoom: number
      bounds: number[][]
    } | null
    call_to_action?: {
      endpoint: string
      params: Record<string, string>
    } | null
    clusters?: Array<Record<string, unknown>>
  }
}

export interface AiParsedFilters {
  price_min?: number
  price_max?: number
  bedrooms_min?: number
  bedrooms_max?: number
  bathrooms_min?: number
  bathrooms_max?: number
  square_feet_min?: number
  square_feet_max?: number
  cities?: string[]
  property_types?: string[]
  features?: string[]
  fuzzy_terms?: string[]
  include_off_market?: boolean
}

export interface AISearchResponse {
  success: boolean
  original_query: string
  parsed_filters: AiParsedFilters
  explanation: string
  results: Array<{
    parcel_id: string
    listing_id?: number
    address: string
    city: string
    state: string
    zip_code?: string
    bedrooms?: number
    bathrooms?: number
    square_feet?: number
    property_type?: string
    list_price?: number
    avm_estimate?: number
    status: string
    thumbnail_url?: string
    latitude?: number
    longitude?: number
    relevance_score?: number
    match_highlights?: string[]
  }>
  total_results: number
  page: number
  page_size: number
  total_pages: number
  parse_time_ms: number
  query_time_ms: number
  total_time_ms: number
  error?: string
}

export interface PropertyFilters {
  cities: string[]
  neighborhoods: string[]
  propertyTypes: string[]
  statuses: string[]
  priceMin: number
  priceMax: number
  bedroomsMin: number
  bedroomsMax: number
  bathroomsMin: number
  bathroomsMax: number
  squareFeetMin: number
  squareFeetMax: number
  lotSizeMin: number
  lotSizeMax: number
  soldYears: number
}

export type PropertySortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'beds_desc'
  | 'sqft_desc'
