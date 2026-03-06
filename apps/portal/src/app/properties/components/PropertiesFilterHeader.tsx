'use client'

import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { SparklesIcon, ChevronDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import UnifiedSearchBar, { type AutocompleteSuggestion } from '../../../components/UnifiedSearchBar'
import { AnimatedFilterPills, FilterSummary, SavedSearches } from '../../../components/search'
import type { FilterUpdate, SearchFilters } from '../../../components/search'
import type { RecentPropertyEntry } from '../../../components/unified-search/history'
import type { AiParsedFilters, PropertyFilters, PropertySortOption } from '../types'

interface PropertiesFilterHeaderProps {
  searchTerm: string
  aiSearchMode: boolean
  aiParsedFilters: AiParsedFilters | null
  aiSearchLoading: boolean
  aiSearchQuery: string
  searchSummary: { total_results: number } | null
  filters: PropertyFilters
  sortBy: PropertySortOption
  showAdvanced: boolean
  neighborhoodsLoading: boolean
  neighborhoodOptions: Array<{ name: string; city: string }>
  viewingSaved: boolean
  fairfieldCountyTowns: string[]
  propertyTypes: string[]
  setFilters: Dispatch<SetStateAction<PropertyFilters>>
  setSortBy: Dispatch<SetStateAction<PropertySortOption>>
  setShowAdvanced: Dispatch<SetStateAction<boolean>>
  onAiSearch: (query: string) => void
  onAddressSelect: (suggestion: AutocompleteSuggestion) => void
  onRecentPropertySelect: (recentProperty: RecentPropertyEntry) => void
  onApplyFilters: () => void
  onRemoveAiFilter: (filterId: string) => void
  onEditAiFilter: (update: FilterUpdate) => void
  onClearAiSearch: () => void
  onLoadSavedSearch: (loadedFilters: SearchFilters, loadedAiQuery?: string) => void
  onToggleViewSaved: () => void
  onResetFilters: () => void
  onOpenMobileFilters: () => void
}

export default function PropertiesFilterHeader({
  searchTerm,
  aiSearchMode,
  aiParsedFilters,
  aiSearchLoading,
  aiSearchQuery,
  searchSummary,
  filters,
  sortBy,
  showAdvanced,
  neighborhoodsLoading,
  neighborhoodOptions,
  viewingSaved,
  fairfieldCountyTowns,
  propertyTypes,
  setFilters,
  setSortBy,
  setShowAdvanced,
  onAiSearch,
  onAddressSelect,
  onRecentPropertySelect,
  onApplyFilters,
  onRemoveAiFilter,
  onEditAiFilter,
  onClearAiSearch,
  onLoadSavedSearch,
  onToggleViewSaved,
  onResetFilters,
  onOpenMobileFilters,
}: PropertiesFilterHeaderProps) {
  return (
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
                  onAiSearch={onAiSearch}
                  onCitySelect={(city) => {
                    setFilters((prev) => {
                      if (prev.cities.includes(city)) return prev
                      return { ...prev, cities: [...prev.cities, city] }
                    })
                    setTimeout(() => {
                      const applyButton = document.querySelector('[data-apply-filters]') as HTMLButtonElement | null
                      applyButton?.click()
                    }, 100)
                  }}
                  onNeighborhoodSelect={(neighborhood, city) => {
                    setFilters((prev) => {
                      if (city && !prev.cities.includes(city)) {
                        return {
                          ...prev,
                          cities: [...prev.cities, city],
                          neighborhoods: prev.neighborhoods.includes(neighborhood)
                            ? prev.neighborhoods
                            : [...prev.neighborhoods, neighborhood]
                        }
                      }

                      if (!prev.neighborhoods.includes(neighborhood)) {
                        return {
                          ...prev,
                          neighborhoods: [...prev.neighborhoods, neighborhood]
                        }
                      }

                      return prev
                    })

                    setTimeout(() => {
                      const applyButton = document.querySelector('[data-apply-filters]') as HTMLButtonElement | null
                      applyButton?.click()
                    }, 100)
                  }}
                  onAddressSelect={onAddressSelect}
                  onRecentPropertySelect={onRecentPropertySelect}
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
                        ? filters.statuses.filter((selectedStatus) => selectedStatus !== status)
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
                onChange={(e) => setSortBy(e.target.value as PropertySortOption)}
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
                {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>

              {/* Search button (desktop) */}
              <button
                onClick={onApplyFilters}
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
                    onRemoveFilter={onRemoveAiFilter}
                    onEditFilter={onEditAiFilter}
                    availableCities={fairfieldCountyTowns}
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
                  <button onClick={onClearAiSearch} className="text-sm text-stone-500 hover:text-stone-700 underline">Clear</button>
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
                  {fairfieldCountyTowns.map(town => (
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
                    neighborhoodOptions.map((option) => (
                      <label key={option.name} className="flex items-center gap-2 py-1 text-xs text-stone-700 cursor-pointer hover:bg-stone-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={filters.neighborhoods.includes(option.name)}
                          onChange={() => {
                            const newNeighborhoods = filters.neighborhoods.includes(option.name)
                              ? filters.neighborhoods.filter(nb => nb !== option.name)
                              : [...filters.neighborhoods, option.name]
                            setFilters(prev => ({ ...prev, neighborhoods: newNeighborhoods }))
                          }}
                          className="rounded border-stone-300"
                        />
                        <span>{option.name}</span>
                        {filters.cities.length > 1 && (
                          <span className="text-stone-400 text-[10px] ml-auto">{option.city}</span>
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
                onLoadSearch={onLoadSavedSearch}
                showViewSaved={true}
                viewingSaved={viewingSaved}
                onToggleViewSaved={onToggleViewSaved}
              />

              {/* Reset */}
              <button
                onClick={onResetFilters}
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
                onClick={onOpenMobileFilters}
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
  )
}
