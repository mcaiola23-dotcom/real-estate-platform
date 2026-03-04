'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { XMarkIcon, MinusIcon, PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

// Filter pill colors by type (from design spec):
// 🔵 Blue: Location (city, neighborhood, ZIP)
// 🟢 Green: Price (min/max)
// 🟣 Purple: Property features (beds, baths, sqft)
// 🟠 Orange: Amenities (pool, garage, waterfront)

type FilterType = 'location' | 'price' | 'features' | 'amenities' | 'other'

// Editable filter types
type EditableFilterType = 'bedrooms' | 'bathrooms' | 'sqft' | 'price-min' | 'price-max' | 'price-range' | 'city'

interface FilterPill {
  id: string
  label: string
  type: FilterType
  editType?: EditableFilterType
  value?: number
  minValue?: number
  maxValue?: number
}

export interface ParsedFilters {
  price_min?: number
  price_max?: number
  bedrooms_min?: number
  bedrooms_max?: number
  bathrooms_min?: number
  bathrooms_max?: number
  square_feet_min?: number
  square_feet_max?: number
  cities?: string[]
  property_types?: string[]
  features?: string[]
  fuzzy_terms?: string[]
  include_off_market?: boolean
}

export interface FilterUpdate {
  filterId: string
  newValue?: number
  newMinValue?: number
  newMaxValue?: number
  newCity?: string
}

interface AnimatedFilterPillsProps {
  parsedFilters: ParsedFilters | null
  isVisible: boolean
  onRemoveFilter?: (filterId: string) => void
  onEditFilter?: (update: FilterUpdate) => void
  availableCities?: string[]
  className?: string
}

const TYPE_COLORS: Record<FilterType, { bg: string; text: string; border: string; hoverBg: string }> = {
  location: {
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-200',
    hoverBg: 'hover:bg-stone-100'
  },
  price: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    hoverBg: 'hover:bg-emerald-100'
  },
  features: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hoverBg: 'hover:bg-purple-100'
  },
  amenities: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    hoverBg: 'hover:bg-amber-100'
  },
  other: {
    bg: 'bg-stone-50',
    text: 'text-stone-600',
    border: 'border-stone-200',
    hoverBg: 'hover:bg-stone-100'
  }
}

