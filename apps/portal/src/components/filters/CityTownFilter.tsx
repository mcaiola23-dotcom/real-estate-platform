'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface City {
  name: string
  property_count: number
  active_listing_count: number
}

interface CityTownFilterProps {
  selectedCities: string[]
  onChange: (cities: string[]) => void
  className?: string
}

const API_BASE = '/api/portal';

/**
 * Multi-select city/town filter with property counts
 * Fetches cities from backend API
 */
export default function CityTownFilter({ selectedCities, onChange, className = '' }: CityTownFilterProps) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/cities/list`)
        if (response.ok) {
          const data = await response.json()
          setCities(data.cities || [])
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [])

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      onChange(selectedCities.filter(c => c !== cityName))
    } else {
      onChange([...selectedCities, cityName])
    }
  }

  const selectAll = () => {
    onChange(cities.map(c => c.name))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-stone-600 mb-2">
        City / Town
      </label>

      {/* Selected Count / Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg text-left flex items-center justify-between hover:border-stone-400 focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-colors"
      >
        <span className="text-sm">
          {selectedCities.length === 0
            ? 'All Cities'
            : selectedCities.length === 1
            ? selectedCities[0]
            : `${selectedCities.length} cities selected`}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-stone-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute z-20 mt-2 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-96 flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-stone-200">
              <input
                type="text"
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Select All / Clear All */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-stone-50">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium text-stone-900 hover:text-stone-700"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-stone-500 hover:text-stone-600"
              >
                Clear All
              </button>
            </div>

            {/* City List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-stone-500">
                  Loading cities...
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="p-4 text-center text-sm text-stone-500">
                  No cities found
                </div>
              ) : (
                <div className="py-1">
                  {filteredCities.map((city) => {
                    const isSelected = selectedCities.includes(city.name)
                    return (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => toggleCity(city.name)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-stone-50 transition-colors ${
                          isSelected ? 'bg-stone-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-stone-500 border-stone-500'
                                : 'border-stone-300'
                            }`}
                          >
                            {isSelected && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-stone-900">
                            {city.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {city.active_listing_count > 0 && (
                            <span
                              className="text-emerald-600 font-medium"
                              title="Active listings"
                            >
                              {city.active_listing_count} active
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

