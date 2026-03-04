import type { PropertyFilters } from './types'

export interface NeighborhoodOption {
  name: string
  city: string
}

const DEFAULT_PROPERTY_FILTERS_TEMPLATE: PropertyFilters = {
  cities: [],
  neighborhoods: [],
  propertyTypes: [],
  statuses: ['Active', 'Pending'],
  priceMin: 0,
  priceMax: 20000000,
  bedroomsMin: 0,
  bedroomsMax: 7,
  bathroomsMin: 0,
  bathroomsMax: 5,
  squareFeetMin: 0,
  squareFeetMax: 10000,
  lotSizeMin: 0,
  lotSizeMax: 10,
  soldYears: 2,
}

export function createDefaultPropertyFilters(): PropertyFilters {
  return {
    ...DEFAULT_PROPERTY_FILTERS_TEMPLATE,
    cities: [],
    neighborhoods: [],
    propertyTypes: [],
    statuses: [...DEFAULT_PROPERTY_FILTERS_TEMPLATE.statuses],
  }
}

export function clearNeighborhoodSelectionIfNoCities(filters: PropertyFilters): PropertyFilters {
  if (filters.cities.length > 0) return filters
  if (filters.neighborhoods.length === 0) return filters
  return {
    ...filters,
    neighborhoods: [],
  }
}

export function pruneNeighborhoodSelections(
  filters: PropertyFilters,
  options: NeighborhoodOption[]
): PropertyFilters {
  if (filters.neighborhoods.length === 0) return filters

  const validNeighborhoods = new Set(options.map((option) => option.name))
  const prunedNeighborhoods = filters.neighborhoods.filter((name) => validNeighborhoods.has(name))

  if (prunedNeighborhoods.length === filters.neighborhoods.length) {
    return filters
  }

  return {
    ...filters,
    neighborhoods: prunedNeighborhoods,
  }
}
