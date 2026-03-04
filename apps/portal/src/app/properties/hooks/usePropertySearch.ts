import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ParcelData } from '../../../components/LeafletParcelMap'
import type { FilterUpdate } from '../../../components/search'
import type { AISearchResponse, AiParsedFilters, PropertyFilters, PropertySearchResponse, PropertySearchResult } from '../types'

const API_BASE = '/api/portal'

interface UsePropertySearchOptions {
  filters: PropertyFilters
  searchTerm: string
  selectedNeighborhoodId: number | null
  clearMapContext: () => void
  fetchMapFeatures: (callToAction: {
    endpoint: string
    params: Record<string, string>
  }) => Promise<void>
  autoZoomToResults: (results: ParcelData[]) => void
  debugLog?: (...args: unknown[]) => void
}

const convertSearchResultToParcelData = (result: PropertySearchResult): ParcelData => {
  const coords = result.centroid || [-73.2, 41.2]
  return {
    parcel_id: result.parcel_id,
    address: result.address,
    city: result.city,
    state: result.state,
    zip_code: result.zip_code || '',
    coordinates: { lat: coords[1], lng: coords[0] },
    boundary: { type: 'Polygon', coordinates: [] },
    list_price: result.list_price ?? null,
    listing_status: result.status ?? null,
    highlight: result.highlight_state === 'highlighted',
    property_type: result.property_type ?? null,
    lot_size_acres: null,
    updated_at: null,
    thumbnail_url: result.thumbnail_url ?? null,
    isSearchResult: true,
    property_details: {
      square_feet: result.square_feet ?? null,
      bedrooms: result.bedrooms ?? null,
      bathrooms: result.bathrooms ?? null,
      acreage: null,
      year_built: null,
      property_type: result.property_type ?? null,
    },
    market_data: {
      estimated_value: result.list_price ?? null,
      last_sale_price: null,
      last_sale_date: null,
      price_per_sqft:
        result.square_feet && result.list_price
          ? result.list_price / result.square_feet
          : null,
    },
    zoning: {
      zone: null,
      use_restrictions: [],
    },
  }
}

