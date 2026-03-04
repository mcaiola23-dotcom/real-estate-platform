'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'

const API_BASE = '/api/portal';

export interface PlaceSuggestion {
    description: string
    place_id: string
    main_text: string
    secondary_text: string
}

export interface PlaceDetails {
    address: string
    lat: number
    lng: number
    place_id: string
}

interface GooglePlacesAutocompleteProps {
    value: string
    onChange: (value: string) => void
    onSelect: (place: PlaceDetails) => void
    placeholder?: string
    className?: string
    inputClassName?: string
    disabled?: boolean
    types?: string  // 'address', 'geocode', 'establishment'
}

export default function GooglePlacesAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Enter an address...',
    className = '',
    inputClassName = '',
    disabled = false,
    types = 'address'
}: GooglePlacesAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isLoading, setIsLoading] = useState(false)
    const debounceTimerRef = useRef<NodeJS.Timeout>()
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch suggestions from backend
    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch(
                `${API_BASE}/api/places/autocomplete?input=${encodeURIComponent(query)}&types=${types}`
            )

            if (!response.ok) {
                throw new Error('Failed to fetch suggestions')
            }

            const data = await response.json()
            setSuggestions(data.predictions || [])
            setShowSuggestions((data.predictions || []).length > 0)
            setSelectedIndex(-1)
        } catch (error) {
            console.error('Error fetching address suggestions:', error)
            setSuggestions([])
            setShowSuggestions(false)
        } finally {
            setIsLoading(false)
        }
    }, [types])

    // Handle input change with debouncing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchSuggestions(newValue)
        }, 300)
    }

    // Fetch place details to get lat/lng
    const fetchPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
        try {
            const response = await fetch(
                `${API_BASE}/api/places/details?place_id=${encodeURIComponent(placeId)}`
            )

            if (!response.ok) {
                throw new Error('Failed to fetch place details')
            }

            const data = await response.json()
            if (data.location) {
                return {
                    lat: data.location.lat,
                    lng: data.location.lng
                }
            }
            return null
        } catch (error) {
            console.error('Error fetching place details:', error)
            return null
        }
    }

    // Handle suggestion selection
    const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
        onChange(suggestion.description)
        setShowSuggestions(false)
        setSuggestions([])
        setSelectedIndex(-1)

        // Fetch lat/lng from place details
        const location = await fetchPlaceDetails(suggestion.place_id)

        onSelect({
            address: suggestion.description,
            lat: location?.lat ?? 0,
            lng: location?.lng ?? 0,
            place_id: suggestion.place_id
        })
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return

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
                    handleSelectSuggestion(suggestions[selectedIndex])
                }
                break
            case 'Escape':
                setShowSuggestions(false)
                setSelectedIndex(-1)
                break
        }
    }

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true)
                        }
                    }}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent ${inputClassName}`}
                    disabled={disabled}
                    autoComplete="off"
                />

                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-stone-500 border-t-transparent rounded-full" />
                    </div>
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.place_id}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                                    ? 'bg-stone-50'
                                    : 'hover:bg-stone-50'
                                } ${index !== suggestions.length - 1 ? 'border-b border-stone-100' : ''}`}
                        >
                            <div className="flex items-start gap-2">
                                <MapPinIcon className="h-4 w-4 text-stone-900 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-stone-900 truncate">
                                        {suggestion.main_text}
                                    </p>
                                    {suggestion.secondary_text && (
                                        <p className="text-xs text-stone-500 truncate">
                                            {suggestion.secondary_text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-stone-500 mt-1">
                Start typing for address suggestions
            </p>
        </div>
    )
}