function formatPrice(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

function convertFiltersTosPills(filters: ParsedFilters): FilterPill[] {
  const pills: FilterPill[] = []

  // Location filters (Blue)
  if (filters.cities && filters.cities.length > 0) {
    filters.cities.forEach(city => {
      pills.push({
        id: `city-${city}`,
        label: city,
        type: 'location',
        editType: 'city'
      })
    })
  }

  // Price filters (Green)
  if (filters.price_min && filters.price_max) {
    pills.push({
      id: 'price-range',
      label: `${formatPrice(filters.price_min)} - ${formatPrice(filters.price_max)}`,
      type: 'price',
      editType: 'price-range',
      minValue: filters.price_min,
      maxValue: filters.price_max
    })
  } else if (filters.price_min) {
    pills.push({
      id: 'price-min',
      label: `${formatPrice(filters.price_min)}+`,
      type: 'price',
      editType: 'price-min',
      value: filters.price_min
    })
  } else if (filters.price_max) {
    pills.push({
      id: 'price-max',
      label: `Under ${formatPrice(filters.price_max)}`,
      type: 'price',
      editType: 'price-max',
      value: filters.price_max
    })
  }

  // Property features (Purple)
  if (filters.bedrooms_min) {
    pills.push({
      id: 'bedrooms',
      label: `${filters.bedrooms_min}+ beds`,
      type: 'features',
      editType: 'bedrooms',
      value: filters.bedrooms_min
    })
  }

  if (filters.bathrooms_min) {
    pills.push({
      id: 'bathrooms',
      label: `${filters.bathrooms_min}+ baths`,
      type: 'features',
      editType: 'bathrooms',
      value: filters.bathrooms_min
    })
  }

  if (filters.square_feet_min) {
    const sqftFormatted = filters.square_feet_min >= 1000
      ? `${(filters.square_feet_min / 1000).toFixed(1)}K`
      : filters.square_feet_min.toString()
    pills.push({
      id: 'sqft',
      label: `${sqftFormatted}+ sqft`,
      type: 'features',
      editType: 'sqft',
      value: filters.square_feet_min
    })
  }

  if (filters.property_types && filters.property_types.length > 0) {
    filters.property_types.forEach(type => {
      pills.push({
        id: `type-${type}`,
        label: type,
        type: 'features'
        // Property types are not easily editable - just removable
      })
    })
  }

  // Amenities (Orange)
  if (filters.features && filters.features.length > 0) {
    filters.features.forEach(feature => {
      const formattedFeature = feature
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      pills.push({
        id: `feature-${feature}`,
        label: formattedFeature,
        type: 'amenities'
        // Amenities are not easily editable - just removable
      })
    })
  }

  // Fuzzy terms (Other)
  if (filters.fuzzy_terms && filters.fuzzy_terms.length > 0) {
    filters.fuzzy_terms.forEach(term => {
      pills.push({
        id: `fuzzy-${term}`,
        label: term.charAt(0).toUpperCase() + term.slice(1),
        type: 'other'
        // Fuzzy terms are not editable - just removable
      })
    })
  }

  // Off-market indicator
  if (filters.include_off_market) {
    pills.push({
      id: 'off-market',
      label: 'Including Off-Market',
      type: 'other'
      // Off-market is a toggle - just removable
    })
  }

  return pills
}

// Inline editor for beds/baths with +/- buttons
function NumberEditor({
  value,
  onChange,
  onClose,
  min = 1,
  max = 10,
  label,
  colors
}: {
  value: number
  onChange: (newValue: number) => void
  onClose: () => void
  min?: number
  max?: number
  label: string
  colors: typeof TYPE_COLORS[FilterType]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
        border ${colors.bg} ${colors.text} ${colors.border}
      `}
    >
      <button
        onClick={() => value > min && onChange(value - 1)}
        disabled={value <= min}
        className={`p-0.5 rounded-full ${colors.hoverBg} disabled:opacity-50`}
        aria-label={`Decrease ${label}`}
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2.5rem] text-center font-semibold">{value}+ {label}</span>
      <button
        onClick={() => value < max && onChange(value + 1)}
        disabled={value >= max}
        className={`p-0.5 rounded-full ${colors.hoverBg} disabled:opacity-50`}
        aria-label={`Increase ${label}`}
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onClose}
        className={`p-0.5 rounded-full ${colors.hoverBg} ml-1`}
        aria-label="Done editing"
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// Price editor popover
function PriceEditor({
  minValue,
  maxValue,
  onChange,
  onClose,
  colors,
  mode
}: {
  minValue?: number
  maxValue?: number
  onChange: (min?: number, max?: number) => void
  onClose: () => void
  colors: typeof TYPE_COLORS[FilterType]
  mode: 'min' | 'max' | 'range'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [localMin, setLocalMin] = useState(minValue?.toString() || '')
  const [localMax, setLocalMax] = useState(maxValue?.toString() || '')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleApply = () => {
    const min = localMin ? parseInt(localMin.replace(/[^0-9]/g, '')) : undefined
    const max = localMax ? parseInt(localMax.replace(/[^0-9]/g, '')) : undefined
    onChange(min, max)
    onClose()
  }

  const formatInputValue = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''))
    if (isNaN(num)) return ''
    return num.toLocaleString()
  }

  return (
    <div
      ref={containerRef}
      className={`
        absolute top-full left-0 mt-2 p-3 rounded-lg shadow-lg border z-50
        bg-white ${colors.border}
      `}
      style={{ minWidth: '200px' }}
    >
      <div className="space-y-3">
        {(mode === 'min' || mode === 'range') && (
          <div>
            <label className="text-xs text-stone-500 block mb-1">Minimum Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
              <input
                type="text"
                value={localMin}
                onChange={(e) => setLocalMin(formatInputValue(e.target.value))}
                placeholder="No min"
                className={`w-full pl-7 pr-3 py-1.5 border rounded-md text-sm ${colors.border} focus:ring-1 focus:ring-offset-0`}
              />
            </div>
          </div>
        )}
        {(mode === 'max' || mode === 'range') && (
          <div>
            <label className="text-xs text-stone-500 block mb-1">Maximum Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
              <input
                type="text"
                value={localMax}
                onChange={(e) => setLocalMax(formatInputValue(e.target.value))}
                placeholder="No max"
                className={`w-full pl-7 pr-3 py-1.5 border rounded-md text-sm ${colors.border} focus:ring-1 focus:ring-offset-0`}
              />
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={`flex-1 px-3 py-1.5 text-sm text-white rounded-md ${colors.text.includes('green') ? 'bg-green-600 hover:bg-green-700' : 'bg-stone-900 hover:bg-stone-800'
              }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// Square feet editor popover
function SqftEditor({
  value,
  onChange,
  onClose,
  colors
}: {
  value: number
  onChange: (newValue: number) => void
  onClose: () => void
  colors: typeof TYPE_COLORS[FilterType]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleApply = () => {
    const num = parseInt(localValue.replace(/[^0-9]/g, ''))
    if (!isNaN(num) && num > 0) {
      onChange(num)
    }
    onClose()
  }

  const presets = [1000, 1500, 2000, 2500, 3000, 4000]

  return (
    <div
      ref={containerRef}
      className={`
        absolute top-full left-0 mt-2 p-3 rounded-lg shadow-lg border z-50
        bg-white ${colors.border}
      `}
      style={{ minWidth: '180px' }}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Minimum Sq Ft</label>
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9]/g, ''))}
            className={`w-full px-3 py-1.5 border rounded-md text-sm ${colors.border} focus:ring-1 focus:ring-offset-0`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => setLocalValue(preset.toString())}
              className={`px-2 py-1 text-xs rounded ${parseInt(localValue) === preset
                ? `${colors.bg} ${colors.text}`
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
            >
              {preset >= 1000 ? `${preset / 1000}K` : preset}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// City selector dropdown
function CityEditor({
  currentCity,
  availableCities,
  onChange,
  onClose,
  colors
}: {
  currentCity: string
  availableCities: string[]
  onChange: (newCity: string) => void
  onClose: () => void
  colors: typeof TYPE_COLORS[FilterType]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(search.toLowerCase()) && city !== currentCity
  )

  return (
    <div
      ref={containerRef}
      className={`
        absolute top-full left-0 mt-2 p-2 rounded-lg shadow-lg border z-50
        bg-white ${colors.border}
      `}
      style={{ minWidth: '180px', maxHeight: '250px' }}
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search cities..."
        className={`w-full px-3 py-1.5 border rounded-md text-sm mb-2 ${colors.border}`}
        autoFocus
      />
      <div className="max-h-40 overflow-y-auto">
        {filteredCities.length > 0 ? (
          filteredCities.map(city => (
            <button
              key={city}
              onClick={() => {
                onChange(city)
                onClose()
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-50 rounded"
            >
              {city}
            </button>
          ))
        ) : (
          <p className="text-sm text-stone-500 px-3 py-2">No cities found</p>
        )}
      </div>
    </div>
  )
}

export default function AnimatedFilterPills({
  parsedFilters,
  isVisible,
  onRemoveFilter,
  onEditFilter,
  availableCities = [],
  className = ''
}: AnimatedFilterPillsProps) {
  const [visiblePills, setVisiblePills] = useState<Set<string>>(new Set())
  const [editingPill, setEditingPill] = useState<string | null>(null)

  // Memoize pills to avoid recreating array on every render
  const pills = useMemo(() =>
    parsedFilters ? convertFiltersTosPills(parsedFilters) : [],
    [parsedFilters]
  )

  // Animate pills appearing one-by-one
  useEffect(() => {
    if (!isVisible || pills.length === 0) {
      setVisiblePills(new Set())
      return
    }

    // Reset visible pills when filters change
    setVisiblePills(new Set())

    // Stagger the appearance of each pill
    pills.forEach((pill, index) => {
      const timer = setTimeout(() => {
        setVisiblePills(prev => {
          const next = new Set(prev)
          next.add(pill.id)
          return next
        })
      }, 150 * (index + 1)) // 150ms delay between each pill

      return () => clearTimeout(timer)
    })
  }, [isVisible, parsedFilters, pills])

  // Close editing when filters change
  useEffect(() => {
    setEditingPill(null)
  }, [parsedFilters])

  if (!parsedFilters || pills.length === 0) return null

  const handlePillClick = (pill: FilterPill) => {
    if (pill.editType && onEditFilter) {
      setEditingPill(editingPill === pill.id ? null : pill.id)
    }
  }

  const handleNumberChange = (pillId: string, newValue: number) => {
    if (onEditFilter) {
      onEditFilter({ filterId: pillId, newValue })
    }
  }

  const handlePriceChange = (pillId: string, min?: number, max?: number) => {
    if (onEditFilter) {
      onEditFilter({ filterId: pillId, newMinValue: min, newMaxValue: max })
    }
  }

  const handleCityChange = (oldCity: string, newCity: string) => {
    if (onEditFilter) {
      onEditFilter({ filterId: `city-${oldCity}`, newCity })
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {pills.map((pill) => {
        const colors = TYPE_COLORS[pill.type]
        const isPillVisible = visiblePills.has(pill.id)
        const isEditing = editingPill === pill.id
        const isEditable = !!pill.editType && !!onEditFilter

        // Show inline editor for beds/baths
        if (isEditing && (pill.editType === 'bedrooms' || pill.editType === 'bathrooms')) {
          return (
            <NumberEditor
              key={pill.id}
              value={pill.value || 1}
              onChange={(newValue) => handleNumberChange(pill.id, newValue)}
              onClose={() => setEditingPill(null)}
              min={1}
              max={pill.editType === 'bedrooms' ? 10 : 8}
              label={pill.editType === 'bedrooms' ? 'beds' : 'baths'}
              colors={colors}
            />
          )
        }

        return (
          <div key={pill.id} className="relative">
            <div
              onClick={() => handlePillClick(pill)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                border transition-all duration-300 ease-out
                ${colors.bg} ${colors.text} ${colors.border}
                ${isPillVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}
                ${isEditable ? 'cursor-pointer hover:shadow-md' : ''}
              `}
            >
              <span>{pill.label}</span>
              {isEditable && !isEditing && (
                <ChevronDownIcon className="h-3 w-3 opacity-60" />
              )}
              {onRemoveFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFilter(pill.id)
                  }}
                  className={`
                    p-0.5 rounded-full transition-colors
                    ${colors.hoverBg}
                  `}
                  aria-label={`Remove ${pill.label} filter`}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Price popover */}
            {isEditing && (pill.editType === 'price-min' || pill.editType === 'price-max' || pill.editType === 'price-range') && (
              <PriceEditor
                minValue={pill.editType === 'price-max' ? undefined : (pill.minValue || pill.value)}
                maxValue={pill.editType === 'price-min' ? undefined : (pill.maxValue || pill.value)}
                onChange={(min, max) => handlePriceChange(pill.id, min, max)}
                onClose={() => setEditingPill(null)}
                colors={colors}
                mode={pill.editType === 'price-range' ? 'range' : pill.editType === 'price-min' ? 'min' : 'max'}
              />
            )}

            {/* Sqft popover */}
            {isEditing && pill.editType === 'sqft' && (
              <SqftEditor
                value={pill.value || 1000}
                onChange={(newValue) => handleNumberChange(pill.id, newValue)}
                onClose={() => setEditingPill(null)}
                colors={colors}
              />
            )}

            {/* City dropdown */}
            {isEditing && pill.editType === 'city' && availableCities.length > 0 && (
              <CityEditor
                currentCity={pill.label}
                availableCities={availableCities}
                onChange={(newCity) => handleCityChange(pill.label, newCity)}
                onClose={() => setEditingPill(null)}
                colors={colors}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Export a component for showing the text summary (not color-coded per spec)
export function FilterSummary({
  parsedFilters,
  resultCount,
  className = ''
}: {
  parsedFilters: ParsedFilters | null
  resultCount: number
  className?: string
}) {
  if (!parsedFilters) return null

  // Build summary parts
  const parts: string[] = []

  if (resultCount > 0) {
    parts.push(`Found ${resultCount} ${resultCount === 1 ? 'property' : 'properties'}`)
  } else {
    parts.push('No properties found')
  }

  if (parsedFilters.cities && parsedFilters.cities.length > 0) {
    parts.push(`in ${parsedFilters.cities.join(', ')}`)
  }

  if (parsedFilters.bedrooms_min) {
    parts.push(`with ${parsedFilters.bedrooms_min}+ bedrooms`)
  }

  if (parsedFilters.price_max) {
    parts.push(`under ${formatPrice(parsedFilters.price_max)}`)
  } else if (parsedFilters.price_min) {
    parts.push(`over ${formatPrice(parsedFilters.price_min)}`)
  }

  if (parsedFilters.features && parsedFilters.features.length > 0) {
    parts.push(`with ${parsedFilters.features.join(', ')}`)
  }

  return (
    <p className={`text-sm text-stone-500 ${className}`}>
      {parts.join(' ')}
    </p>
  )
}