export function usePropertySearch({
  filters,
  searchTerm,
  selectedNeighborhoodId,
  clearMapContext,
  fetchMapFeatures,
  autoZoomToResults,
  debugLog = () => {},
}: UsePropertySearchOptions) {
  const [properties, setProperties] = useState<PropertySearchResult[]>([])
  const [searchResults, setSearchResults] = useState<ParcelData[]>([])
  const [searchSummary, setSearchSummary] = useState<PropertySearchResponse['summary'] | null>(null)
  const [mapInfo, setMapInfo] = useState<PropertySearchResponse['map'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null)

  const [aiSearchMode, setAiSearchMode] = useState(false)
  const [aiSearchQuery, setAiSearchQuery] = useState('')
  const [aiSearchLoading, setAiSearchLoading] = useState(false)
  const [aiParsedFilters, setAiParsedFilters] = useState<AiParsedFilters | null>(null)
  const [aiExplanation, setAiExplanation] = useState('')

  const propertySearchAbortRef = useRef<AbortController | null>(null)
  const propertySearchRequestSeqRef = useRef(0)
  const aiSearchAbortRef = useRef<AbortController | null>(null)
  const aiSearchRequestSeqRef = useRef(0)

  useEffect(() => {
    return () => {
      propertySearchAbortRef.current?.abort()
      aiSearchAbortRef.current?.abort()
    }
  }, [])

  const buildRequestBody = useCallback(() => {
    const filterPayload: Record<string, unknown> = {}

    if (filters.cities.length > 0) {
      filterPayload.towns = filters.cities
    }

    if (filters.neighborhoods.length > 0) {
      filterPayload.neighborhoods = filters.neighborhoods
    }

    if (selectedNeighborhoodId) {
      filterPayload.neighborhood_id = selectedNeighborhoodId
    }

    if (filters.statuses.length > 0) {
      filterPayload.status = filters.statuses
    }

    if (filters.statuses.includes('Sold') && filters.soldYears !== 2) {
      filterPayload.sold_years = filters.soldYears
    }

    if (filters.priceMin > 0 || filters.priceMax < 20000000) {
      filterPayload.price_min = filters.priceMin
      filterPayload.price_max = filters.priceMax
    }

    if (filters.bedroomsMin > 0 || filters.bedroomsMax < 7) {
      filterPayload.bedrooms = {
        min: filters.bedroomsMin,
        max: filters.bedroomsMax,
      }
    }

    if (filters.bathroomsMin > 0 || filters.bathroomsMax < 5) {
      filterPayload.bathrooms = {
        min: filters.bathroomsMin,
        max: filters.bathroomsMax,
      }
    }

    if (filters.squareFeetMin > 0 || filters.squareFeetMax < 10000) {
      filterPayload.square_feet = {
        min: filters.squareFeetMin,
        max: filters.squareFeetMax,
      }
    }

    if (filters.lotSizeMin > 0 || filters.lotSizeMax < 10) {
      filterPayload.lot_size_acres = {
        min: filters.lotSizeMin,
        max: filters.lotSizeMax,
      }
    }

    if (filters.propertyTypes.length > 0) {
      filterPayload.property_types = filters.propertyTypes
    }

    return {
      query: searchTerm.trim() || undefined,
      filters: Object.keys(filterPayload).length > 0 ? filterPayload : undefined,
      page: 1,
      page_size: 50,
      include: ['list', 'map'],
    }
  }, [filters, searchTerm, selectedNeighborhoodId])

  const applyResultSet = useCallback(
    (results: PropertySearchResult[]) => {
      const resultsAsParcelData = results.map(convertSearchResultToParcelData)
      setSearchResults(resultsAsParcelData)

      if (results.length > 0) {
        setSelectedProperty(results[0])
        setSelectedParcelId(results[0].parcel_id)
        window.setTimeout(() => {
          autoZoomToResults(resultsAsParcelData)
        }, 300)
      } else {
        setSelectedProperty(null)
        setSelectedParcelId(null)
      }
    },
    [autoZoomToResults]
  )

  const fetchProperties = useCallback(async () => {
    propertySearchAbortRef.current?.abort()
    const controller = new AbortController()
    propertySearchAbortRef.current = controller
    const requestSeq = ++propertySearchRequestSeqRef.current
    setLoading(true)

    try {
      const requestBody = buildRequestBody()
      debugLog('🚀 SENDING SEARCH REQUEST:', JSON.stringify(requestBody, null, 2))
      debugLog('📊 Current filters state:', filters)

      const response = await fetch(`${API_BASE}/api/search/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      if (requestSeq !== propertySearchRequestSeqRef.current) return

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`)
      }

      const data: PropertySearchResponse = await response.json()
      if (requestSeq !== propertySearchRequestSeqRef.current) return

      setProperties(data.results)
      setSearchSummary(data.summary)
      setMapInfo(data.map)
      applyResultSet(data.results)

      if (data.map?.call_to_action) {
        await fetchMapFeatures(data.map.call_to_action)
      } else {
        clearMapContext()
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      console.error('Error fetching property search results:', error)
      setProperties([])
      setSearchResults([])
      clearMapContext()
      setSearchSummary(null)
      setMapInfo(null)
      setSelectedProperty(null)
      setSelectedParcelId(null)
    } finally {
      if (requestSeq === propertySearchRequestSeqRef.current) {
        setLoading(false)
      }
    }
  }, [applyResultSet, buildRequestBody, clearMapContext, debugLog, fetchMapFeatures, filters])

  const performAiSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return

      propertySearchAbortRef.current?.abort()
      aiSearchAbortRef.current?.abort()
      const controller = new AbortController()
      aiSearchAbortRef.current = controller
      const requestSeq = ++aiSearchRequestSeqRef.current

      setLoading(true)
      setAiSearchLoading(true)
      setAiSearchMode(true)
      setAiSearchQuery(query)

      try {
        debugLog('🤖 Performing AI search:', query)
        const response = await fetch(`${API_BASE}/api/v1/search/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            page: 1,
            page_size: 50,
          }),
          signal: controller.signal,
        })

        if (requestSeq !== aiSearchRequestSeqRef.current) return

        if (!response.ok) {
          throw new Error(`AI search failed with status ${response.status}`)
        }

        const data: AISearchResponse = await response.json()
        if (requestSeq !== aiSearchRequestSeqRef.current) return

        debugLog('🤖 AI search response:', data)

        if (!data.success) {
          console.error('AI search error:', data.error)
          setAiExplanation(data.error || 'Unable to process search')
          return
        }

        setAiParsedFilters(data.parsed_filters)
        setAiExplanation(data.explanation)

        const convertedResults: PropertySearchResult[] = data.results.map((result) => ({
          parcel_id: result.parcel_id,
          listing_id: result.listing_id || null,
          listing_id_str: result.listing_id?.toString() || null,
          address: result.address,
          city: result.city,
          state: result.state,
          zip_code: result.zip_code || null,
          status: result.status,
          list_price: result.list_price || result.avm_estimate || null,
          bedrooms: result.bedrooms || null,
          bathrooms: result.bathrooms || null,
          square_feet: result.square_feet || null,
          property_type: result.property_type || null,
          thumbnail_url: result.thumbnail_url || null,
          highlight_state: 'primary',
          centroid:
            result.latitude && result.longitude ? [result.longitude, result.latitude] : null,
        }))

        setProperties(convertedResults)
        setSearchSummary({
          total_results: data.total_results,
          page: data.page,
          page_size: data.page_size,
          filter_hash: 'ai-search',
        })

        applyResultSet(convertedResults)
        clearMapContext()
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('❌ AI search error:', error)
        setAiExplanation('An error occurred while searching. Please try again.')
      } finally {
        if (requestSeq === aiSearchRequestSeqRef.current) {
          setAiSearchLoading(false)
          setLoading(false)
        }
      }
    },
    [applyResultSet, clearMapContext, debugLog]
  )

  const rerunSearchWithFilters = useCallback(
    async (parsedFilters: AiParsedFilters | null) => {
      if (!parsedFilters) return

      propertySearchAbortRef.current?.abort()
      const controller = new AbortController()
      propertySearchAbortRef.current = controller
      const requestSeq = ++propertySearchRequestSeqRef.current

      setLoading(true)
      try {
        const filterPayload: Record<string, unknown> = {}

        if (parsedFilters.cities && parsedFilters.cities.length > 0) {
          filterPayload.towns = parsedFilters.cities
        }
        if (parsedFilters.price_min) {
          filterPayload.price_min = parsedFilters.price_min
        }
        if (parsedFilters.price_max) {
          filterPayload.price_max = parsedFilters.price_max
        }
        if (parsedFilters.bedrooms_min) {
          filterPayload.bedrooms = { min: parsedFilters.bedrooms_min }
        }
        if (parsedFilters.bathrooms_min) {
          filterPayload.bathrooms = { min: parsedFilters.bathrooms_min }
        }
        if (parsedFilters.square_feet_min) {
          filterPayload.square_feet = { min: parsedFilters.square_feet_min }
        }
        if (parsedFilters.property_types && parsedFilters.property_types.length > 0) {
          filterPayload.property_types = parsedFilters.property_types
        }

        if (!parsedFilters.include_off_market) {
          filterPayload.status = ['Active', 'Pending']
        }

        const requestBody = {
          filters: Object.keys(filterPayload).length > 0 ? filterPayload : undefined,
          page: 1,
          page_size: 50,
          include: ['list', 'map'],
        }

        debugLog('🔄 Re-running search with modified filters:', requestBody)

        const response = await fetch(`${API_BASE}/api/search/properties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        if (requestSeq !== propertySearchRequestSeqRef.current) return

        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`)
        }

        const data: PropertySearchResponse = await response.json()
        if (requestSeq !== propertySearchRequestSeqRef.current) return

        setProperties(data.results)
        setSearchSummary(data.summary)
        setMapInfo(data.map)
        applyResultSet(data.results)
        clearMapContext()
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('❌ Error re-running search:', error)
      } finally {
        if (requestSeq === propertySearchRequestSeqRef.current) {
          setLoading(false)
        }
      }
    },
    [applyResultSet, clearMapContext, debugLog]
  )

  const clearAiSearch = useCallback(() => {
    setAiSearchMode(false)
    setAiSearchQuery('')
    setAiParsedFilters(null)
    setAiExplanation('')
    void fetchProperties()
  }, [fetchProperties])

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      if (!aiParsedFilters) return

      const updatedFilters: AiParsedFilters = { ...aiParsedFilters }

      if (filterId.startsWith('city-')) {
        const cityToRemove = filterId.replace('city-', '')
        updatedFilters.cities = updatedFilters.cities?.filter((city) => city !== cityToRemove)
        if (updatedFilters.cities?.length === 0) delete updatedFilters.cities
      } else if (filterId === 'price-range' || filterId === 'price-min' || filterId === 'price-max') {
        delete updatedFilters.price_min
        delete updatedFilters.price_max
      } else if (filterId === 'bedrooms') {
        delete updatedFilters.bedrooms_min
        delete updatedFilters.bedrooms_max
      } else if (filterId === 'bathrooms') {
        delete updatedFilters.bathrooms_min
        delete updatedFilters.bathrooms_max
      } else if (filterId === 'sqft') {
        delete updatedFilters.square_feet_min
        delete updatedFilters.square_feet_max
      } else if (filterId.startsWith('type-')) {
        const typeToRemove = filterId.replace('type-', '')
        updatedFilters.property_types = updatedFilters.property_types?.filter(
          (type) => type !== typeToRemove
        )
        if (updatedFilters.property_types?.length === 0) delete updatedFilters.property_types
      } else if (filterId.startsWith('feature-')) {
        const featureToRemove = filterId.replace('feature-', '')
        updatedFilters.features = updatedFilters.features?.filter(
          (feature) => feature !== featureToRemove
        )
        if (updatedFilters.features?.length === 0) delete updatedFilters.features
      } else if (filterId.startsWith('fuzzy-')) {
        const fuzzyToRemove = filterId.replace('fuzzy-', '')
        updatedFilters.fuzzy_terms = updatedFilters.fuzzy_terms?.filter((term) => term !== fuzzyToRemove)
        if (updatedFilters.fuzzy_terms?.length === 0) delete updatedFilters.fuzzy_terms
      } else if (filterId === 'off-market') {
        delete updatedFilters.include_off_market
      }

      const hasRemainingFilters =
        Boolean(updatedFilters.cities && updatedFilters.cities.length > 0) ||
        Boolean(updatedFilters.price_min || updatedFilters.price_max) ||
        Boolean(updatedFilters.bedrooms_min || updatedFilters.bathrooms_min) ||
        Boolean(updatedFilters.square_feet_min) ||
        Boolean(updatedFilters.property_types && updatedFilters.property_types.length > 0) ||
        Boolean(updatedFilters.features && updatedFilters.features.length > 0) ||
        Boolean(updatedFilters.fuzzy_terms && updatedFilters.fuzzy_terms.length > 0)

      if (!hasRemainingFilters) {
        clearAiSearch()
        return
      }

      setAiParsedFilters(updatedFilters)
      void rerunSearchWithFilters(updatedFilters)
    },
    [aiParsedFilters, clearAiSearch, rerunSearchWithFilters]
  )

  const handleEditFilter = useCallback(
    (update: FilterUpdate) => {
      if (!aiParsedFilters) return

      const updatedFilters: AiParsedFilters = { ...aiParsedFilters }

      if (update.filterId === 'bedrooms' && update.newValue !== undefined) {
        updatedFilters.bedrooms_min = update.newValue
      } else if (update.filterId === 'bathrooms' && update.newValue !== undefined) {
        updatedFilters.bathrooms_min = update.newValue
      } else if (update.filterId === 'sqft' && update.newValue !== undefined) {
        updatedFilters.square_feet_min = update.newValue
      } else if (
        update.filterId === 'price-min' ||
        update.filterId === 'price-max' ||
        update.filterId === 'price-range'
      ) {
        if (update.newMinValue !== undefined) {
          updatedFilters.price_min = update.newMinValue || undefined
        }
        if (update.newMaxValue !== undefined) {
          updatedFilters.price_max = update.newMaxValue || undefined
        }
        if (!update.newMinValue && !update.newMaxValue) {
          delete updatedFilters.price_min
          delete updatedFilters.price_max
        }
      } else if (update.filterId.startsWith('city-') && update.newCity) {
        const oldCity = update.filterId.replace('city-', '')
        if (updatedFilters.cities) {
          const cityIndex = updatedFilters.cities.indexOf(oldCity)
          if (cityIndex >= 0) {
            updatedFilters.cities[cityIndex] = update.newCity
          }
        }
      }

      debugLog('📝 Filter edited:', update, '→', updatedFilters)
      setAiParsedFilters(updatedFilters)
      void rerunSearchWithFilters(updatedFilters)
    },
    [aiParsedFilters, debugLog, rerunSearchWithFilters]
  )

  const hasResults = useMemo(() => properties.length > 0, [properties])

  return {
    properties,
    setProperties,
    searchResults,
    setSearchResults,
    searchSummary,
    setSearchSummary,
    mapInfo,
    setMapInfo,
    loading,
    setLoading,
    selectedParcelId,
    setSelectedParcelId,
    selectedProperty,
    setSelectedProperty,
    aiSearchMode,
    setAiSearchMode,
    aiSearchQuery,
    setAiSearchQuery,
    aiSearchLoading,
    setAiSearchLoading,
    aiParsedFilters,
    setAiParsedFilters,
    aiExplanation,
    setAiExplanation,
    hasResults,
    fetchProperties,
    performAiSearch,
    clearAiSearch,
    rerunSearchWithFilters,
    handleRemoveFilter,
    handleEditFilter,
  }
}
