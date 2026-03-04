'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const API_BASE = '/api/portal';

interface AutocompleteSuggestion {
  type: 'address' | 'neighborhood' | 'city'
  label: string
  value: string
  city?: string
  confidence: number
}

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AutocompleteSuggestion) => void
  placeholder?: string
  className?: string
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search by address, city, or neighborhood...",
  className = ''
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(
        `${API_BASE}/api/autocomplete/search?q=${encodeURIComponent(query)}&limit=10`
      )
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setIsOpen(data.suggestions?.length > 0)
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300) // 300ms debounce
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle suggestion selection
  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.value)
    onSelect(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Get icon and color for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'address':
        return '🏠'
      case 'neighborhood':
        return '🏘️'
      case 'city':
        return '🏙️'
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
      default:
        return ''
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          className="input-field pl-10 pr-4"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-900"></div>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${index}`}
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-stone-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {suggestion.label}
                    </p>
                    {index === selectedIndex && (
                      <span className="text-xs text-stone-900 font-medium whitespace-nowrap">
                        ↵ Enter
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {getTypeLabel(suggestion.type)}
                    {suggestion.confidence > 0.8 && (
                      <span className="ml-2 text-emerald-600 font-medium">High match</span>
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {!isOpen && !loading && value.length > 0 && value.length < 2 && (
        <p className="mt-1 text-xs text-stone-500">
          Type at least 2 characters to see suggestions
        </p>
      )}
    </div>
  )
}

