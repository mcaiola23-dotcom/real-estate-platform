'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth'
import { HeartIcon, TrashIcon, MapPinIcon, HomeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import PropertyDetailModal from '@/components/PropertyDetailModal'

interface FavoriteProperty {
    favorite_id: number
    listing_id: number | null
    parcel_id: string | null
    created_at: string
    property_address: string | null
    property_city: string | null
    property_state: string | null
    property_zip: string | null
    property_price: number | null
    property_status: string | null
    bedrooms: number | null
    bathrooms: number | null
    square_feet: number | null
    lot_size_acres: number | null
    year_built: number | null
    property_type: string | null
    photo_url: string | null
    photos: string[] | null
    has_pool: boolean | null
    is_waterfront: boolean | null
}

const API_BASE = '/api/portal'

export default function FavoritesPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading, accessToken } = useAuth()
    const [favorites, setFavorites] = useState<FavoriteProperty[]>([])
    const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [modalListingId, setModalListingId] = useState<number | null>(null)
    const [parcelModalOpen, setParcelModalOpen] = useState(false)
    const [parcelModalId, setParcelModalId] = useState<string | null>(null)

    const handleNeighborPropertyClick = useCallback((parcelId: string, listingId?: number) => {
        setModalOpen(false)
        setModalListingId(null)
        setParcelModalOpen(false)
        setParcelModalId(null)
        setTimeout(() => {
            if (listingId) {
                setModalListingId(listingId)
                setModalOpen(true)
            } else {
                setParcelModalId(parcelId)
                setParcelModalOpen(true)
            }
        }, 150)
    }, [])

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/')
        }
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            fetchFavorites()
        }
    }, [isAuthenticated, accessToken])

    const fetchFavorites = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/favorites`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error('Failed to fetch favorites')

            const data = await response.json()
            // API returns {favorites: [...], total: X}
            setFavorites(data.favorites || [])
        } catch (err) {
            console.error('Error fetching favorites:', err)
            setError('Failed to load saved properties')
            setFavorites([]) // Ensure empty array on error
        } finally {
            setIsLoadingFavorites(false)
        }
    }

    const removeFavorite = async (favoriteId: number) => {
        try {
            const response = await fetch(`${API_BASE}/api/favorites/${favoriteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error('Failed to remove favorite')

            setFavorites(favorites.filter(f => f.favorite_id !== favoriteId))
        } catch (err) {
            setError('Failed to remove property')
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-100 text-emerald-700'
            case 'Pending':
                return 'bg-amber-100 text-amber-700'
            case 'Sold':
                return 'bg-stone-100 text-stone-700'
            default:
                return 'bg-stone-100 text-stone-800'
        }
    }

    const handleViewProperty = (favorite: FavoriteProperty) => {
        if (favorite.listing_id) {
            setModalListingId(favorite.listing_id)
            setModalOpen(true)
        } else if (favorite.parcel_id) {
            setParcelModalId(favorite.parcel_id)
            setParcelModalOpen(true)
        }
    }

    if (isLoading || isLoadingFavorites) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                        <HeartSolidIcon className="h-8 w-8 text-red-500" />
                        Saved Properties
                    </h1>
                    <p className="mt-2 text-stone-500">
                        Properties you&apos;ve saved for quick access
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {favorites.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <HeartIcon className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-stone-900 mb-2">
                            No saved properties yet
                        </h2>
                        <p className="text-stone-500 mb-6">
                            Start browsing properties and click the heart icon to save them here.
                        </p>
                        <button
                            onClick={() => router.push('/properties')}
                            className="px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                        >
                            Browse Properties
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {favorites.map((favorite) => (
                            <div
                                key={favorite.favorite_id}
                                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewProperty(favorite)}
                            >
                                {/* Photo */}
                                <div className="h-48 bg-stone-100 relative overflow-hidden">
                                    {favorite.photo_url ? (
                                        <img
                                            src={favorite.photo_url}
                                            alt={favorite.property_address || 'Property'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <HomeIcon className="h-16 w-16 text-stone-300" />
                                        </div>
                                    )}
                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(favorite.property_status)}`}>
                                            {favorite.property_status || 'Off-Market'}
                                        </span>
                                    </div>
                                    {/* Remove Button */}
                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFavorite(favorite.favorite_id)
                                            }}
                                            className="p-2 bg-white/90 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <TrashIcon className="h-5 w-5 text-red-500" />
                                        </button>
                                    </div>
                                    {/* Feature Badges */}
                                    <div className="absolute bottom-3 left-3 flex gap-2">
                                        {favorite.has_pool && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-stone-500 text-white">
                                                Pool
                                            </span>
                                        )}
                                        {favorite.is_waterfront && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-500 text-white">
                                                Waterfront
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4">
                                    {/* Price */}
                                    <p className="text-2xl font-bold text-stone-900">
                                        {favorite.property_price
                                            ? formatPrice(favorite.property_price)
                                            : 'Price N/A'}
                                        {favorite.property_status === 'Off-Market' && favorite.property_price && (
                                            <span className="ml-2 text-sm font-normal text-stone-500">
                                                (Est.)
                                            </span>
                                        )}
                                    </p>

                                    {/* Property Stats */}
                                    <div className="flex items-center gap-4 text-sm text-stone-500 mt-2">
                                        {favorite.bedrooms && (
                                            <span>{favorite.bedrooms} bed</span>
                                        )}
                                        {favorite.bathrooms && (
                                            <span>{favorite.bathrooms} bath</span>
                                        )}
                                        {favorite.square_feet && (
                                            <span>{favorite.square_feet.toLocaleString()} sqft</span>
                                        )}
                                        {favorite.lot_size_acres && favorite.lot_size_acres >= 0.1 && (
                                            <span>{favorite.lot_size_acres.toFixed(2)} acres</span>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <p className="text-sm text-stone-500 mt-2 flex items-center gap-1">
                                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">
                                            {favorite.property_address || 'Address Not Available'}
                                            {favorite.property_city && `, ${favorite.property_city}`}
                                        </span>
                                    </p>

                                    {/* Property Type */}
                                    {favorite.property_type && (
                                        <p className="text-xs text-stone-500 mt-1">
                                            {favorite.property_type}
                                            {favorite.year_built && ` • Built ${favorite.year_built}`}
                                        </p>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleViewProperty(favorite)
                                        }}
                                        className="mt-4 w-full py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Unified Property Detail Modal */}
            {(modalListingId || parcelModalId) && (
                <PropertyDetailModal
                    listingId={modalListingId ?? undefined}
                    parcelId={parcelModalId ?? undefined}
                    isOpen={modalOpen || parcelModalOpen}
                    onClose={() => {
                        setModalOpen(false)
                        setModalListingId(null)
                        setParcelModalOpen(false)
                        setParcelModalId(null)
                    }}
                    onPropertyClick={handleNeighborPropertyClick}
                />
            )}
        </div>
    )
}
