'use client'

import { useState, useEffect } from 'react'

const API_BASE = '/api/portal';

interface NeighborhoodFilterProps {
  selectedCities: string[]
  selectedNeighborhoods: string[]
  onChange: (neighborhoods: string[]) => void
}

interface Neighborhood {
  id: number
  name: string
  city: string
  parcel_count: number
}

export default function NeighborhoodFilter({
  selectedCities,
  selectedNeighborhoods,
  onChange
}: NeighborhoodFilterProps) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedCities.length === 0) {
      setNeighborhoods([])
      onChange([])
      return
    }

    const fetchNeighborhoods = async () => {
      setLoading(true)
      try {
        const citiesParam = selectedCities.join(',')
        const response = await fetch(
          `${API_BASE}/api/neighborhoods/list?cities=${encodeURIComponent(citiesParam)}`
        )
        const data = await response.json()
        setNeighborhoods(data.neighborhoods || [])
      } catch (error) {
        console.error('Error fetching neighborhoods:', error)
        setNeighborhoods([])
      } finally {
        setLoading(false)
      }
    }

    fetchNeighborhoods()
  }, [selectedCities, onChange])

  const handleToggle = (neighborhoodName: string) => {
    if (selectedNeighborhoods.includes(neighborhoodName)) {
      onChange(selectedNeighborhoods.filter(n => n !== neighborhoodName))
    } else {
      onChange([...selectedNeighborhoods, neighborhoodName])
    }
  }

  const handleSelectAll = () => {
    onChange(neighborhoods.map(n => n.name))
  }

  const handleClearAll = () => {
    onChange([])
  }

  if (selectedCities.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-2">
          Neighborhood
        </label>
        <p className="text-xs text-stone-500 italic">
          Select a city first to filter by neighborhood
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-stone-600">
          Neighborhood
        </label>
        {neighborhoods.length > 0 && (
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSelectAll}
              className="text-stone-900 hover:text-stone-700"
            >
              All
            </button>
            {selectedNeighborhoods.length > 0 && (
              <>
                <span className="text-stone-400">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-stone-900 hover:text-stone-700"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-stone-500 py-2">Loading neighborhoods...</div>
      ) : neighborhoods.length === 0 ? (
        <div className="text-sm text-stone-500 italic py-2">
          No neighborhoods available for selected cities
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto border border-stone-300 rounded-lg p-2 space-y-1">
          {neighborhoods.map((neighborhood) => (
            <label
              key={neighborhood.id}
              className="flex items-center py-1.5 px-2 hover:bg-stone-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedNeighborhoods.includes(neighborhood.name)}
                onChange={() => handleToggle(neighborhood.name)}
                className="h-4 w-4 text-stone-900 rounded border-stone-300 focus:ring-stone-400"
              />
              <span className="ml-3 text-sm text-stone-600 flex-1">
                {neighborhood.name}
              </span>
            </label>
          ))}
        </div>
      )}

      {selectedNeighborhoods.length > 0 && (
        <div className="mt-2 text-xs text-stone-500">
          {selectedNeighborhoods.length} selected
        </div>
      )}
    </div>
  )
}

