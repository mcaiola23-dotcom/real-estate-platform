'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookmarkIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/components/auth'

const STORAGE_KEY = 'smartmls-saved-searches'
const API_BASE = '/api/portal'

export interface SavedSearch {
    id: string
    name: string
    filters: SearchFilters
    aiQuery?: string
    createdAt: string
    lastUsed?: string
}

export interface SearchFilters {
    cities?: string[]
    neighborhoods?: string[]
    propertyTypes?: string[]
    statuses?: string[]
    priceMin?: number
    priceMax?: number
    bedroomsMin?: number
    bedroomsMax?: number
    bathroomsMin?: number
    bathroomsMax?: number
    squareFeetMin?: number
    squareFeetMax?: number
    lotSizeMin?: number
    lotSizeMax?: number
}

interface SavedSearchesProps {
    currentFilters: SearchFilters
    currentAiQuery?: string
    onLoadSearch: (filters: SearchFilters, aiQuery?: string) => void
    showViewSaved?: boolean
    viewingSaved?: boolean
    onToggleViewSaved?: () => void
    className?: string
}

// Generate a readable name from filters
function generateSearchName(filters: SearchFilters, aiQuery?: string): string {
    if (aiQuery) {
        return aiQuery.length > 30 ? aiQuery.substring(0, 30) + '...' : aiQuery
    }

    const parts: string[] = []

    if (filters.cities && filters.cities.length > 0) {
        parts.push(filters.cities.slice(0, 2).join(', '))
    }

    if (filters.bedroomsMin) {
        parts.push(`${filters.bedroomsMin}+ beds`)
    }

    if (filters.priceMax) {
        const priceK = Math.round(filters.priceMax / 1000)
        parts.push(`Under $${priceK >= 1000 ? `${(priceK / 1000).toFixed(1)}M` : `${priceK}K`}`)
    }

    if (parts.length === 0) {
        parts.push('All Properties')
    }

    return parts.join(' \u2022 ')
}

function generateFiltersSummary(filters: SearchFilters, aiQuery?: string): string {
    if (aiQuery) return `AI: ${aiQuery}`
    const parts: string[] = []
    if (filters.cities?.length) parts.push(filters.cities.join(', '))
    if (filters.statuses?.length) parts.push(filters.statuses.join(', '))
    if (filters.priceMin) parts.push(`$${(filters.priceMin / 1000).toFixed(0)}K+`)
    if (filters.priceMax && filters.priceMax < 20000000) parts.push(`Under $${(filters.priceMax / 1000).toFixed(0)}K`)
    if (filters.bedroomsMin) parts.push(`${filters.bedroomsMin}+ beds`)
    if (filters.bathroomsMin) parts.push(`${filters.bathroomsMin}+ baths`)
    return parts.join(' \u2022 ') || 'All Properties'
}

// Load saved searches from localStorage
function loadFromLocalStorage(): SavedSearch[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

// Save searches to localStorage
function saveToLocalStorage(searches: SavedSearch[]): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
    } catch (e) {
        console.error('Failed to save searches to localStorage:', e)
    }
}

// Clear localStorage searches
function clearLocalStorage(): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
        console.error('Failed to clear localStorage:', e)
    }
}

