'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PinnedProperty {
  parcel_id: string
  address_full: string
  city: string
  list_price?: number
  square_feet?: number
  bedrooms?: number
  bathrooms?: number
  property_type?: string
  listing_id?: number
}

interface PinnedPropertiesPanelProps {
  pinnedProperties: PinnedProperty[]
  onRemovePin: (parcelId: string) => void
  onSelectProperty: (property: PinnedProperty) => void
  onClearAll: () => void
}

export default function PinnedPropertiesPanel({
  pinnedProperties,
  onRemovePin,
  onSelectProperty,
  onClearAll
}: PinnedPropertiesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (pinnedProperties.length === 0) {
    return null
  }

  return (
    <>
      {/* Collapsed state - just a tab */}
      {isCollapsed && (
        <div
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-stone-900 text-white px-3 py-6 rounded-l-lg shadow-lg cursor-pointer hover:bg-stone-800 transition-colors z-[1001]"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="flex flex-col items-center gap-2">
            <ChevronLeft size={20} />
            <div className="writing-mode-vertical text-sm font-medium">
              {pinnedProperties.length} Pinned
            </div>
          </div>
        </div>
      )}

      {/* Expanded state - full panel */}
      {!isCollapsed && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[1001] flex flex-col">
          {/* Header */}
          <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">📌 Pinned Properties</span>
              <span className="bg-stone-800 px-2 py-1 rounded-full text-sm">
                {pinnedProperties.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClearAll}
                className="text-xs bg-stone-800 hover:bg-blue-800 px-2 py-1 rounded transition-colors"
                title="Clear all pins"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="hover:bg-stone-800 p-1 rounded transition-colors"
                title="Collapse panel"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Property list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pinnedProperties.map((property) => (
              <div
                key={property.parcel_id}
                className="bg-white border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onSelectProperty(property)}
              >
                {/* Thumbnail placeholder */}
                <div className="bg-gradient-to-br from-stone-100 to-stone-50 h-32 rounded-t-lg flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏡</div>
                    <div className="text-xs text-stone-500">{property.property_type || 'Property'}</div>
                  </div>
                  
                  {/* Remove pin button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemovePin(property.parcel_id)
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove pin"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Property info */}
                <div className="p-3">
                  {/* Address */}
                  <div className="font-semibold text-sm text-stone-900 mb-2 line-clamp-2">
                    {property.address_full}
                  </div>
                  <div className="text-xs text-stone-500 mb-2">{property.city}</div>

                  {/* Price */}
                  {property.list_price && (
                    <div className="text-lg font-bold text-stone-900 mb-2">
                      ${property.list_price.toLocaleString()}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-stone-600">
                    {property.bedrooms !== undefined && (
                      <span>{property.bedrooms} beds</span>
                    )}
                    {property.bathrooms !== undefined && (
                      <span>{property.bathrooms} baths</span>
                    )}
                    {property.square_feet && (
                      <span>{property.square_feet.toLocaleString()} sqft</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with hint */}
          <div className="border-t border-stone-200 p-3 bg-stone-50 text-xs text-stone-500 text-center">
            Click any property to view details
          </div>
        </div>
      )}
    </>
  )
}

