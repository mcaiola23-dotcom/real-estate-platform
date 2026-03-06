'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { MapIcon, ListBulletIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import type { ParcelData } from '../../components/LeafletParcelMap'
import PropertyDetailModal from '../../components/PropertyDetailModal'
import PinnedPropertiesPanel from '../../components/PinnedPropertiesPanel'
import { useMapViewportFetch } from './hooks/useMapViewportFetch'
import { useAddressSelection } from './hooks/useAddressSelection'
import { AiSearchLoadingOverlay } from '../../components/search'
import { usePropertySearch } from './hooks/usePropertySearch'
import type { PropertyFilters, PropertySearchResult, PropertySortOption } from './types'
import {
  clearNeighborhoodSelectionIfNoCities,
  createDefaultPropertyFilters,
  pruneNeighborhoodSelections
} from './filter-utils'
import { prefetchPropertyModalData } from '../../components/property-modal/usePropertyModalData'
import { addRecentPropertyView, type RecentPropertyEntry } from '../../components/unified-search/history'
import PropertiesMapPane, { type PropertiesMapLayers } from './components/PropertiesMapPane'
import PropertiesResultsSidebar from './components/PropertiesResultsSidebar'
import PropertiesFilterHeader from './components/PropertiesFilterHeader'
import PropertiesMobileFiltersDrawer from './components/PropertiesMobileFiltersDrawer'
import type { SearchFilters } from '../../components/search'

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

  const openListingModal = useCallback(({
    listingId,
    parcelId,
    address,
    city,
    status
  }: {
    listingId: number
    parcelId?: string
    address?: string
    city?: string
    status?: string
  }) => {
    setParcelModalOpen(false)
    setParcelModalId(null)
    setModalListingId(listingId)
    setModalOpen(true)

    if (address) {
      addRecentPropertyView({
        parcelId,
        listingId,
        address,
        city,
        status
      })
    }
  }, [])

  const openParcelModal = useCallback(({
    parcelId,
    listingId,
    address,
    city,
    status
  }: {
    parcelId: string
    listingId?: number
    address?: string
    city?: string
    status?: string
  }) => {
    setModalOpen(false)
    setModalListingId(null)
    setParcelModalId(parcelId)
    setParcelModalOpen(true)

    addRecentPropertyView({
      parcelId,
      listingId,
      address: address || parcelId,
      city,
      status
    })
  }, [])

  const handleAddressSelect = useAddressSelection({
    apiBase: API_BASE,
    debugLog,
    onSearchTermChange: setSearchTerm,
    onOpenListing: openListingModal,
    onOpenParcel: openParcelModal
  })

  const handleRecentPropertySelect = useCallback((recentProperty: RecentPropertyEntry) => {
    const matchedProperty =
      (recentProperty.listingId
        ? properties.find((item) => item.listing_id === recentProperty.listingId)
        : null) ||
      (recentProperty.parcelId
        ? properties.find((item) => item.parcel_id === recentProperty.parcelId)
        : null)

    if (matchedProperty) {
      setSelectedProperty(matchedProperty)
      setSelectedParcelId(matchedProperty.parcel_id)
    } else if (recentProperty.parcelId) {
      setSelectedParcelId(recentProperty.parcelId)
    }

    if (recentProperty.listingId) {
      openListingModal({
        listingId: recentProperty.listingId,
        parcelId: recentProperty.parcelId,
        address: recentProperty.address,
        city: recentProperty.city,
        status: recentProperty.status
      })

      if (searchResultListingIds.length > 0) {
        const index = searchResultListingIds.indexOf(recentProperty.listingId)
        setCurrentSearchIndex(index >= 0 ? index : undefined)
      } else {
        setCurrentSearchIndex(undefined)
      }
      return
    }

    if (recentProperty.parcelId) {
      openParcelModal({
        parcelId: recentProperty.parcelId,
        address: recentProperty.address,
        city: recentProperty.city,
        status: recentProperty.status
      })
      setCurrentSearchIndex(undefined)
    }
  }, [openListingModal, openParcelModal, properties, searchResultListingIds, setSelectedParcelId, setSelectedProperty])

  const handleLoadSavedSearch = useCallback((loadedFilters: SearchFilters, loadedAiQuery?: string) => {
    if (loadedAiQuery) {
      performAiSearch(loadedAiQuery)
      return
    }

    setFilters(prev => ({
      ...prev,
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
    }))
    setAiSearchMode(false)
    setAiSearchQuery('')
    setShouldAutoSearch(true)
  }, [performAiSearch, setAiSearchMode, setAiSearchQuery])

  const handleResetFilters = useCallback(() => {
    setSelectedNeighborhoodId(null)
    setFilters(createDefaultPropertyFilters())
    setShouldAutoSearch(true)
  }, [])

  const handleToggleViewSaved = useCallback(() => {
    setViewingSaved((prev) => !prev)
  }, [])

  const handlePropertySelect = useCallback((property: PropertySearchResult) => {
    setSelectedProperty(property)
    setSelectedParcelId(property.parcel_id)

    // Open modal if property has a listing
    if (property.listing_id) {
      openListingModal({
        listingId: property.listing_id,
        parcelId: property.parcel_id,
        address: property.address,
        city: property.city,
        status: property.status || undefined
      })

      // Set navigation context if in search results
      if (searchResultListingIds.length > 0) {
        const index = searchResultListingIds.indexOf(property.listing_id)
        setCurrentSearchIndex(index >= 0 ? index : undefined)
      }
    } else {
      openParcelModal({
        parcelId: property.parcel_id,
        address: property.address,
        city: property.city,
        status: property.status || undefined
      })
      setCurrentSearchIndex(undefined)
    }
  }, [openListingModal, openParcelModal, searchResultListingIds, setSelectedParcelId, setSelectedProperty])

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
        const matchedProperty = properties.find((item) => item.listing_id === listingId)
        openListingModal({
          listingId,
          parcelId,
          address: matchedProperty?.address,
          city: matchedProperty?.city,
          status: matchedProperty?.status || undefined
        })
      } else {
        const matchedProperty = properties.find((item) => item.parcel_id === parcelId)
        openParcelModal({
          parcelId,
          address: matchedProperty?.address,
          city: matchedProperty?.city,
          status: matchedProperty?.status || undefined
        })
      }
    }, 150)
  }, [openListingModal, openParcelModal, properties])

  const handleModalNavigate = useCallback((direction: 'prev' | 'next') => {
    if (currentSearchIndex === undefined) return

    const newIndex = direction === 'prev' ? currentSearchIndex - 1 : currentSearchIndex + 1
    if (newIndex < 0 || newIndex >= searchResultListingIds.length) return

    const newListingId = searchResultListingIds[newIndex]
    const matchedProperty = properties.find((item) => item.listing_id === newListingId)
    openListingModal({
      listingId: newListingId,
      parcelId: matchedProperty?.parcel_id,
      address: matchedProperty?.address,
      city: matchedProperty?.city,
      status: matchedProperty?.status || undefined
    })
    if (matchedProperty) {
      setSelectedProperty(matchedProperty)
      setSelectedParcelId(matchedProperty.parcel_id)
    }
    setCurrentSearchIndex(newIndex)
  }, [currentSearchIndex, openListingModal, properties, searchResultListingIds, setSelectedParcelId, setSelectedProperty])

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
        openListingModal({
          listingId: matched.listing_id,
          parcelId: matched.parcel_id,
          address: matched.address,
          city: matched.city,
          status: matched.status || undefined
        })

        // Set navigation context if in search results
        if (searchResultListingIds.length > 0) {
          const index = searchResultListingIds.indexOf(matched.listing_id)
          setCurrentSearchIndex(index >= 0 ? index : undefined)
        } else {
          setCurrentSearchIndex(undefined)
        }
      } else {
        // No listing - open parcel modal
        openParcelModal({
          parcelId: parcel.parcel_id,
          address: matched.address || parcel.address,
          city: matched.city || parcel.city,
          status: matched.status || parcel.listing_status || undefined
        })
      }
    } else {
      // No match in properties list - still open parcel modal
      openParcelModal({
        parcelId: parcel.parcel_id,
        address: parcel.address,
        city: parcel.city,
        status: parcel.listing_status || undefined
      })
    }
    setSelectedParcelId(parcel.parcel_id)
  }, [openListingModal, openParcelModal, properties, searchResultListingIds, setSelectedParcelId, setSelectedProperty])

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
      openListingModal({
        listingId: property.listing_id,
        parcelId: property.parcel_id,
        address: property.address_full,
        city: property.city
      })

      // Set navigation to pinned properties
      const pinnedListingIds = pinnedProperties
        .filter(p => p.listing_id)
        .map(p => p.listing_id!)
      setSearchResultListingIds(pinnedListingIds)
      const index = pinnedListingIds.indexOf(property.listing_id)
      setCurrentSearchIndex(index >= 0 ? index : undefined)
    } else {
      // Open parcel modal
      openParcelModal({
        parcelId: property.parcel_id,
        address: property.address_full,
        city: property.city
      })
    }
  }, [openListingModal, openParcelModal, pinnedProperties])

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
      <PropertiesFilterHeader
        searchTerm={searchTerm}
        aiSearchMode={aiSearchMode}
        aiParsedFilters={aiParsedFilters}
        aiSearchLoading={aiSearchLoading}
        aiSearchQuery={aiSearchQuery}
        searchSummary={searchSummary}
        filters={filters}
        sortBy={sortBy}
        showAdvanced={showAdvanced}
        neighborhoodsLoading={neighborhoodsLoading}
        neighborhoodOptions={neighborhoodOptions}
        viewingSaved={viewingSaved}
        fairfieldCountyTowns={FAIRFIELD_COUNTY_TOWNS}
        propertyTypes={PROPERTY_TYPES}
        setFilters={setFilters}
        setSortBy={setSortBy}
        setShowAdvanced={setShowAdvanced}
        onAiSearch={performAiSearch}
        onAddressSelect={handleAddressSelect}
        onRecentPropertySelect={handleRecentPropertySelect}
        onApplyFilters={handleApplyFilters}
        onRemoveAiFilter={handleRemoveFilter}
        onEditAiFilter={handleEditFilter}
        onClearAiSearch={clearAiSearch}
        onLoadSavedSearch={handleLoadSavedSearch}
        onToggleViewSaved={handleToggleViewSaved}
        onResetFilters={handleResetFilters}
        onOpenMobileFilters={() => setShowMobileFilters(true)}
      />

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
      <PropertiesMobileFiltersDrawer
        isOpen={showMobileFilters}
        filters={filters}
        setFilters={setFilters}
        onClose={() => setShowMobileFilters(false)}
        onApplyFilters={handleApplyFilters}
      />

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
