'use client'

import { useState } from 'react'
import { ParcelData } from './LeafletParcelMap'
import { PropertyCardCompact } from './PropertyCard'

interface SearchResultsPanelProps {
  results: ParcelData[]
  totalCount: number
  onPropertyClick: (parcel: ParcelData) => void
  selectedParcelId?: string | null
  className?: string
}

export default function SearchResultsPanel({
  results,
  totalCount,
  onPropertyClick,
  selectedParcelId,
  className = ''
}: SearchResultsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (results.length === 0) {
    return null // Don't show panel if no results
  }

  return (
    <div
      className={`absolute right-4 bg-white rounded-lg shadow-2xl z-[40] transition-all duration-300 ${
        isCollapsed 
          ? 'top-1/2 -translate-y-1/2 w-auto' 
          : 'top-4 bottom-4 w-[380px]'
      } ${className}`}
    >
      {/* Toggle Button with Label */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute left-0 -translate-x-full rounded-l-lg shadow-xl hover:shadow-2xl transition-all z-[41] border-2 ${
          isCollapsed 
            ? 'top-0 px-3 py-2.5 flex items-center gap-2 bg-gradient-to-r from-stone-500 to-stone-700 hover:from-stone-700 hover:to-stone-800 border-stone-700' 
            : 'top-1/2 -translate-y-1/2 px-2 py-6 bg-white hover:bg-stone-50 border-stone-200'
        }`}
        title={isCollapsed ? 'Show search results' : 'Hide results panel'}
      >
        {isCollapsed ? (
          <>
            <span className="text-xs font-semibold text-white whitespace-nowrap tracking-wide">
              Results ({results.length})
            </span>
            <span className="text-white text-lg font-bold">◀</span>
          </>
        ) : (
          <span className="text-stone-500 text-xl font-bold">▶</span>
        )}
      </button>

      {/* Panel Content */}
      {!isCollapsed && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-blue-100">
            <h3 className="text-lg font-bold text-stone-900">Search Results</h3>
            <p className="text-sm text-stone-500 mt-1">
              Showing <span className="font-semibold text-stone-900">{results.length}</span> of{' '}
              <span className="font-semibold text-stone-900">{totalCount}</span> results
            </p>
          </div>

          {/* Scrollable Results List - sorted by status (Active first, then Pending) */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {[...results]
              .sort((a, b) => {
                const statusOrder: Record<string, number> = {
                  'Active': 0,
                  'Pending': 1,
                  'Contingent': 2,
                  'Off-Market': 3,
                  'Sold': 4,
                }
                const aOrder = statusOrder[a.listing_status || 'Off-Market'] ?? 5
                const bOrder = statusOrder[b.listing_status || 'Off-Market'] ?? 5
                return aOrder - bOrder
              })
              .map((parcel) => (
                <PropertyCardCompact
                  key={parcel.parcel_id}
                  address={parcel.address}
                  city={parcel.city}
                  state={parcel.state}
                  status={parcel.listing_status}
                  listPrice={parcel.list_price || undefined}
                  bedrooms={parcel.property_details?.bedrooms}
                  bathrooms={parcel.property_details?.bathrooms}
                  squareFeet={parcel.property_details?.square_feet}
                  thumbnailUrl={parcel.thumbnail_url}
                  propertyType={parcel.property_type}
                  isSelected={parcel.parcel_id === selectedParcelId}
                  onClick={() => onPropertyClick(parcel)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
