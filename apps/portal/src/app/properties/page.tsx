'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MapIcon, ListBulletIcon, SparklesIcon, ChevronDownIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ParcelData } from '../../components/LeafletParcelMap'
import PropertyDetailModal from '../../components/PropertyDetailModal'
import PinnedPropertiesPanel from '../../components/PinnedPropertiesPanel'
import { useMapViewportFetch } from './hooks/useMapViewportFetch'
// SearchResultsPanel removed — results now shown in sidebar
import UnifiedSearchBar from '../../components/UnifiedSearchBar'
import {
  CityTownFilter,
  NeighborhoodFilter,
  PropertyTypeCheckboxes,
  StatusFilter,
  PriceRangeSlider,
  BedroomSlider,
  BathroomSlider,
  SquareFootageSlider,
  LotSizeSlider
} from '../../components/filters'
import { AiSearchLoadingOverlay, AnimatedFilterPills, FilterSummary, SavedSearches } from '../../components/search'
import { usePropertySearch } from './hooks/usePropertySearch'
import type { PropertyFilters, PropertySearchResult, PropertySortOption } from './types'
import {
  clearNeighborhoodSelectionIfNoCities,
  createDefaultPropertyFilters,
  pruneNeighborhoodSelections
} from './filter-utils'
import { prefetchPropertyModalData } from '../../components/property-modal/usePropertyModalData'
import PropertiesMapPane, { type PropertiesMapLayers } from './components/PropertiesMapPane'
import PropertiesResultsSidebar from './components/PropertiesResultsSidebar'

const API_BASE = '/api/portal'
const debugLog = (..._args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(..._args)
  }
}
const debugWarn = (..._args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(..._args)
  }
}

const FAIRFIELD_COUNTY_TOWNS = [
  'Bethel', 'Bridgeport', 'Brookfield', 'Danbury', 'Darien',
  'Easton', 'Fairfield', 'Greenwich', 'Monroe', 'New Canaan',
  'New Fairfield', 'Newtown', 'Norwalk', 'Redding', 'Ridgefield',
  'Shelton', 'Sherman', 'Stamford', 'Stratford', 'Trumbull',
  'Weston', 'Westport', 'Wilton'
]

const PROPERTY_TYPES = ['Single Family', 'Condo', 'Multi-Family', 'Land', 'Commercial']

