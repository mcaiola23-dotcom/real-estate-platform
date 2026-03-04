'use client'

import { useState, useEffect, useCallback } from 'react'
import { BellAlertIcon, PlusIcon, TrashIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/auth'

const API_BASE = '/api/portal'

interface SearchAlert {
    id: number
    saved_search_id: number
    search_name: string
    frequency: string
    is_active: boolean
    last_sent_at: string | null
    created_at: string
}

interface SavedSearch {
    id: number
    name: string
    filters: Record<string, any>
    ai_query: string | null
}

export default function EmailAlertsSection() {
    const { isAuthenticated, accessToken } = useAuth()
    const [alerts, setAlerts] = useState<SearchAlert[]>([])
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedSearchId, setSelectedSearchId] = useState<number | null>(null)
    const [selectedFrequency, setSelectedFrequency] = useState('daily')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch alerts
    const fetchAlerts = useCallback(async () => {
        if (!isAuthenticated || !accessToken) return

        try {
            const response = await fetch(`${API_BASE}/api/alerts`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (response.ok) {
                const data = await response.json()
                setAlerts(data.alerts || [])
            }
        } catch (err) {
            console.error('Error fetching alerts:', err)
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated, accessToken])

    // Fetch saved searches
    const fetchSavedSearches = useCallback(async () => {
        if (!isAuthenticated || !accessToken) return

        try {
            const response = await fetch(`${API_BASE}/api/saved-searches`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (response.ok) {
                const data = await response.json()
                setSavedSearches(data.searches || [])
            }
        } catch (err) {
            console.error('Error fetching saved searches:', err)
        }
    }, [isAuthenticated, accessToken])

    useEffect(() => {
        fetchAlerts()
        fetchSavedSearches()
    }, [fetchAlerts, fetchSavedSearches])

    // Create alert
    const handleCreateAlert = async () => {
        if (!selectedSearchId || !accessToken) return

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/api/alerts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    saved_search_id: selectedSearchId,
                    frequency: selectedFrequency
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to create alert')
            }

            await fetchAlerts()
            setShowCreateModal(false)
            setSelectedSearchId(null)
            setSelectedFrequency('daily')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create alert')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Toggle alert active status
    const handleToggleAlert = async (alertId: number, currentStatus: boolean) => {
        if (!accessToken) return

        try {
            const response = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: !currentStatus })
            })

            if (response.ok) {
                setAlerts(prev => prev.map(a =>
                    a.id === alertId ? { ...a, is_active: !currentStatus } : a
                ))
            }
        } catch (err) {
            console.error('Error toggling alert:', err)
        }
    }

    // Update alert frequency
    const handleUpdateFrequency = async (alertId: number, newFrequency: string) => {
        if (!accessToken) return

        try {
            const response = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ frequency: newFrequency })
            })

            if (response.ok) {
                setAlerts(prev => prev.map(a =>
                    a.id === alertId ? { ...a, frequency: newFrequency } : a
                ))
            }
        } catch (err) {
            console.error('Error updating frequency:', err)
        }
    }

    // Delete alert
    const handleDeleteAlert = async (alertId: number) => {
        if (!accessToken) return

        try {
            const response = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })

            if (response.ok) {
                setAlerts(prev => prev.filter(a => a.id !== alertId))
            }
        } catch (err) {
            console.error('Error deleting alert:', err)
        }
    }

    // Get search IDs that already have alerts
    const searchIdsWithAlerts = new Set(alerts.map(a => a.saved_search_id))
    const availableSearches = savedSearches.filter(s => !searchIdsWithAlerts.has(s.id))

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const date = new Date(dateString)
        return date.toLocaleDateString()
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                    <BellAlertIcon className="h-5 w-5" />
                    Search Alerts
                </h3>
                {availableSearches.length > 0 && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-stone-900 hover:bg-stone-50 rounded-lg"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Alert
                    </button>
                )}
            </div>

            <p className="text-sm text-stone-500 mb-4">
                Get notified when new listings match your saved searches.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-6">
                    <div className="animate-spin h-6 w-6 border-2 border-stone-500 border-t-transparent rounded-full mx-auto" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-6 bg-stone-50 rounded-lg">
                    <BellAlertIcon className="h-8 w-8 mx-auto text-stone-400 mb-2" />
                    <p className="text-stone-500 text-sm">No alerts set up yet</p>
                    {savedSearches.length === 0 ? (
                        <p className="text-stone-500 text-xs mt-1">Save a search first to create alerts</p>
                    ) : (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-3 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
                        >
                            Create Your First Alert
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${alert.is_active ? 'border-stone-200 bg-stone-50/50' : 'border-stone-200 bg-stone-50'
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${alert.is_active ? 'text-stone-900' : 'text-stone-500'}`}>
                                        {alert.search_name}
                                    </span>
                                    {!alert.is_active && (
                                        <span className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-500 rounded">Paused</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                                    <select
                                        value={alert.frequency}
                                        onChange={(e) => handleUpdateFrequency(alert.id, e.target.value)}
                                        className="text-xs border-none bg-transparent p-0 focus:ring-0 cursor-pointer"
                                        disabled={!alert.is_active}
                                    >
                                        <option value="instant">Instant</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                    <span>•</span>
                                    <span>Last sent: {formatDate(alert.last_sent_at)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                                    className={`p-2 rounded-lg transition-colors ${alert.is_active
                                            ? 'text-amber-600 hover:bg-amber-50'
                                            : 'text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                    title={alert.is_active ? 'Pause' : 'Resume'}
                                >
                                    {alert.is_active ? (
                                        <PauseIcon className="h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="h-4 w-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDeleteAlert(alert.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    title="Delete"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-stone-500 mt-4">
                {alerts.length}/5 alerts configured
            </p>

            {/* Create Alert Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">Create Search Alert</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    Saved Search
                                </label>
                                <select
                                    value={selectedSearchId || ''}
                                    onChange={(e) => setSelectedSearchId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                >
                                    <option value="">Select a search...</option>
                                    {availableSearches.map(search => (
                                        <option key={search.id} value={search.id}>
                                            {search.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    Notification Frequency
                                </label>
                                <select
                                    value={selectedFrequency}
                                    onChange={(e) => setSelectedFrequency(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                >
                                    <option value="instant">Instant (as listings are added)</option>
                                    <option value="daily">Daily digest</option>
                                    <option value="weekly">Weekly digest</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateAlert}
                                disabled={!selectedSearchId || isSubmitting}
                                className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Alert'}
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
