'use client'

import dynamic from 'next/dynamic'
import type { MutableRefObject } from 'react'

import type { ParcelData } from '../../../components/LeafletParcelMap'
import MapLayersPanel from '../../../components/MapLayersPanel'
import { NoResultsExperience } from '../../../components/search'
import type { AiParsedFilters } from '../types'

const LeafletParcelMap = dynamic(() => import('../../../components/LeafletParcelMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-stone-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 mx-auto"></div>
        <p className="mt-2 text-stone-500 text-sm">Loading map...</p>
      </div>
    </div>
  ),
})

export interface PropertiesMapLayers {
  neighborhoods: boolean
  schools: boolean
  flood_zones: boolean
  parcels: boolean
  heatmap: boolean
}

interface PropertiesMapPaneProps {
  viewMode: 'list' | 'map'
  parcels: ParcelData[]
  selectedParcel: ParcelData | null
  onParcelSelect: (parcel: ParcelData) => void
  onPinProperty: (parcel: ParcelData) => void
  pinnedParcelIds: Set<string>
  onViewportChange: (bounds: [number, number, number, number], zoom: number) => void
  mapRef: MutableRefObject<any>
  mapLayers: PropertiesMapLayers
  onLayerToggle: (layer: keyof PropertiesMapLayers) => void
  selectedCities: string[]
  onFilterChange: (type: string, value: any) => void
  mapLoading: boolean
  aiSearchMode: boolean
  aiSearchLoading: boolean
  searchResults: ParcelData[]
  aiSearchQuery: string
  aiParsedFilters: AiParsedFilters | null
  aiExplanation: string
  onClearAiSearch: () => void
  onTryAiSearch: (filters: AiParsedFilters) => void
  onRemoveAiFilter: (filterId: string) => void
}

export default function PropertiesMapPane({
  viewMode,
  parcels,
  selectedParcel,
  onParcelSelect,
  onPinProperty,
  pinnedParcelIds,
  onViewportChange,
  mapRef,
  mapLayers,
  onLayerToggle,
  selectedCities,
  onFilterChange,
  mapLoading,
  aiSearchMode,
  aiSearchLoading,
  searchResults,
  aiSearchQuery,
  aiParsedFilters,
  aiExplanation,
  onClearAiSearch,
  onTryAiSearch,
  onRemoveAiFilter,
}: PropertiesMapPaneProps) {
  return (
    <div className={`relative flex-1 min-h-[420px] lg:min-h-0 bg-stone-200 z-0 ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
      <LeafletParcelMap
        key="leaflet-map-stable"
        parcels={parcels}
        selectedParcel={selectedParcel || undefined}
        onParcelSelect={onParcelSelect}
        onPinProperty={onPinProperty}
        pinnedParcelIds={pinnedParcelIds}
        onViewportChange={onViewportChange}
        minZoomForParcels={15}
        className="h-full w-full"
        mapRef={mapRef}
        showNeighborhoods={mapLayers.neighborhoods}
        schools={mapLayers.schools}
        flood_zones={mapLayers.flood_zones}
        selectedCities={selectedCities}
        onFilterChange={onFilterChange}
      />

      <div className="absolute top-3 left-12 z-[25]">
        <MapLayersPanel
          layers={mapLayers}
          onLayerToggle={onLayerToggle}
        />
      </div>

      {mapLoading && (
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs text-stone-700 shadow-sm backdrop-blur">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
            Updating map
          </div>
        </div>
      )}

      {aiSearchMode && !aiSearchLoading && searchResults.length === 0 && (
        <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-20">
          <NoResultsExperience
            originalQuery={aiSearchQuery}
            parsedFilters={aiParsedFilters}
            explanation={aiExplanation}
            onClearSearch={onClearAiSearch}
            onTrySearch={onTryAiSearch}
            onRemoveFilter={onRemoveAiFilter}
          />
        </div>
      )}
    </div>
  )
}
