'use client'

import type { Dispatch, SetStateAction } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
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
} from '../../../components/filters'
import type { PropertyFilters } from '../types'

interface PropertiesMobileFiltersDrawerProps {
  isOpen: boolean
  filters: PropertyFilters
  setFilters: Dispatch<SetStateAction<PropertyFilters>>
  onClose: () => void
  onApplyFilters: () => void
}

export default function PropertiesMobileFiltersDrawer({
  isOpen,
  filters,
  setFilters,
  onClose,
  onApplyFilters,
}: PropertiesMobileFiltersDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <h3 className="text-lg font-semibold text-stone-900">Filters</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
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
            onClick={() => { onApplyFilters(); onClose() }}
            className="btn-primary w-full shadow-lg"
            data-apply-filters
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
