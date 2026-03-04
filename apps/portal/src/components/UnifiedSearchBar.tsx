'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { detectSearchType } from './unified-search/intent'

const API_BASE = '/api/portal';
const debugLog = (..._args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(..._args)
  }
}


interface AutocompleteSuggestion {
  type: 'address' | 'neighborhood' | 'city' | 'ai_search' | 'google_place'
  label: string
  value: string
  city?: string
  confidence: number
  lat?: number
  lng?: number
  place_id?: string
}

interface UnifiedSearchBarProps {
  onAiSearch?: (query: string) => void
  onAddressSelect?: (suggestion: AutocompleteSuggestion) => void
  onCitySelect?: (city: string) => void
  onNeighborhoodSelect?: (neighborhood: string, city?: string) => void
  placeholder?: string
  className?: string
  showHelperText?: boolean
  initialValue?: string
  variant?: 'default' | 'compact'
}

export default function UnifiedSearchBar({
  onAiSearch,
  onAddressSelect,
  onCitySelect,
  onNeighborhoodSelect,
  placeholder = "Search addresses or describe your dream home...",
  className = '',
  showHelperText = true,
  initialValue = '',
  variant = 'default'
}: UnifiedSearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<'ai' | 'address' | 'unknown'>('unknown')
  const [isFocused, setIsFocused] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Update search type as user types
  useEffect(() => {
    setSearchType(detectSearchType(value))
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch mixed suggestions (portal parcel/city/neighborhood + Google Places)
  const fetchSuggestions = useCallback(async (query: string) => {
    const detectedType = detectSearchType(query)

    // For AI search queries, don't fetch autocomplete - show AI suggestion instead
    if (detectedType === 'ai') {
      setSuggestions([{
        type: 'ai_search',
        label: `AI Search: "${query}"`,
        value: query,
        confidence: 1
      }])
      setIsOpen(true)
      setSelectedIndex(0)
      return
    }

    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)

    try {
      const [portalAutocompleteResult, placesResult] = await Promise.allSettled([
        fetch(
          `${API_BASE}/api/autocomplete/search?q=${encodeURIComponent(query)}&limit=10`
        ),
        fetch(
          `${API_BASE}/api/places/autocomplete?input=${encodeURIComponent(query)}&types=address`
        ),
      ])

      const newSuggestions: AutocompleteSuggestion[] = []

      if (portalAutocompleteResult.status === 'fulfilled' && portalAutocompleteResult.value.ok) {
        const autocompleteData = await portalAutocompleteResult.value.json()
        const portalSuggestions = Array.isArray(autocompleteData?.suggestions)
          ? autocompleteData.suggestions
          : []

        portalSuggestions.forEach((suggestion: any) => {
          if (!suggestion || typeof suggestion.label !== 'string') return

          const type =
            suggestion.type === 'address' ||
            suggestion.type === 'city' ||
            suggestion.type === 'neighborhood'
              ? suggestion.type
              : 'address'

          newSuggestions.push({
            type,
            label: suggestion.label,
            value: typeof suggestion.value === 'string' ? suggestion.value : suggestion.label,
            city: typeof suggestion.city === 'string' ? suggestion.city : undefined,
            confidence: typeof suggestion.confidence === 'number' ? suggestion.confidence : 0.5,
          })
        })
      }

      if (placesResult.status === 'fulfilled' && placesResult.value.ok) {
        const placesData = await placesResult.value.json()
        const placePredictions = Array.isArray(placesData?.predictions)
          ? placesData.predictions
          : []

        placePredictions.slice(0, 5).forEach((prediction: any) => {
          if (!prediction || typeof prediction.description !== 'string') return

          newSuggestions.push({
            type: 'google_place',
            label: prediction.description,
            value: prediction.description,
            confidence: 0.95,
            place_id: prediction.place_id
          })
        })
      }

      const dedupedSuggestions: AutocompleteSuggestion[] = []
      const seen = new Set<string>()
      for (const suggestion of newSuggestions) {
        const dedupeKey = `${suggestion.type}:${suggestion.label.toLowerCase()}`
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
        dedupedSuggestions.push(suggestion)
      }

      // If query is unclear and 5+ chars, add an AI search option at the end
      if (detectedType === 'unknown' && query.length >= 5) {
        dedupedSuggestions.push({
          type: 'ai_search',
          label: `Try AI Search: "${query}"`,
          value: query,
          confidence: 0.5
        })
      }

      setSuggestions(dedupedSuggestions.slice(0, 10))
      setIsOpen(dedupedSuggestions.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!value.trim()) return

    const detectedType = detectSearchType(value)

    if (detectedType === 'ai' || searchType === 'ai') {
      // Perform AI search
      if (onAiSearch) {
        onAiSearch(value.trim())
      } else {
        // Default: navigate to properties with aiQuery
        const encodedQuery = encodeURIComponent(value.trim())
        router.push(`/properties?aiQuery=${encodedQuery}`)
      }
    } else if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      // Select the highlighted suggestion
      handleSelect(suggestions[selectedIndex])
    } else if (suggestions.length > 0) {
      // If user entered a descriptive query, prefer the AI option over first address hit.
      const aiSuggestion = suggestions.find(s => s.type === 'ai_search')
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length
      if (aiSuggestion && wordCount >= 3) {
        handleSelect(aiSuggestion)
      } else {
        handleSelect(suggestions[0])
      }
    }

    setIsOpen(false)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (isOpen && suggestions.length > 0) {
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen && suggestions.length > 0) {
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        }
        break
      case 'Enter':
        e.preventDefault()
        handleSubmit()
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle suggestion selection
  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    debugLog('[UnifiedSearchBar] handleSelect called with:', suggestion)
    setValue(suggestion.value)
    setIsOpen(false)
    setSelectedIndex(-1)

    switch (suggestion.type) {
      case 'ai_search':
        if (onAiSearch) {
          onAiSearch(suggestion.value)
        } else {
          const encodedQuery = encodeURIComponent(suggestion.value)
          router.push(`/properties?aiQuery=${encodedQuery}`)
        }
        break
      case 'address':
      case 'google_place':
        debugLog('[UnifiedSearchBar] Calling onAddressSelect with:', suggestion)
        onAddressSelect?.(suggestion)
        break
      case 'city':
        onCitySelect?.(suggestion.value)
        break
      case 'neighborhood':
        onNeighborhoodSelect?.(suggestion.value, suggestion.city)
        break
    }
  }

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'address':
        return '🏠'
      case 'neighborhood':
        return '🏘️'
      case 'city':
        return '🏙️'
      case 'ai_search':
        return <SparklesIcon className="h-5 w-5 text-stone-700" />
      case 'google_place':
        return '📍'
      default:
        return '📍'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'address':
        return 'Address'
      case 'neighborhood':
        return 'Neighborhood'
      case 'city':
        return 'City'
      case 'ai_search':
        return 'AI-Powered Search'
      case 'google_place':
        return 'Address'
      default:
        return ''
    }
  }

  // Dynamic height for expandable input
  const inputHeight = variant === 'compact' ? 'py-2' : 'py-3'
  const isAiMode = searchType === 'ai'

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative flex items-center bg-white rounded-xl border-2 transition-all duration-200
            ${isFocused
              ? isAiMode
                ? 'border-stone-400 shadow-lg shadow-primary-100'
                : 'border-stone-400 shadow-lg shadow-stone-100'
              : 'border-stone-200 hover:border-stone-300'
            }
          `}
        >
          {/* Icon - changes based on detected search type */}
          <div className="pl-4 flex-shrink-0">
            {isAiMode ? (
              <SparklesIcon className={`h-5 w-5 transition-colors ${isFocused ? 'text-stone-700' : 'text-stone-400'}`} />
            ) : (
              <MagnifyingGlassIcon className={`h-5 w-5 transition-colors ${isFocused ? 'text-stone-600' : 'text-stone-400'}`} />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              if (value.length >= 2 && suggestions.length > 0) setIsOpen(true)
            }}
            onBlur={() => setIsFocused(false)}
            className={`
              flex-1 min-w-0 px-3 ${inputHeight} text-stone-900 placeholder-gray-400
              bg-transparent border-none focus:outline-none focus:ring-0 truncate
              ${variant === 'compact' ? 'text-sm' : 'text-base'}
            `}
            placeholder={placeholder}
            autoComplete="off"
          />

          {/* Loading indicator or search type badge */}
          <div className="pr-3 flex items-center gap-2">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-900"></div>
            )}

            {!loading && value.length > 0 && isAiMode && (
              <span className="text-xs font-medium text-stone-900 bg-stone-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                AI Search
              </span>
            )}

            {/* Search button */}
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
              disabled={!value.trim()}
              className={`
                p-2 rounded-lg transition-colors
                ${value.trim()
                  ? isAiMode
                    ? 'bg-stone-900 text-white hover:bg-stone-800'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                }
              `}
            >
              {isAiMode ? (
                <SparklesIcon className="h-4 w-4" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Helper text — only show on non-compact variant (e.g., homepage hero) */}
      {showHelperText && variant !== 'compact' && !isOpen && !loading && value.length === 0 && (
        <p className="mt-2 text-xs text-stone-500 flex items-center gap-1">
          <SparklesIcon className="h-3 w-3 text-stone-500" />
          <span>Try AI search: <em className="text-stone-500">describe your dream home!</em></span>
        </p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${index}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full text-left px-4 py-3 transition-colors border-b border-stone-50 last:border-b-0
                ${index === selectedIndex
                  ? suggestion.type === 'ai_search'
                    ? 'bg-stone-50'
                    : 'bg-stone-50'
                  : 'hover:bg-stone-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg flex-shrink-0 ${suggestion.type === 'ai_search' ? '' : ''}`}>
                  {typeof getSuggestionIcon(suggestion.type) === 'string'
                    ? getSuggestionIcon(suggestion.type)
                    : getSuggestionIcon(suggestion.type)
                  }
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${suggestion.type === 'ai_search' ? 'text-stone-700' : 'text-stone-900'
                      }`}>
                      {suggestion.type === 'ai_search'
                        ? suggestion.value
                        : suggestion.label
                      }
                    </p>
                    {index === selectedIndex && (
                      <span className="text-xs text-stone-400 whitespace-nowrap">
                        ↵
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${suggestion.type === 'ai_search' ? 'text-stone-700' : 'text-stone-500'
                    }`}>
                    {getTypeLabel(suggestion.type)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


