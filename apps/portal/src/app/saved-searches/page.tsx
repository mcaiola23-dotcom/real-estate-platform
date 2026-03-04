'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth'
import {
    BookmarkIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    BellIcon,
    BellSlashIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'

interface SavedSearch {
    id: number
    name: string
    filters: {
        cities?: string[]
        neighborhoods?: string[]
        propertyTypes?: string[]
        priceMin?: number
        priceMax?: number
        bedroomsMin?: number
        bedroomsMax?: number
    }
    ai_query?: string
    created_at: string
    last_used_at?: string
}

const API_BASE = '/api/portal'

export default function SavedSearchesPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading, accessToken } = useAuth()
    const [searches, setSearches] = useState<SavedSearch[]>([])
    const [isLoadingSearches, setIsLoadingSearches] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/')
        }
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            fetchSearches()
        }
    }, [isAuthenticated, accessToken])

    const fetchSearches = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/saved-searches`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error('Failed to fetch searches')

            const data = await response.json()
            // API returns {searches: [...], total: X}
            setSearches(data.searches || [])
        } catch (err) {
            console.error('Error fetching saved searches:', err)
            setError('Failed to load saved searches')
            setSearches([]) // Ensure empty array on error
        } finally {
            setIsLoadingSearches(false)
        }
    }

    const deleteSearch = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE}/api/saved-searches/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error('Failed to delete search')

            setSearches(searches.filter(s => s.id !== id))
        } catch (err) {
            setError('Failed to delete search')
        }
    }


    const loadSearch = (search: SavedSearch) => {
        // Build query params from filters
        const params = new URLSearchParams()

        if (search.filters.cities?.length) {
            params.set('cities', search.filters.cities.join(','))
        }
        if (search.filters.priceMin) {
            params.set('priceMin', search.filters.priceMin.toString())
        }
        if (search.filters.priceMax) {
            params.set('priceMax', search.filters.priceMax.toString())
        }
        if (search.filters.bedroomsMin) {
            params.set('bedsMin', search.filters.bedroomsMin.toString())
        }
        if (search.ai_query) {
            params.set('q', search.ai_query)
        }

        // Add flag to auto-execute search
        params.set('autoSearch', 'true')

        router.push(`/properties?${params.toString()}`)
    }

    const formatFilters = (search: SavedSearch) => {
        const parts: string[] = []

        if (search.ai_query) {
            return `"${search.ai_query.length > 40 ? search.ai_query.slice(0, 40) + '...' : search.ai_query}"`
        }

        if (search.filters.cities?.length) {
            parts.push(search.filters.cities.slice(0, 2).join(', '))
        }
        if (search.filters.bedroomsMin) {
            parts.push(`${search.filters.bedroomsMin}+ beds`)
        }
        if (search.filters.priceMax) {
            const priceK = Math.round(search.filters.priceMax / 1000)
            parts.push(`Under $${priceK >= 1000 ? `${(priceK / 1000).toFixed(1)}M` : `${priceK}K`}`)
        }

        return parts.length > 0 ? parts.join(' • ') : 'All Properties'
    }

    if (isLoading || isLoadingSearches) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                        <BookmarkSolidIcon className="h-8 w-8 text-stone-900" />
                        Saved Searches
                    </h1>
                    <p className="mt-2 text-stone-500">
                        Quickly access your saved search criteria and manage alerts
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {searches.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <BookmarkIcon className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-stone-900 mb-2">
                            No saved searches yet
                        </h2>
                        <p className="text-stone-500 mb-6">
                            Save your search criteria to quickly access them later.
                        </p>
                        <button
                            onClick={() => router.push('/properties')}
                            className="px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                        >
                            Start Searching
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {searches.map((search) => (
                            <div
                                key={search.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-stone-900">
                                            {search.name}
                                        </h3>
                                        <p className="text-sm text-stone-500 mt-1">
                                            {formatFilters(search)}
                                        </p>
                                        {search.last_used_at && (
                                            <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                Last used: {new Date(search.last_used_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Delete */}
                                        <button
                                            onClick={() => deleteSearch(search.id)}
                                            className="p-2 bg-stone-100 text-stone-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                            title="Delete search"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Load Search Button */}
                                <button
                                    onClick={() => loadSearch(search)}
                                    className="mt-4 w-full py-2.5 border border-stone-900 text-stone-900 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                    Load Search
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
