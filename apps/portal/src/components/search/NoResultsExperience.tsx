'use client'

import { useState } from 'react'
import { SparklesIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ParsedFilters } from './AnimatedFilterPills'

interface SimilarSearch {
  query: string
  resultCount: number
  filters: ParsedFilters
}

interface NoResultsExperienceProps {
  originalQuery: string
  parsedFilters: ParsedFilters | null
  explanation?: string
  onClearSearch: () => void
  onTrySearch: (filters: ParsedFilters) => void
  onRemoveFilter?: (filterId: string) => void
  className?: string
}

// Generate similar searches by removing/modifying filters
function generateSimilarSearches(parsedFilters: ParsedFilters | null): SimilarSearch[] {
  if (!parsedFilters) return []

  const similar: SimilarSearch[] = []

  // Try removing price max
  if (parsedFilters.price_max) {
    const withoutPriceMax = { ...parsedFilters }
    delete withoutPriceMax.price_max
    similar.push({
      query: 'Remove price limit',
      resultCount: 0, // Will be fetched from backend
      filters: withoutPriceMax
    })
  }

  // Try removing bedrooms min
  if (parsedFilters.bedrooms_min) {
    const withoutBedrooms = { ...parsedFilters }
    delete withoutBedrooms.bedrooms_min
    similar.push({
      query: 'Remove bedroom requirement',
      resultCount: 0,
      filters: withoutBedrooms
    })
  }

  // Try removing bathrooms min
  if (parsedFilters.bathrooms_min) {
    const withoutBathrooms = { ...parsedFilters }
    delete withoutBathrooms.bathrooms_min
    similar.push({
      query: 'Remove bathroom requirement',
      resultCount: 0,
      filters: withoutBathrooms
    })
  }

  // Try removing square feet min
  if (parsedFilters.square_feet_min) {
    const withoutSqft = { ...parsedFilters }
    delete withoutSqft.square_feet_min
    similar.push({
      query: 'Remove size requirement',
      resultCount: 0,
      filters: withoutSqft
    })
  }

  // Try removing a city (if multiple cities)
  if (parsedFilters.cities && parsedFilters.cities.length > 1) {
    const withoutOneCity = { ...parsedFilters, cities: parsedFilters.cities.slice(1) }
    similar.push({
      query: `Search in ${withoutOneCity.cities?.join(', ')}`,
      resultCount: 0,
      filters: withoutOneCity
    })
  }

  // Try increasing price max by 20%
  if (parsedFilters.price_max) {
    const increasedPrice = {
      ...parsedFilters,
      price_max: Math.round(parsedFilters.price_max * 1.2)
    }
    similar.push({
      query: 'Increase price range',
      resultCount: 0,
      filters: increasedPrice
    })
  }

  return similar.slice(0, 4) // Limit to 4 suggestions
}

// Get filter removal suggestions
function getFilterRemovalSuggestions(parsedFilters: ParsedFilters | null): string[] {
  if (!parsedFilters) return []

  const suggestions: string[] = []

  if (parsedFilters.price_max) {
    suggestions.push('price limit')
  }
  if (parsedFilters.bedrooms_min) {
    suggestions.push(`${parsedFilters.bedrooms_min}+ bedrooms`)
  }
  if (parsedFilters.bathrooms_min) {
    suggestions.push(`${parsedFilters.bathrooms_min}+ bathrooms`)
  }
  if (parsedFilters.square_feet_min) {
    suggestions.push('size requirement')
  }
  if (parsedFilters.cities && parsedFilters.cities.length > 1) {
    suggestions.push('one of the cities')
  }
  if (parsedFilters.features && parsedFilters.features.length > 0) {
    suggestions.push('feature requirements')
  }

  return suggestions.slice(0, 3) // Limit to 3 suggestions
}

export default function NoResultsExperience({
  originalQuery,
  parsedFilters,
  explanation,
  onClearSearch,
  onTrySearch,
  onRemoveFilter,
  className = ''
}: NoResultsExperienceProps) {
  const [similarSearches] = useState<SimilarSearch[]>(() => generateSimilarSearches(parsedFilters))
  const [removalSuggestions] = useState<string[]>(() => getFilterRemovalSuggestions(parsedFilters))

  const handleTrySearch = async (search: SimilarSearch) => {
    // Fetch result count first (optional - can be done on backend)
    onTrySearch(search.filters)
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-stone-200 p-6 md:p-8 ${className}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
          <SparklesIcon className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-stone-900 mb-2">
          No properties found
        </h3>
        <p className="text-sm md:text-base text-stone-500 mb-4">
          We couldn&apos;t find any properties matching your search criteria.
        </p>
        
        {/* Original Query Display */}
        <div className="bg-stone-50 rounded-lg p-3 mb-4 max-w-md mx-auto">
          <p className="text-sm font-medium text-stone-900 break-words">
            &quot;{originalQuery}&quot;
          </p>
        </div>

        {/* AI Explanation if available */}
        {explanation && (
          <p className="text-sm text-stone-500 mb-6 max-w-lg mx-auto">
            {explanation}
          </p>
        )}
      </div>

      {/* Filter Removal Suggestions */}
      {removalSuggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-stone-600 mb-3 text-center">
            Try removing:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {removalSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  // Map suggestion to filter ID
                  if (suggestion.includes('price')) {
                    onRemoveFilter?.('price-max')
                  } else if (suggestion.includes('bedroom')) {
                    onRemoveFilter?.('bedrooms')
                  } else if (suggestion.includes('bathroom')) {
                    onRemoveFilter?.('bathrooms')
                  } else if (suggestion.includes('size')) {
                    onRemoveFilter?.('sqft')
                  } else if (suggestion.includes('feature')) {
                    // Remove first feature
                    if (parsedFilters?.features && parsedFilters.features.length > 0) {
                      onRemoveFilter?.(`feature-${parsedFilters.features[0]}`)
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Similar Searches */}
      {similarSearches.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-stone-600 mb-3 text-center">
            Try these similar searches:
          </p>
          <div className="space-y-2">
            {similarSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleTrySearch(search)}
                className="w-full text-left px-4 py-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
                    <span className="text-sm font-medium text-stone-900">
                      {search.query}
                    </span>
                  </div>
                  {search.resultCount > 0 && (
                    <span className="text-xs text-stone-500">
                      {search.resultCount} results
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-stone-200">
        <button
          onClick={onClearSearch}
          className="px-6 py-2.5 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors"
        >
          Clear Search
        </button>
        <button
          onClick={() => {
            // Try a broader search - remove all restrictive filters
            const broadFilters: ParsedFilters = {}
            if (parsedFilters?.cities && parsedFilters.cities.length > 0) {
              broadFilters.cities = parsedFilters.cities
            }
            onTrySearch(broadFilters)
          }}
          className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors"
        >
          Show All Properties
        </button>
      </div>
    </div>
  )
}






