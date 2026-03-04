'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPinIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon, BuildingOffice2Icon, HomeIcon, AcademicCapIcon, HeartIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/auth'
import GooglePlacesAutocomplete, { PlaceDetails } from '@/components/common/GooglePlacesAutocomplete'

const API_BASE = '/api/portal';

interface SavedLocation {
    id: number
    location_type: string
    label: string | null
    address: string
    lat: number
    lng: number
    commute_mode: string
    is_primary: boolean
}

const LOCATION_TYPES = [
    { value: 'work', label: 'Work', icon: BuildingOffice2Icon },
    { value: 'home', label: 'Home', icon: HomeIcon },
    { value: 'gym', label: 'Gym', icon: BuildingStorefrontIcon },
    { value: 'school', label: 'School', icon: AcademicCapIcon },
    { value: 'daycare', label: 'Daycare', icon: HeartIcon },
    { value: 'partner_office', label: "Partner's Office", icon: BuildingOffice2Icon },
    { value: 'other', label: 'Other', icon: MapPinIcon },
]

const COMMUTE_MODES = [
    { value: 'driving', label: 'Driving' },
    { value: 'transit', label: 'Transit' },
    { value: 'bicycling', label: 'Bicycling' },
    { value: 'walking', label: 'Walking' },
]

export default function SavedLocationsSection() {
    const { isAuthenticated } = useAuth()
    const [locations, setLocations] = useState<SavedLocation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null)

    // Form state
    const [formType, setFormType] = useState('work')
    const [formLabel, setFormLabel] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const [formCommuteMode, setFormCommuteMode] = useState('driving')
    const [formIsPrimary, setFormIsPrimary] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null)

    const fetchLocations = useCallback(async () => {
        if (!isAuthenticated) return

        try {
            const response = await fetch(`${API_BASE}/api/locations`, {
                credentials: 'include',
            })
            if (response.ok) {
                const data = await response.json()
                setLocations(data)
            }
        } catch (err) {
            setError('Failed to load saved locations')
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated])

    useEffect(() => {
        fetchLocations()
    }, [fetchLocations])

    const resetForm = () => {
        setFormType('work')
        setFormLabel('')
        setFormAddress('')
        setFormCommuteMode('driving')
        setFormIsPrimary(false)
        setEditingLocation(null)
        setSelectedPlace(null)
    }

    const handleAddLocation = async () => {
        if (!formAddress.trim()) {
            setError('Please enter an address')
            return
        }

        // Use selected place coordinates or fallback to 0,0 (will be geocoded server-side if needed)
        const lat = selectedPlace?.lat ?? 0
        const lng = selectedPlace?.lng ?? 0

        if (lat === 0 && lng === 0) {
            setError('Please select an address from the suggestions')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/api/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    location_type: formType,
                    label: formLabel || null,
                    address: formAddress,
                    lat,
                    lng,
                    commute_mode: formCommuteMode,
                    is_primary: formIsPrimary,
                }),
            })

            if (!response.ok) throw new Error('Failed to save location')

            await fetchLocations()
            setShowAddModal(false)
            resetForm()
        } catch (err) {
            setError('Failed to save location')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateLocation = async () => {
        if (!editingLocation) return

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/api/locations/${editingLocation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    location_type: formType,
                    label: formLabel || null,
                    address: formAddress,
                    commute_mode: formCommuteMode,
                    is_primary: formIsPrimary,
                }),
            })

            if (!response.ok) throw new Error('Failed to update location')

            await fetchLocations()
            setShowAddModal(false)
            resetForm()
        } catch (err) {
            setError('Failed to update location')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteLocation = async (id: number) => {
        if (!confirm('Are you sure you want to delete this location?')) return

        try {
            const response = await fetch(`${API_BASE}/api/locations/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) throw new Error('Failed to delete location')

            setLocations(prev => prev.filter(l => l.id !== id))
        } catch (err) {
            setError('Failed to delete location')
        }
    }

    const openEditModal = (location: SavedLocation) => {
        setEditingLocation(location)
        setFormType(location.location_type)
        setFormLabel(location.label || '')
        setFormAddress(location.address)
        setFormCommuteMode(location.commute_mode)
        setFormIsPrimary(location.is_primary)
        setShowAddModal(true)
    }

    const getLocationIcon = (type: string) => {
        const found = LOCATION_TYPES.find(t => t.value === type)
        return found?.icon || MapPinIcon
    }

    const getLocationLabel = (type: string) => {
        const found = LOCATION_TYPES.find(t => t.value === type)
        return found?.label || 'Other'
    }

    if (!isAuthenticated) return null

    return (
        <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5" />
                    Saved Locations
                </h3>
                <button
                    onClick={() => {
                        resetForm()
                        setShowAddModal(true)
                    }}
                    className="flex items-center gap-1 text-sm font-medium text-stone-900 hover:text-stone-700"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Location
                </button>
            </div>

            <p className="text-sm text-stone-500 mb-4">
                Save your frequently visited locations to see commute times on property listings.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-stone-500 border-t-transparent rounded-full" />
                </div>
            ) : locations.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                    <MapPinIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No saved locations yet</p>
                    <p className="text-sm">Add your work, home, or other locations to see commute times.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {locations.map(location => {
                        const Icon = getLocationIcon(location.location_type)
                        return (
                            <div
                                key={location.id}
                                className={`flex items-center gap-4 p-4 rounded-lg border ${location.is_primary ? 'border-stone-300 bg-stone-50' : 'border-stone-200 bg-stone-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${location.is_primary ? 'bg-stone-100' : 'bg-stone-200'}`}>
                                    <Icon className={`h-5 w-5 ${location.is_primary ? 'text-stone-900' : 'text-stone-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-stone-900">
                                            {location.label || getLocationLabel(location.location_type)}
                                        </span>
                                        {location.is_primary && (
                                            <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-800 rounded-full">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-stone-500 truncate">{location.address}</p>
                                    <p className="text-xs text-stone-500 capitalize">{location.commute_mode}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(location)}
                                        className="p-2 rounded-lg hover:bg-stone-200 text-stone-500"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLocation(location.id)}
                                        className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">
                                {editingLocation ? 'Edit Location' : 'Add Location'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    resetForm()
                                }}
                                className="p-2 hover:bg-stone-100 rounded-lg"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Type</label>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                >
                                    {LOCATION_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    Label (optional)
                                </label>
                                <input
                                    type="text"
                                    value={formLabel}
                                    onChange={(e) => setFormLabel(e.target.value)}
                                    placeholder="e.g. Downtown Office, Main Gym"
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Address</label>
                                <GooglePlacesAutocomplete
                                    value={formAddress}
                                    onChange={setFormAddress}
                                    onSelect={(place) => {
                                        setFormAddress(place.address)
                                        setSelectedPlace(place)
                                    }}
                                    placeholder="Start typing an address..."
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    Preferred Commute Mode
                                </label>
                                <select
                                    value={formCommuteMode}
                                    onChange={(e) => setFormCommuteMode(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                >
                                    {COMMUTE_MODES.map(mode => (
                                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formIsPrimary}
                                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                                    className="h-4 w-4 text-stone-900 rounded"
                                />
                                <span className="text-sm text-stone-600">Set as primary location</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={editingLocation ? handleUpdateLocation : handleAddLocation}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : editingLocation ? 'Update' : 'Add Location'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    resetForm()
                                }}
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