export default function SavedSearches({
    currentFilters,
    currentAiQuery,
    onLoadSearch,
    showViewSaved = false,
    viewingSaved = false,
    onToggleViewSaved,
    className = ''
}: SavedSearchesProps) {
    const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth()
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [showListModal, setShowListModal] = useState(false)
    const [newSearchName, setNewSearchName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [hasMigrated, setHasMigrated] = useState(false)

    // Fetch searches from API
    const fetchFromAPI = useCallback(async (): Promise<SavedSearch[]> => {
        if (!accessToken) return []
        try {
            const response = await fetch(`${API_BASE}/api/saved-searches`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (response.ok) {
                const data = await response.json()
                return (data.searches || []).map((s: any) => ({
                    id: s.id.toString(),
                    name: s.name,
                    filters: s.filters,
                    aiQuery: s.ai_query,
                    createdAt: s.created_at,
                    lastUsed: s.last_used_at
                }))
            }
        } catch (error) {
            console.error('Error fetching saved searches from API:', error)
        }
        return []
    }, [accessToken])

    // Save search to API
    const saveToAPI = useCallback(async (name: string, filters: SearchFilters, aiQuery?: string): Promise<SavedSearch | null> => {
        if (!accessToken) return null
        try {
            const response = await fetch(`${API_BASE}/api/saved-searches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, filters, ai_query: aiQuery || null })
            })
            if (response.ok) {
                const s = await response.json()
                return {
                    id: s.id.toString(),
                    name: s.name,
                    filters: s.filters,
                    aiQuery: s.ai_query,
                    createdAt: s.created_at,
                    lastUsed: s.last_used_at
                }
            }
        } catch (error) {
            console.error('Error saving search to API:', error)
        }
        return null
    }, [accessToken])

    // Delete from API
    const deleteFromAPI = useCallback(async (searchId: string): Promise<boolean> => {
        if (!accessToken) return false
        try {
            const response = await fetch(`${API_BASE}/api/saved-searches/${searchId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            return response.ok
        } catch (error) {
            console.error('Error deleting search from API:', error)
            return false
        }
    }, [accessToken])

    // Migrate localStorage searches to API on first authenticated load
    const migrateToAPI = useCallback(async () => {
        if (!accessToken || hasMigrated) return
        const localSearches = loadFromLocalStorage()
        if (localSearches.length === 0) { setHasMigrated(true); return }
        for (const search of localSearches) {
            await saveToAPI(search.name, search.filters, search.aiQuery)
        }
        clearLocalStorage()
        setHasMigrated(true)
        const apiSearches = await fetchFromAPI()
        setSavedSearches(apiSearches)
    }, [accessToken, hasMigrated, saveToAPI, fetchFromAPI])

    // Load saved searches on mount
    useEffect(() => {
        if (authLoading) return
        const loadSearches = async () => {
            setIsLoading(true)
            if (isAuthenticated && accessToken) {
                const apiSearches = await fetchFromAPI()
                setSavedSearches(apiSearches)
                if (!hasMigrated) await migrateToAPI()
            } else {
                setSavedSearches(loadFromLocalStorage())
            }
            setIsLoading(false)
        }
        loadSearches()
    }, [isAuthenticated, accessToken, authLoading, fetchFromAPI, hasMigrated, migrateToAPI])

    // Save current search
    const handleSaveSearch = useCallback(async () => {
        const name = newSearchName.trim() || generateSearchName(currentFilters, currentAiQuery)
        if (isAuthenticated && accessToken) {
            const newSearch = await saveToAPI(name, currentFilters, currentAiQuery)
            if (newSearch) setSavedSearches(prev => [newSearch, ...prev].slice(0, 10))
        } else {
            const newSearch: SavedSearch = {
                id: Date.now().toString(),
                name,
                filters: currentFilters,
                aiQuery: currentAiQuery,
                createdAt: new Date().toISOString()
            }
            const updated = [newSearch, ...savedSearches].slice(0, 10)
            setSavedSearches(updated)
            saveToLocalStorage(updated)
        }
        setShowSaveDialog(false)
        setNewSearchName('')
    }, [currentFilters, currentAiQuery, newSearchName, savedSearches, isAuthenticated, accessToken, saveToAPI])

    // Load a saved search
    const handleLoadSearch = useCallback((search: SavedSearch) => {
        const updated = savedSearches.map(s =>
            s.id === search.id ? { ...s, lastUsed: new Date().toISOString() } : s
        )
        setSavedSearches(updated)
        if (!isAuthenticated) saveToLocalStorage(updated)
        onLoadSearch(search.filters, search.aiQuery)
        setShowListModal(false)
    }, [savedSearches, onLoadSearch, isAuthenticated])

    // Delete a saved search
    const handleDeleteSearch = useCallback(async (searchId: string) => {
        if (isAuthenticated && accessToken) {
            const success = await deleteFromAPI(searchId)
            if (success) setSavedSearches(prev => prev.filter(s => s.id !== searchId))
        } else {
            const updated = savedSearches.filter(s => s.id !== searchId)
            setSavedSearches(updated)
            saveToLocalStorage(updated)
        }
    }, [savedSearches, isAuthenticated, accessToken, deleteFromAPI])

    const hasActiveFilters =
        (currentFilters.cities && currentFilters.cities.length > 0) ||
        currentFilters.priceMin || currentFilters.priceMax ||
        currentFilters.bedroomsMin || currentFilters.bathroomsMin ||
        currentAiQuery

    return (
        <>
            {/* Three pill buttons */}
            <div className={`flex items-center gap-2 ${className}`}>
                {/* Save search */}
                <button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors whitespace-nowrap"
                >
                    Save search
                </button>

                {/* Saved Searches */}
                <button
                    onClick={() => setShowListModal(true)}
                    className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors whitespace-nowrap"
                >
                    Saved Searches
                </button>

                {/* View saved (properties) */}
                {showViewSaved && onToggleViewSaved && (
                    <button
                        onClick={onToggleViewSaved}
                        className={`px-4 py-1.5 text-xs border rounded-full transition-colors whitespace-nowrap ${
                            viewingSaved
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400'
                        }`}
                    >
                        {viewingSaved ? 'Back to search' : 'View saved'}
                    </button>
                )}
            </div>

            {/* ── Save Search Dialog Modal ── */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-stone-900 mb-2">Name this search</h2>
                            <p className="text-sm text-stone-500 mb-4">
                                Give your search a name so you can easily find it later.
                            </p>
                            <input
                                type="text"
                                value={newSearchName}
                                onChange={(e) => setNewSearchName(e.target.value)}
                                placeholder={generateSearchName(currentFilters, currentAiQuery)}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent mb-4"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSearch()
                                    else if (e.key === 'Escape') setShowSaveDialog(false)
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSearch}
                                    className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                                >
                                    Save Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Saved Searches List Modal ── */}
            {showListModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowListModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                            <h2 className="text-xl font-serif text-stone-900">Saved Searches</h2>
                            <button
                                onClick={() => setShowListModal(false)}
                                className="text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4">
                            {isLoading ? (
                                <div className="text-center py-10 text-stone-400">
                                    <div className="animate-spin h-6 w-6 border-2 border-stone-400 border-t-transparent rounded-full mx-auto mb-3" />
                                    <p className="text-sm">Loading searches...</p>
                                </div>
                            ) : savedSearches.length === 0 ? (
                                <div className="text-center py-10 text-stone-500">
                                    <p>You haven&apos;t saved any searches yet.</p>
                                    <p className="text-sm mt-2">
                                        Set up your filters and click &ldquo;Save search&rdquo; to quickly access them later.
                                    </p>
                                </div>
                            ) : (
                                savedSearches.map((search) => (
                                    <div
                                        key={search.id}
                                        className="group relative bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-stone-900">{search.name}</h3>
                                                <p className="text-sm text-stone-500 mt-1">
                                                    {generateFiltersSummary(search.filters, search.aiQuery)}
                                                </p>
                                                <p className="text-xs text-stone-400 mt-2">
                                                    Saved {new Date(search.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSearch(search.id)}
                                                className="ml-4 p-2 text-stone-400 hover:text-rose-500 transition-colors rounded-full hover:bg-stone-50"
                                                title="Delete search"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleLoadSearch(search)}
                                            className="mt-4 w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Load Search
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Export a hook for components that need direct access to saved searches
export function useSavedSearches() {
    const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth()
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

    useEffect(() => {
        if (authLoading) return
        const loadSearches = async () => {
            if (isAuthenticated && accessToken) {
                try {
                    const response = await fetch(`${API_BASE}/api/saved-searches`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    })
                    if (response.ok) {
                        const data = await response.json()
                        setSavedSearches((data.searches || []).map((s: any) => ({
                            id: s.id.toString(),
                            name: s.name,
                            filters: s.filters,
                            aiQuery: s.ai_query,
                            createdAt: s.created_at,
                            lastUsed: s.last_used_at
                        })))
                    }
                } catch (error) {
                    console.error('Error in useSavedSearches:', error)
                }
            } else {
                setSavedSearches(loadFromLocalStorage())
            }
        }
        loadSearches()
    }, [isAuthenticated, accessToken, authLoading])

    const saveSearch = useCallback(async (filters: SearchFilters, aiQuery?: string, name?: string) => {
        const searchName = name || generateSearchName(filters, aiQuery)
        if (isAuthenticated && accessToken) {
            try {
                const response = await fetch(`${API_BASE}/api/saved-searches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: searchName, filters, ai_query: aiQuery || null })
                })
                if (response.ok) {
                    const s = await response.json()
                    const newSearch: SavedSearch = {
                        id: s.id.toString(),
                        name: s.name,
                        filters: s.filters,
                        aiQuery: s.ai_query,
                        createdAt: s.created_at
                    }
                    setSavedSearches(prev => [newSearch, ...prev].slice(0, 10))
                    return newSearch
                }
            } catch (error) {
                console.error('Error saving search:', error)
            }
            return null
        } else {
            const newSearch: SavedSearch = {
                id: Date.now().toString(),
                name: searchName,
                filters,
                aiQuery,
                createdAt: new Date().toISOString()
            }
            const updated = [newSearch, ...savedSearches].slice(0, 10)
            setSavedSearches(updated)
            saveToLocalStorage(updated)
            return newSearch
        }
    }, [savedSearches, isAuthenticated, accessToken])

    const deleteSearch = useCallback(async (searchId: string) => {
        if (isAuthenticated && accessToken) {
            try {
                const response = await fetch(`${API_BASE}/api/saved-searches/${searchId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                })
                if (response.ok) {
                    setSavedSearches(prev => prev.filter(s => s.id !== searchId))
                }
            } catch (error) {
                console.error('Error deleting search:', error)
            }
        } else {
            const updated = savedSearches.filter(s => s.id !== searchId)
            setSavedSearches(updated)
            saveToLocalStorage(updated)
        }
    }, [savedSearches, isAuthenticated, accessToken])

    return { savedSearches, saveSearch, deleteSearch }
}
