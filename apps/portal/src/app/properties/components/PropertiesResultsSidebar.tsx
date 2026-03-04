'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UIEvent } from 'react'
import Link from 'next/link'
import { HomeIcon } from '@heroicons/react/24/outline'

import PropertyCard from '../../../components/PropertyCard'
import type { PropertySearchResult, PropertySortOption, PropertySearchResponse } from '../types'

const INITIAL_VISIBLE_RESULTS = 24
const RESULTS_BATCH_SIZE = 24

interface PropertiesResultsSidebarProps {
  viewMode: 'list' | 'map'
  sidebarCollapsed: boolean
  viewingSaved: boolean
  searchSummary: PropertySearchResponse['summary'] | null
  sortBy: PropertySortOption
  onSortByChange: (value: PropertySortOption) => void
  loading: boolean
  sortedProperties: PropertySearchResult[]
  selectedParcelId: string | null
  onPropertySelect: (property: PropertySearchResult) => void
  onPropertyHover?: (property: PropertySearchResult) => void
}

export default function PropertiesResultsSidebar({
  viewMode,
  sidebarCollapsed,
  viewingSaved,
  searchSummary,
  sortBy,
  onSortByChange,
  loading,
  sortedProperties,
  selectedParcelId,
  onPropertySelect,
  onPropertyHover,
}: PropertiesResultsSidebarProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS)

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_RESULTS)
  }, [sortedProperties])

  const visibleProperties = useMemo(
    () => sortedProperties.slice(0, visibleCount),
    [sortedProperties, visibleCount]
  )

  const canLoadMore = visibleCount < sortedProperties.length

  const handleSidebarScroll = useCallback((event: UIEvent<HTMLElement>) => {
    if (!canLoadMore) return
    const target = event.currentTarget
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 300
    if (!nearBottom) return

    setVisibleCount((prev) => Math.min(prev + RESULTS_BATCH_SIZE, sortedProperties.length))
  }, [canLoadMore, sortedProperties.length])

  return (
    <aside
      onScroll={handleSidebarScroll}
      className={`relative w-full lg:flex-shrink-0 border-l border-stone-200 bg-white lg:h-full lg:overflow-y-auto transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-0 lg:border-l-0 lg:overflow-hidden' : 'lg:w-[520px]'
      } ${viewMode === 'map' ? 'hidden lg:block' : 'block'}`}
    >
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-500">{viewingSaved ? 'Saved Properties' : 'Results'}</p>
            <p className="text-lg font-semibold text-stone-900">
              {viewingSaved ? 'Your Favorites' : `${searchSummary?.total_results || 0} listings`}
            </p>
          </div>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as PropertySortOption)}
            className="px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="newest">Newest First</option>
            <option value="beds_desc">Most Beds</option>
            <option value="sqft_desc">Largest</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-stone-200 bg-white p-4 animate-pulse">
                <div className="h-32 bg-stone-100 rounded-xl" />
                <div className="mt-4 h-4 bg-stone-100 rounded w-2/3" />
                <div className="mt-2 h-3 bg-stone-100 rounded w-1/2" />
                <div className="mt-3 flex gap-3">
                  <div className="h-3 bg-stone-100 rounded w-12" />
                  <div className="h-3 bg-stone-100 rounded w-12" />
                  <div className="h-3 bg-stone-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProperties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">
            <HomeIcon className="mx-auto h-10 w-10 text-stone-300 mb-3" />
            No listings match your current filters. Adjust your selections and search again.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleProperties.map((property) => (
                <PropertyCard
                  key={property.parcel_id}
                  parcelId={property.parcel_id}
                  listingId={property.listing_id}
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  zipCode={property.zip_code}
                  status={property.status}
                  listPrice={property.list_price}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  squareFeet={property.square_feet}
                  propertyType={property.property_type}
                  thumbnailUrl={property.thumbnail_url}
                  isSelected={selectedParcelId === property.parcel_id}
                  onClick={() => onPropertySelect(property)}
                  onMouseEnter={() => onPropertyHover?.(property)}
                />
              ))}
            </div>

            {canLoadMore && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + RESULTS_BATCH_SIZE, sortedProperties.length))}
                  className="px-4 py-2 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                >
                  Load More ({sortedProperties.length - visibleCount} remaining)
                </button>
              </div>
            )}

            {searchSummary && searchSummary.total_results > searchSummary.page_size && (
              <div className="flex items-center justify-between text-xs text-stone-500 pt-4">
                <button
                  disabled={searchSummary.page <= 1}
                  className="px-3 py-2 rounded-full border border-stone-200 disabled:opacity-50 hover:bg-stone-50 transition-colors"
                >
                  Previous
                </button>
                <span>
                  Page {searchSummary.page} of {Math.ceil(searchSummary.total_results / searchSummary.page_size)}
                </span>
                <button
                  disabled={searchSummary.page >= Math.ceil(searchSummary.total_results / searchSummary.page_size)}
                  className="px-3 py-2 rounded-full border border-stone-200 disabled:opacity-50 hover:bg-stone-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-12 py-12 px-6 bg-stone-900 text-white rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-medium mb-4">Ready to make a move?</h3>
          <p className="text-stone-300 mb-8 leading-relaxed text-sm">
            Get personalized guidance from a local expert who knows every neighborhood.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors"
            >
              Get Home Estimate
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Contact Agent
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