export default function PropertiesPage() {
  const searchParams = useSearchParams()
  const aiQueryParam = searchParams ? searchParams.get('aiQuery') : null

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list') // Default to list view (mobile-friendly)
  // filtersCollapsed replaced by showMobileFilters drawer
  const mapRef = useRef<any>(null) // Reference to Leaflet map instance for auto-zoom
  const {
    mapParcels,
    listingMarkers,
    mapLoading,
    fetchMapFeatures,
    handleViewportChange,
    clearMapContext
  } = useMapViewportFetch({
    debugLog,
    debugWarn
  })
  const [filters, setFilters] = useState<PropertyFilters>(createDefaultPropertyFilters())
  // Selected Neighborhood (ID-based filtering from map)
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<number | null>(null)

  // Auto-zoom map to fit search results
  const autoZoomToResults = useCallback((results: ParcelData[]) => {
    if (!mapRef.current || results.length === 0) return

    try {
      import('leaflet').then((L) => {
        if (!mapRef.current || !mapRef.current._leaflet_id) {
          debugWarn('⚠️ Map not ready for auto-zoom, retrying...')
          setTimeout(() => autoZoomToResults(results), 500)
          return
        }

        const validCoords = results
          .filter(r => r.coordinates.lat && r.coordinates.lng)
          .map(r => [r.coordinates.lat, r.coordinates.lng] as [number, number])

        if (validCoords.length === 0) return

        const bounds = L.latLngBounds(validCoords)
        const paddingOptions = {
          paddingTopLeft: [50, 50] as [number, number],
          paddingBottomRight: [450, 50] as [number, number],
          maxZoom: 15
        }

        try {
          mapRef.current.fitBounds(bounds, paddingOptions)
          debugLog('🎯 Auto-zoomed to fit', validCoords.length, 'results')
        } catch (fitBoundsError) {
          console.error('Error calling fitBounds:', fitBoundsError)
        }
      })
    } catch (error) {
      console.error('Error auto-zooming:', error)
    }
  }, [])

  const {
    properties,
    searchResults,
    searchSummary,
    loading,
    selectedParcelId,
    setSelectedParcelId,
    selectedProperty,
    setSelectedProperty,
    aiSearchMode,
    setAiSearchMode,
    aiSearchQuery,
    setAiSearchQuery,
    aiSearchLoading,
    aiParsedFilters,
    setAiParsedFilters,
    aiExplanation,
    fetchProperties,
    performAiSearch,
    clearAiSearch,
    rerunSearchWithFilters,
    handleRemoveFilter,
    handleEditFilter
  } = usePropertySearch({
    filters,
    searchTerm,
    selectedNeighborhoodId,
    clearMapContext,
    fetchMapFeatures,
    autoZoomToResults,
    debugLog
  })

  const [sortBy, setSortBy] = useState<PropertySortOption>('relevance')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Neighborhood options for desktop dropdown (fetched when cities change)
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<{ name: string; city: string }[]>([])
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(false)

  // View saved properties toggle + sidebar collapse
  const [viewingSaved, setViewingSaved] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Tell Leaflet to resize when sidebar collapses/expands
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: true })
      }
    }, 350) // Wait for the sidebar CSS transition (300ms) to complete
    return () => clearTimeout(timer)
  }, [sidebarCollapsed])

  useEffect(() => {
    if (filters.cities.length === 0) {
      setNeighborhoodOptions([])
      setSelectedNeighborhoodId(null)
      setFilters((prev) => clearNeighborhoodSelectionIfNoCities(prev))
      return
    }
    const fetchNeighborhoods = async () => {
      setNeighborhoodsLoading(true)
      try {
        const citiesParam = filters.cities.join(',')
        const res = await fetch(`${API_BASE}/api/neighborhoods/list?cities=${encodeURIComponent(citiesParam)}`)
        const data = await res.json()
        const options = (data.neighborhoods || []).map((n: any) => ({ name: n.name, city: n.city }))
        setNeighborhoodOptions(options)
        setFilters((prev) => pruneNeighborhoodSelections(prev, options))
      } catch {
        setNeighborhoodOptions([])
      } finally {
        setNeighborhoodsLoading(false)
      }
    }
    fetchNeighborhoods()
  }, [filters.cities])

  // Property Detail Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalListingId, setModalListingId] = useState<number | null>(null)
  const [searchResultListingIds, setSearchResultListingIds] = useState<number[]>([]) // For prev/next navigation
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | undefined>(undefined)

  // Parcel Detail Modal State (for parcels without listings)
  const [parcelModalOpen, setParcelModalOpen] = useState(false)
  const [parcelModalId, setParcelModalId] = useState<string | null>(null)

  // Pinned Properties State
  const [pinnedProperties, setPinnedProperties] = useState<Array<{
    parcel_id: string
    address_full: string
    city: string
    list_price?: number
    square_feet?: number
    bedrooms?: number
    bathrooms?: number
    property_type?: string
    listing_id?: number
  }>>([])

  // Map Layers State
  // Map Layers State
  const [mapLayers, setMapLayers] = useState<PropertiesMapLayers>({
    neighborhoods: false,
    schools: false,
    flood_zones: false,
    parcels: true,
    heatmap: false
  })

  // Initialize filters from URL params (for Load Search functionality)
  const [shouldAutoSearch, setShouldAutoSearch] = useState(false)

  useEffect(() => {
    if (!searchParams) return

    const urlFilters: Partial<typeof filters> = {}
    let hasUrlFilters = false

    // Parse cities (comma-separated)
    const citiesParam = searchParams.get('cities')
    if (citiesParam) {
      urlFilters.cities = citiesParam.split(',').map(c => c.trim())
      hasUrlFilters = true
    }

    // Parse price filters
    const priceMinParam = searchParams.get('priceMin')
    if (priceMinParam) {
      urlFilters.priceMin = parseInt(priceMinParam, 10)
      hasUrlFilters = true
    }

    const priceMaxParam = searchParams.get('priceMax')
    if (priceMaxParam) {
      urlFilters.priceMax = parseInt(priceMaxParam, 10)
      hasUrlFilters = true
    }

    // Parse bedroom filter
    const bedsMinParam = searchParams.get('bedsMin')
    if (bedsMinParam) {
      urlFilters.bedroomsMin = parseInt(bedsMinParam, 10)
      hasUrlFilters = true
    }

    // Parse AI query
    const aiQueryUrlParam = searchParams.get('q')
    if (aiQueryUrlParam) {
      setAiSearchQuery(aiQueryUrlParam)
      setAiSearchMode(true)
    }

    // Check if we should auto-execute search
    const autoSearchParam = searchParams.get('autoSearch')

    // Apply URL filters if any were found
    if (hasUrlFilters) {
      setFilters(prev => ({ ...prev, ...urlFilters }))
      debugLog('[Properties] Applied filters from URL:', urlFilters)

      // If autoSearch is set, flag that we should search after filters are applied
      if (autoSearchParam === 'true') {
        setShouldAutoSearch(true)
      }
    }
  }, [searchParams])

  // Auto-search effect: triggered after filters are set from URL
  useEffect(() => {
    if (!shouldAutoSearch) return

    const timer = window.setTimeout(() => {
      debugLog('[Properties] Auto-executing search with filters')
      setShouldAutoSearch(false)
      void fetchProperties()
    }, 50)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fetchProperties, shouldAutoSearch])

  // Handle map filter changes (from OverlayLayer/NeighborhoodLayer clicks)
  const handleMapFilterChange = useCallback((type: string, value: any) => {
    debugLog('🗺️ Map Filter Change:', type, value)

    if (type === 'city') {
      // Clear neighborhood ID if switching city
      setSelectedNeighborhoodId(null)
      setFilters(prev => ({
        ...prev,
        cities: [value],
        neighborhoods: []
      }))
      // Trigger a search on next render with updated filters
      setShouldAutoSearch(true)
    } else if (type === 'neighborhood') {
      setSelectedNeighborhoodId(value)
      setFilters(prev => ({
        ...prev,
        neighborhoods: [] // Clear string-based neighborhoods
      }))
      // Effect below handles triggering search on selectedNeighborhoodId change
    }
  }, [])

  // Trigger search when specific map interactions happen
  useEffect(() => {
    if (selectedNeighborhoodId !== null) {
      void fetchProperties()
    }
  }, [selectedNeighborhoodId, fetchProperties])

  // Handle AI query from URL parameter
  useEffect(() => {
    if (aiQueryParam) {
      void performAiSearch(aiQueryParam)
    }
  }, [aiQueryParam, performAiSearch])

  // Load initial search results on mount only (if no AI query)
  useEffect(() => {
    if (!aiQueryParam) {
      void fetchProperties()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty array = run only once on mount

  const sortedProperties = useMemo(() => {
    const sorted = [...properties]
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.list_price || 0) - (b.list_price || 0))
      case 'price_desc':
        return sorted.sort((a, b) => (b.list_price || 0) - (a.list_price || 0))
      case 'newest':
        return sorted.sort((a, b) => (a.days_on_market || 999) - (b.days_on_market || 999))
      case 'beds_desc':
        return sorted.sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0))
      case 'sqft_desc':
        return sorted.sort((a, b) => (b.square_feet || 0) - (a.square_feet || 0))
      case 'relevance':
      default: {
        const order: Record<string, number> = { Active: 0, Pending: 1, Contingent: 2, 'Off-Market': 3, Sold: 4 }
        return sorted.sort((a, b) => (order[a.status || 'Off-Market'] ?? 5) - (order[b.status || 'Off-Market'] ?? 5))
      }
    }
  }, [properties, sortBy])

  const handleApplyFilters = useCallback(() => {
    fetchProperties()
  }, [fetchProperties])

  const handlePropertyHover = useCallback((property: PropertySearchResult) => {
    void prefetchPropertyModalData({
      listingId: property.listing_id ?? undefined,
      parcelId: property.parcel_id
    })
  }, [])

  const handlePropertySelect = useCallback((property: PropertySearchResult) => {
    setSelectedProperty(property)
    setSelectedParcelId(property.parcel_id)

    // Open modal if property has a listing
    if (property.listing_id) {
      setModalListingId(property.listing_id)
      setModalOpen(true)

      // Set navigation context if in search results
      if (searchResultListingIds.length > 0) {
        const index = searchResultListingIds.indexOf(property.listing_id)
        setCurrentSearchIndex(index >= 0 ? index : undefined)
      }
    }
  }, [searchResultListingIds])

  // Handle clicking a neighbor property from the NeighborhoodMap inside a modal
  const handleNeighborPropertyClick = useCallback((parcelId: string, listingId?: number) => {
    // Close any open modals first
    setModalOpen(false)
    setModalListingId(null)
    setParcelModalOpen(false)
    setParcelModalId(null)

    // Open the right modal after a brief delay so the close animation completes
    setTimeout(() => {
      if (listingId) {
        setModalListingId(listingId)
        setModalOpen(true)
      } else {
        setParcelModalId(parcelId)
        setParcelModalOpen(true)
      }
    }, 150)
  }, [])

  const handleModalNavigate = useCallback((direction: 'prev' | 'next') => {
    if (currentSearchIndex === undefined) return

    const newIndex = direction === 'prev' ? currentSearchIndex - 1 : currentSearchIndex + 1
    if (newIndex < 0 || newIndex >= searchResultListingIds.length) return

    const newListingId = searchResultListingIds[newIndex]
    setModalListingId(newListingId)
    setCurrentSearchIndex(newIndex)
  }, [currentSearchIndex, searchResultListingIds])

  // Update search result listing IDs when properties change
  useEffect(() => {
    const listingIds = properties
      .filter(p => p.listing_id)
      .map(p => p.listing_id!)
    setSearchResultListingIds(listingIds)
  }, [properties])

  const handleParcelSelect = useCallback((parcel: ParcelData) => {
    const matched = properties.find((item) => item.parcel_id === parcel.parcel_id)
    if (matched) {
      setSelectedProperty(matched)

      // Open appropriate modal based on whether property has listing
      if (matched.listing_id) {
        // Has listing - open full listing modal
        setModalListingId(matched.listing_id)
        setModalOpen(true)

        // Set navigation context if in search results
        if (searchResultListingIds.length > 0) {
          const index = searchResultListingIds.indexOf(matched.listing_id)
          setCurrentSearchIndex(index >= 0 ? index : undefined)
        } else {
          setCurrentSearchIndex(undefined)
        }
      } else {
        // No listing - open parcel modal
        setParcelModalId(parcel.parcel_id)
        setParcelModalOpen(true)
      }
    } else {
      // No match in properties list - still open parcel modal
      setParcelModalId(parcel.parcel_id)
      setParcelModalOpen(true)
    }
    setSelectedParcelId(parcel.parcel_id)
  }, [properties, searchResultListingIds])

  // Pinned Properties Handlers
  const handlePinProperty = useCallback((parcel: ParcelData) => {
    const matched = properties.find((item) => item.parcel_id === parcel.parcel_id)
    setPinnedProperties(prev => {
      const isAlreadyPinned = prev.some(p => p.parcel_id === parcel.parcel_id)
      if (isAlreadyPinned) {
        // Unpin
        return prev.filter(p => p.parcel_id !== parcel.parcel_id)
      }

      // Pin - add to pinned list
      const pinnedData = {
        parcel_id: parcel.parcel_id,
        address_full: parcel.address,
        city: parcel.city,
        list_price: matched?.list_price || undefined,
        square_feet: parcel.property_details?.square_feet || undefined,
        bedrooms: parcel.property_details?.bedrooms || undefined,
        bathrooms: parcel.property_details?.bathrooms || undefined,
        property_type: parcel.property_details?.property_type || parcel.property_type || undefined,
        listing_id: matched?.listing_id || undefined
      }
      return [...prev, pinnedData]
    })
  }, [properties])

  const handleRemovePin = useCallback((parcelId: string) => {
    setPinnedProperties(prev => prev.filter(p => p.parcel_id !== parcelId))
  }, [])

  const handleSelectPinnedProperty = useCallback((property: typeof pinnedProperties[0]) => {
    if (property.listing_id) {
      // Open listing modal
      setModalListingId(property.listing_id)
      setModalOpen(true)

      // Set navigation to pinned properties
      const pinnedListingIds = pinnedProperties
        .filter(p => p.listing_id)
        .map(p => p.listing_id!)
      setSearchResultListingIds(pinnedListingIds)
      const index = pinnedListingIds.indexOf(property.listing_id)
      setCurrentSearchIndex(index >= 0 ? index : undefined)
    } else {
      // Open parcel modal
      setParcelModalId(property.parcel_id)
      setParcelModalOpen(true)
    }
  }, [pinnedProperties])

  const handleClearAllPins = useCallback(() => {
    setPinnedProperties([])
  }, [])

  const combinedMapParcels = useMemo(() => {
    const byParcelId = new Map<string, ParcelData>()
    for (const parcel of mapParcels) {
      byParcelId.set(parcel.parcel_id, parcel)
    }
    for (const parcel of listingMarkers) {
      byParcelId.set(parcel.parcel_id, parcel)
    }
    for (const parcel of searchResults) {
      byParcelId.set(parcel.parcel_id, parcel)
    }
    return Array.from(byParcelId.values())
  }, [searchResults, listingMarkers, mapParcels])
  const pinnedParcelIds = useMemo(
    () => new Set(pinnedProperties.map(p => p.parcel_id)),
    [pinnedProperties]
  )
  const selectedParcelData = useMemo(() => {
    if (!selectedParcelId) return null
    return combinedMapParcels.find((parcel) => parcel.parcel_id === selectedParcelId) || null
  }, [combinedMapParcels, selectedParcelId])

  // fallbackProperties removed — using sortedProperties in sidebar

  // Show AI loading overlay during AI searches
  if (aiSearchLoading) {
    return (
      <AiSearchLoadingOverlay
        isLoading={true}
        query={aiSearchQuery}
      />
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 lg:h-screen lg:overflow-hidden">
      {/* ── Compact Filter Header ── */}
      <div className="relative z-30 bg-stone-50 border-b border-stone-200 shadow-md">
        <div className="max-w-[92rem] mx-auto px-3 sm:px-5 lg:px-6 py-1.5">
          <div className="flex flex-col gap-1.5">

            {/* Row 1: Search bar + Status + Sort + Type + Search + Advanced */}
            {!aiSearchMode ? (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search bar */}
                <div className="w-full lg:flex-1 lg:max-w-2xl flex-shrink-0">
                  <UnifiedSearchBar
                    initialValue={searchTerm}
                    variant="compact"
                    onAiSearch={(query) => performAiSearch(query)}
                    onCitySelect={(city) => {
                      if (!filters.cities.includes(city)) {
                        const newFilters = { ...filters, cities: [...filters.cities, city] }
                        setFilters(newFilters)
                        setTimeout(() => {
                          const applyButton = document.querySelector('[data-apply-filters]') as HTMLButtonElement
                          if (applyButton) applyButton.click()
                        }, 100)
                      }
                    }}
                    onNeighborhoodSelect={(neighborhood, city) => {
                      if (city && !filters.cities.includes(city)) {
                        const newFilters = {
                          ...filters,
                          cities: [...filters.cities, city],
                          neighborhoods: [...filters.neighborhoods, neighborhood]
                        }
                        setFilters(newFilters)
                      } else if (!filters.neighborhoods.includes(neighborhood)) {
                        const newFilters = {
                          ...filters,
                          neighborhoods: [...filters.neighborhoods, neighborhood]
                        }
                        setFilters(newFilters)
                      }
                      setTimeout(() => {
                        const applyButton = document.querySelector('[data-apply-filters]') as HTMLButtonElement
                        if (applyButton) applyButton.click()
                      }, 100)
                    }}
                    onAddressSelect={async (suggestion) => {
                      debugLog('[Properties] onAddressSelect called with:', suggestion)
                      setSearchTerm(suggestion.value)

                      try {
                        debugLog('[Properties] Step 1: Trying database address lookup')
                        const lookupRes = await fetch(
                          `${API_BASE}/api/autocomplete/lookup?address=${encodeURIComponent(suggestion.value)}`
                        )

                        if (lookupRes.ok) {
                          const lookupData = await lookupRes.json()
                          debugLog('[Properties] Lookup result:', lookupData)

                          if (lookupData.found && lookupData.best_match) {
                            const match = lookupData.best_match
                            debugLog('[Properties] Found match via lookup:', match.address_full, 'similarity:', match.similarity)

                            if (match.similarity > 0.6) {
                              if (match.listing_id) {
                                setModalListingId(match.listing_id)
                                setModalOpen(true)
                                return
                              } else if (match.parcel_id) {
                                setParcelModalId(match.parcel_id)
                                setParcelModalOpen(true)
                                return
                              }
                            }
                          }
                        }

                        debugLog('[Properties] Step 2: Trying search with coordinates')
                        let lat: number | undefined
                        let lng: number | undefined

                        if (suggestion.place_id) {
                          const detailsRes = await fetch(
                            `${API_BASE}/api/places/details?place_id=${suggestion.place_id}`
                          )
                          if (detailsRes.ok) {
                            const details = await detailsRes.json()
                            lat = details.location?.lat
                            lng = details.location?.lng
                            debugLog('[Properties] Got coordinates from place_id:', lat, lng)
                          }
                        }

                        const response = await fetch(
                          `${API_BASE}/api/search/properties`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              query: suggestion.value,
                              filters: {
                                status: ['Active', 'Pending', 'Sold', 'Off-Market']
                              },
                              page: 1,
                              page_size: 5
                            })
                          }
                        )
                        const data = await response.json()

                        if (data.results && data.results.length > 0) {
                          let property = data.results[0]

                          if (lat && lng && data.results.length > 1) {
                            let minDist = Infinity
                            for (const p of data.results) {
                              if (p.latitude && p.longitude) {
                                const dist = Math.abs(p.latitude - lat) + Math.abs(p.longitude - lng)
                                if (dist < minDist) {
                                  minDist = dist
                                  property = p
                                }
                              }
                            }
                          }

                          if (property.listing_id) {
                            setModalListingId(property.listing_id)
                            setModalOpen(true)
                            return
                          } else if (property.parcel_id) {
                            setParcelModalId(property.parcel_id)
                            setParcelModalOpen(true)
                            return
                          }
                        }

                        if (lat && lng) {
                          const searchLat = lat
                          const searchLng = lng
                          debugLog('[Properties] Step 3: Trying coordinate search at', searchLat, searchLng)

                          const delta = 0.001
                          const bbox = `${searchLng - delta},${searchLat - delta},${searchLng + delta},${searchLat + delta}`

                          const parcelRes = await fetch(
                            `${API_BASE}/api/map/parcels?bbox=${bbox}&zoom=18&limit=10&attributes=core`
                          )

                          if (parcelRes.ok) {
                            const parcelData = await parcelRes.json()
                            debugLog('[Properties] Coordinate search results:', parcelData)

                            if (parcelData.features && parcelData.features.length > 0) {
                              let closestParcel = parcelData.features[0]
                              let minDist = Infinity

                              const getCentroid = (coords: any): [number, number] | null => {
                                try {
                                  let points: number[][] = []
                                  if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                                    points = coords[0]
                                  } else if (Array.isArray(coords[0])) {
                                    points = coords
                                  } else {
                                    return [coords[0], coords[1]]
                                  }
                                  let sumLng = 0, sumLat = 0
                                  for (const pt of points) {
                                    sumLng += pt[0]
                                    sumLat += pt[1]
                                  }
                                  return [sumLng / points.length, sumLat / points.length]
                                } catch {
                                  return null
                                }
                              }

                              for (const feature of parcelData.features) {
                                const centroid = feature.properties?.centroid
                                let pLat: number | undefined
                                let pLng: number | undefined

                                if (centroid && Array.isArray(centroid) && centroid.length >= 2) {
                                  pLng = centroid[0]
                                  pLat = centroid[1]
                                } else {
                                  const coords = feature.geometry?.coordinates
                                  if (coords) {
                                    const calculatedCentroid = getCentroid(coords)
                                    if (calculatedCentroid) {
                                      pLng = calculatedCentroid[0]
                                      pLat = calculatedCentroid[1]
                                    }
                                  }
                                }

                                if (pLat && pLng) {
                                  const dist = Math.abs(pLat - searchLat) + Math.abs(pLng - searchLng)
                                  if (dist < minDist) {
                                    minDist = dist
                                    closestParcel = feature
                                  }
                                }
                              }

                              const parcelId = closestParcel.properties?.parcel_id
                              const listingId = closestParcel.properties?.listing_id

                              debugLog('[Properties] Found closest parcel:', parcelId, 'listing:', listingId)

                              if (listingId) {
                                setModalListingId(listingId)
                                setModalOpen(true)
                              } else if (parcelId) {
                                setParcelModalId(parcelId)
                                setParcelModalOpen(true)
                              }
                            } else {
                              debugLog('[Properties] No parcels found near coordinates')
                            }
                          }
                        } else {
                          debugLog('[Properties] No property found for address:', suggestion.value)
                        }
                      } catch (error) {
                        console.error('[Properties] Error fetching property:', error)
                      }
                    }}
                    placeholder="Search addresses or describe your dream home..."
                  />
                </div>

                {/* Status tabs (desktop) */}
                <div className="hidden lg:flex rounded-full overflow-hidden border border-stone-200 bg-white">
                  {(['Active', 'Pending', 'Sold'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        const newStatuses = filters.statuses.includes(status)
                          ? filters.statuses.filter(s => s !== status)
                          : [...filters.statuses, status]
                        setFilters(prev => ({ ...prev, statuses: newStatuses }))
                      }}
                      className={`px-3 py-1 text-xs transition-colors ${
                        filters.statuses.includes(status) ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown (desktop) */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="hidden lg:block px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="newest">Newest First</option>
                  <option value="beds_desc">Most Beds</option>
                  <option value="sqft_desc">Largest</option>
                </select>

                {/* Property Type (desktop) */}
                <select
                  value={filters.propertyTypes[0] || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyTypes: e.target.value ? [e.target.value] : [] }))}
                  className="hidden lg:block px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>

                {/* Search button (desktop) */}
                <button
                  onClick={handleApplyFilters}
                  data-apply-filters
                  className="hidden lg:inline-flex px-5 py-1.5 text-xs rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                >
                  Search
                </button>

                {/* Home link */}
                <Link href="/" className="text-stone-600 hover:text-stone-900 text-xs hidden sm:inline whitespace-nowrap ml-auto">
                  ← Home
                </Link>
              </div>
            ) : aiParsedFilters && !aiSearchLoading ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <SparklesIcon className="h-5 w-5 text-stone-700" />
                    <span className="text-sm font-semibold text-stone-900">AI Search</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto sm:flex-wrap scrollbar-hide">
                    <AnimatedFilterPills
                      parsedFilters={aiParsedFilters}
                      isVisible={true}
                      onRemoveFilter={handleRemoveFilter}
                      onEditFilter={handleEditFilter}
                      availableCities={FAIRFIELD_COUNTY_TOWNS}
                      className="flex-wrap sm:flex-wrap"
                    />
                  </div>
                  <span className="text-sm text-stone-500 flex-shrink-0 hidden sm:inline">
                    &bull; {searchSummary?.total_results || 0} results
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-sm text-stone-500 sm:hidden">
                    {searchSummary?.total_results || 0} results
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={clearAiSearch} className="text-sm text-stone-500 hover:text-stone-700 underline">Clear</button>
                    <Link href="/" className="text-stone-900 hover:text-stone-700 text-sm hidden sm:inline">← Home</Link>
                  </div>
                </div>
              </div>
            ) : null}

            {/* AI Filter Summary */}
            {aiSearchMode && aiParsedFilters && !aiSearchLoading && (
              <FilterSummary
                parsedFilters={aiParsedFilters}
                resultCount={searchSummary?.total_results || 0}
                className="text-stone-500 text-sm"
              />
            )}

            {/* Row 2: Town, Price, Beds, Baths, Saved Searches, Reset (desktop) */}
            {!aiSearchMode && (
              <div className="hidden lg:flex flex-wrap items-end gap-2">
                {/* Town dropdown */}
                <details className="relative">
                  <summary className={`list-none px-4 py-1.5 text-xs rounded-full border cursor-pointer bg-white transition-colors ${
                    filters.cities.length > 0 ? 'border-stone-900 text-stone-900 font-medium' : 'border-stone-300 text-stone-600 hover:border-stone-400'
                  }`}>
                    {filters.cities.length > 0 ? `${filters.cities.length} Town${filters.cities.length > 1 ? 's' : ''}` : 'Town'}
                    <ChevronDownIcon className="inline h-3 w-3 ml-1" />
                  </summary>
                  <div className="absolute left-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white shadow-lg p-3 z-50 max-h-80 overflow-y-auto">
                    {FAIRFIELD_COUNTY_TOWNS.map(town => (
                      <label key={town} className="flex items-center gap-2 py-1 text-xs text-stone-700 cursor-pointer hover:bg-stone-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={filters.cities.includes(town)}
                          onChange={() => {
                            const newCities = filters.cities.includes(town)
                              ? filters.cities.filter(c => c !== town)
                              : [...filters.cities, town]
                            setFilters(prev => ({ ...prev, cities: newCities }))
                          }}
                          className="rounded border-stone-300"
                        />
                        {town}
                      </label>
                    ))}
                  </div>
                </details>

                {/* Neighborhood dropdown — auto-populates when town(s) selected */}
                <details className="relative">
                  <summary className={`list-none px-4 py-1.5 text-xs rounded-full border cursor-pointer bg-white transition-colors ${
                    filters.neighborhoods.length > 0 ? 'border-stone-900 text-stone-900 font-medium' :
                    filters.cities.length === 0 ? 'border-stone-200 text-stone-400 cursor-not-allowed' :
                    'border-stone-300 text-stone-600 hover:border-stone-400'
                  }`}
                    onClick={(e) => { if (filters.cities.length === 0) e.preventDefault() }}
                  >
                    {filters.neighborhoods.length > 0
                      ? `${filters.neighborhoods.length} Neighborhood${filters.neighborhoods.length > 1 ? 's' : ''}`
                      : 'Neighborhood'}
                    <ChevronDownIcon className="inline h-3 w-3 ml-1" />
                  </summary>
                  <div className="absolute left-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white shadow-lg p-3 z-50 max-h-80 overflow-y-auto">
                    {neighborhoodsLoading ? (
                      <div className="py-3 text-center text-xs text-stone-400">Loading...</div>
                    ) : neighborhoodOptions.length === 0 ? (
                      <div className="py-3 text-center text-xs text-stone-400">No neighborhoods found</div>
                    ) : (
                      neighborhoodOptions.map(n => (
                        <label key={n.name} className="flex items-center gap-2 py-1 text-xs text-stone-700 cursor-pointer hover:bg-stone-50 px-2 rounded">
                          <input
                            type="checkbox"
                            checked={filters.neighborhoods.includes(n.name)}
                            onChange={() => {
                              const newNeighborhoods = filters.neighborhoods.includes(n.name)
                                ? filters.neighborhoods.filter(nb => nb !== n.name)
                                : [...filters.neighborhoods, n.name]
                              setFilters(prev => ({ ...prev, neighborhoods: newNeighborhoods }))
                            }}
                            className="rounded border-stone-300"
                          />
                          <span>{n.name}</span>
                          {filters.cities.length > 1 && (
                            <span className="text-stone-400 text-[10px] ml-auto">{n.city}</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </details>

                {/* Price inputs */}
                <label className="flex flex-col text-xs text-stone-500">
                  Price min
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.priceMin || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: parseInt(e.target.value) || 0 }))}
                    placeholder="No min"
                    className="mt-0.5 w-28 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Price max
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.priceMax >= 20000000 ? '' : filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: parseInt(e.target.value) || 20000000 }))}
                    placeholder="No max"
                    className="mt-0.5 w-28 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>

                {/* Beds */}
                <label className="flex flex-col text-xs text-stone-500">
                  Beds
                  <select
                    value={filters.bedroomsMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, bedroomsMin: parseInt(e.target.value) }))}
                    className="mt-0.5 w-20 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  >
                    <option value={0}>Any</option>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </label>

                {/* Baths */}
                <label className="flex flex-col text-xs text-stone-500">
                  Baths
                  <select
                    value={filters.bathroomsMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, bathroomsMin: parseInt(e.target.value) }))}
                    className="mt-0.5 w-20 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  >
                    <option value={0}>Any</option>
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </label>

                {/* Advanced toggle — right after Baths */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors self-end mb-px"
                >
                  {showAdvanced ? 'Less' : 'Advanced'}
                </button>

                {/* Spacer to push save/reset right */}
                <div className="flex-1" />

                {/* Saved Searches */}
                <SavedSearches
                  currentFilters={{
                    cities: filters.cities,
                    neighborhoods: filters.neighborhoods,
                    propertyTypes: filters.propertyTypes,
                    statuses: filters.statuses,
                    priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
                    priceMax: filters.priceMax < 20000000 ? filters.priceMax : undefined,
                    bedroomsMin: filters.bedroomsMin > 0 ? filters.bedroomsMin : undefined,
                    bedroomsMax: filters.bedroomsMax < 7 ? filters.bedroomsMax : undefined,
                    bathroomsMin: filters.bathroomsMin > 0 ? filters.bathroomsMin : undefined,
                    bathroomsMax: filters.bathroomsMax < 5 ? filters.bathroomsMax : undefined,
                    squareFeetMin: filters.squareFeetMin > 0 ? filters.squareFeetMin : undefined,
                    squareFeetMax: filters.squareFeetMax < 10000 ? filters.squareFeetMax : undefined,
                  }}
                  currentAiQuery={aiSearchQuery || undefined}
                  onLoadSearch={(loadedFilters, loadedAiQuery) => {
                    if (loadedAiQuery) {
                      performAiSearch(loadedAiQuery)
                    } else {
                      setFilters({
                        ...filters,
                        cities: loadedFilters.cities || [],
                        neighborhoods: loadedFilters.neighborhoods || [],
                        propertyTypes: loadedFilters.propertyTypes || [],
                        statuses: loadedFilters.statuses || ['Active', 'Pending'],
                        priceMin: loadedFilters.priceMin || 0,
                        priceMax: loadedFilters.priceMax || 20000000,
                        bedroomsMin: loadedFilters.bedroomsMin || 0,
                        bedroomsMax: loadedFilters.bedroomsMax || 7,
                        bathroomsMin: loadedFilters.bathroomsMin || 0,
                        bathroomsMax: loadedFilters.bathroomsMax || 5,
                        squareFeetMin: loadedFilters.squareFeetMin || 0,
                        squareFeetMax: loadedFilters.squareFeetMax || 10000,
                      })
                      setAiSearchMode(false)
                      setAiSearchQuery('')
                      setShouldAutoSearch(true)
                    }
                  }}
                  showViewSaved={true}
                  viewingSaved={viewingSaved}
                  onToggleViewSaved={() => setViewingSaved(!viewingSaved)}
                />

                {/* Reset */}
                <button
                  onClick={() => {
                    setSelectedNeighborhoodId(null)
                    setFilters(createDefaultPropertyFilters())
                    setShouldAutoSearch(true)
                  }}
                  className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Mobile: Filter button + status pills */}
            {!aiSearchMode && (
              <div className="flex lg:hidden items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1"
                >
                  <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                  Filters
                </button>
                <div className="flex rounded-full overflow-hidden border border-stone-200 bg-white">
                  {(['Active', 'Pending', 'Sold'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        const newStatuses = filters.statuses.includes(status)
                          ? filters.statuses.filter(s => s !== status)
                          : [...filters.statuses, status]
                        setFilters(prev => ({ ...prev, statuses: newStatuses }))
                      }}
                      className={`px-3 py-1 text-xs transition-colors ${
                        filters.statuses.includes(status) ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 3: Advanced filters (desktop) */}
            {!aiSearchMode && showAdvanced && (
              <div className="hidden lg:flex flex-wrap items-end gap-3 border-t border-stone-200 pt-3">
                <label className="flex flex-col text-xs text-stone-500">
                  Sqft min
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.squareFeetMin || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, squareFeetMin: parseInt(e.target.value) || 0 }))}
                    placeholder="No min"
                    className="mt-0.5 w-28 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Sqft max
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.squareFeetMax >= 10000 ? '' : filters.squareFeetMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, squareFeetMax: parseInt(e.target.value) || 10000 }))}
                    placeholder="No max"
                    className="mt-0.5 w-28 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Acres min
                  <input
                    type="number"
                    inputMode="numeric"
                    step="0.1"
                    value={filters.lotSizeMin || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, lotSizeMin: parseFloat(e.target.value) || 0 }))}
                    placeholder="No min"
                    className="mt-0.5 w-28 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Acres max
                  <input
                    type="number"
                    inputMode="numeric"
                    step="0.1"
                    value={filters.lotSizeMax >= 10 ? '' : filters.lotSizeMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, lotSizeMax: parseFloat(e.target.value) || 10 }))}
                    placeholder="No max"
                    className="mt-0.5 w-28 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Main Content: Map + Sidebar ── */}
      <div className="relative flex flex-col lg:flex-row min-h-[calc(100vh-180px)] lg:h-[calc(100vh-180px)] lg:overflow-hidden">
        <PropertiesMapPane
          viewMode={viewMode}
          parcels={combinedMapParcels}
          selectedParcel={selectedParcelData}
          onParcelSelect={handleParcelSelect}
          onPinProperty={handlePinProperty}
          pinnedParcelIds={pinnedParcelIds}
          onViewportChange={handleViewportChange}
          mapRef={mapRef}
          mapLayers={mapLayers}
          onLayerToggle={(layer) => setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
          selectedCities={filters.cities}
          onFilterChange={handleMapFilterChange}
          mapLoading={mapLoading}
          aiSearchMode={aiSearchMode}
          aiSearchLoading={aiSearchLoading}
          searchResults={searchResults}
          aiSearchQuery={aiSearchQuery}
          aiParsedFilters={aiParsedFilters}
          aiExplanation={aiExplanation}
          onClearAiSearch={clearAiSearch}
          onTryAiSearch={(newFilters) => {
            setAiParsedFilters(newFilters)
            void rerunSearchWithFilters(newFilters)
          }}
          onRemoveAiFilter={handleRemoveFilter}
        />

        {/* Sidebar collapse/expand toggle — floating at the seam between map and sidebar */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-30 items-center justify-center w-5 h-12 bg-white border border-stone-200 shadow-lg hover:shadow-xl hover:bg-stone-50 active:scale-95 transition-all duration-300 rounded-l-lg ${
            sidebarCollapsed ? 'right-0' : 'right-[520px]'
          }`}
          title={sidebarCollapsed ? 'Show results' : 'Hide results'}
        >
          <ChevronDownIcon className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-300 ${sidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>

        <PropertiesResultsSidebar
          viewMode={viewMode}
          sidebarCollapsed={sidebarCollapsed}
          viewingSaved={viewingSaved}
          searchSummary={searchSummary}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          loading={loading}
          sortedProperties={sortedProperties}
          selectedParcelId={selectedParcelId}
          onPropertySelect={handlePropertySelect}
          onPropertyHover={handlePropertyHover}
        />
      </div>

      {/* Mobile View Toggle */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm transition-transform active:scale-95"
        >
          {viewMode === 'map' ? (
            <><ListBulletIcon className="h-4 w-4" /> Show List</>
          ) : (
            <><MapIcon className="h-4 w-4" /> Show Map</>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-semibold text-stone-900">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <CityTownFilter
              selectedCities={filters.cities}
              onChange={(cities) => setFilters(prev => ({ ...prev, cities }))}
            />

            {filters.cities.length > 0 && (
              <NeighborhoodFilter
                selectedCities={filters.cities}
                selectedNeighborhoods={filters.neighborhoods}
                onChange={(neighborhoods) => setFilters(prev => ({ ...prev, neighborhoods }))}
              />
            )}

            <StatusFilter
              selectedStatuses={filters.statuses}
              soldYears={filters.soldYears}
              onStatusChange={(statuses) => setFilters(prev => ({ ...prev, statuses }))}
              onSoldYearsChange={(soldYears) => setFilters(prev => ({ ...prev, soldYears }))}
            />

            <PropertyTypeCheckboxes
              selectedTypes={filters.propertyTypes}
              onChange={(propertyTypes) => setFilters(prev => ({ ...prev, propertyTypes }))}
            />

            <PriceRangeSlider
              min={filters.priceMin}
              max={filters.priceMax}
              onChange={(priceMin, priceMax) => setFilters(prev => ({ ...prev, priceMin, priceMax }))}
            />

            <BedroomSlider
              min={filters.bedroomsMin}
              max={filters.bedroomsMax}
              onChange={(bedroomsMin, bedroomsMax) => setFilters(prev => ({ ...prev, bedroomsMin, bedroomsMax }))}
            />

            <BathroomSlider
              min={filters.bathroomsMin}
              max={filters.bathroomsMax}
              onChange={(bathroomsMin, bathroomsMax) => setFilters(prev => ({ ...prev, bathroomsMin, bathroomsMax }))}
            />

            <SquareFootageSlider
              min={filters.squareFeetMin}
              max={filters.squareFeetMax}
              onChange={(squareFeetMin, squareFeetMax) => setFilters(prev => ({ ...prev, squareFeetMin, squareFeetMax }))}
            />

            <LotSizeSlider
              min={filters.lotSizeMin}
              max={filters.lotSizeMax}
              onChange={(lotSizeMin, lotSizeMax) => setFilters(prev => ({ ...prev, lotSizeMin, lotSizeMax }))}
            />

            <div className="sticky bottom-0 bg-white pt-3 border-t border-stone-200">
              <button
                onClick={() => { handleApplyFilters(); setShowMobileFilters(false) }}
                className="btn-primary w-full shadow-lg"
                data-apply-filters
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Property Detail Modal */}
      {(modalListingId || parcelModalId) && (
        <PropertyDetailModal
          listingId={modalListingId ?? undefined}
          parcelId={parcelModalId ?? undefined}
          isOpen={modalOpen || parcelModalOpen}
          onClose={() => {
            setModalOpen(false)
            setModalListingId(null)
            setParcelModalOpen(false)
            setParcelModalId(null)
            setCurrentSearchIndex(undefined)
          }}
          searchResults={modalListingId && searchResultListingIds.length > 1 ? searchResultListingIds : undefined}
          currentIndex={currentSearchIndex}
          onNavigate={handleModalNavigate}
          onPropertyClick={handleNeighborPropertyClick}
        />
      )}

      {/* Pinned Properties Panel */}
      <PinnedPropertiesPanel
        pinnedProperties={pinnedProperties}
        onRemovePin={handleRemovePin}
        onSelectProperty={handleSelectPinnedProperty}
        onClearAll={handleClearAllPins}
      />
    </div>
  )
}
