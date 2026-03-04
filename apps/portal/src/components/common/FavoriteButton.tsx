'use client'

import { useState, useEffect, useCallback } from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/components/auth'

interface FavoriteButtonProps {
    listingId?: number
    parcelId?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
    showLoginPrompt?: boolean
}

// localStorage key for guest favorites
const GUEST_FAVORITES_KEY = 'smartmls-guest-favorites'

interface GuestFavorite {
    listingId?: number
    parcelId?: string
    addedAt: string
}

// Guest favorites management
function getGuestFavorites(): GuestFavorite[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(GUEST_FAVORITES_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function saveGuestFavorites(favorites: GuestFavorite[]): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(favorites))
    } catch {
        console.error('Failed to save guest favorites')
    }
}

export default function FavoriteButton({
    listingId,
    parcelId,
    className = '',
    size = 'md',
    showLoginPrompt = true,
}: FavoriteButtonProps) {
    const { isAuthenticated, signIn, accessToken } = useAuth()
    const [isFavorited, setIsFavorited] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    // Size classes
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    }

    // Check initial favorite state
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            checkAuthenticatedFavorite()
        } else if (!isAuthenticated) {
            checkGuestFavorite()
        }
    }, [isAuthenticated, accessToken, listingId, parcelId])

    const checkAuthenticatedFavorite = async () => {
        if (!accessToken) return
        try {
            const params = new URLSearchParams()
            if (listingId) params.set('listing_id', listingId.toString())
            if (parcelId) params.set('parcel_id', parcelId)

            const response = await fetch(
                `/api/portal/api/favorites/check?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            )

            if (response.ok) {
                const data = await response.json()
                setIsFavorited(data.is_favorited)
            }
        } catch {
            // Silently fail
        }
    }

    const checkGuestFavorite = () => {
        const favorites = getGuestFavorites()
        const exists = favorites.some(
            (f) =>
                (listingId && f.listingId === listingId) ||
                (parcelId && f.parcelId === parcelId)
        )
        setIsFavorited(exists)
    }

    const handleToggle = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return

        if (!isAuthenticated) {
            // Guest user - use localStorage
            const favorites = getGuestFavorites()
            const existingIndex = favorites.findIndex(
                (f) =>
                    (listingId && f.listingId === listingId) ||
                    (parcelId && f.parcelId === parcelId)
            )

            if (existingIndex >= 0) {
                // Remove from favorites
                favorites.splice(existingIndex, 1)
                saveGuestFavorites(favorites)
                setIsFavorited(false)
            } else {
                // Add to favorites (max 20 for guests)
                if (favorites.length >= 20 && showLoginPrompt) {
                    setShowTooltip(true)
                    setTimeout(() => setShowTooltip(false), 3000)
                    return
                }

                favorites.push({
                    listingId,
                    parcelId,
                    addedAt: new Date().toISOString(),
                })
                saveGuestFavorites(favorites)
                setIsFavorited(true)
            }
            return
        }

        // Authenticated user - use API
        setIsLoading(true)
        try {
            if (isFavorited) {
                // Remove favorite
                const params = new URLSearchParams()
                if (listingId) params.set('listing_id', listingId.toString())
                if (parcelId) params.set('parcel_id', parcelId)

                await fetch(
                    `/api/portal/api/favorites/by-property?${params}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }
                )
                setIsFavorited(false)
            } else {
                // Add favorite
                await fetch(`/api/portal/api/favorites`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        listing_id: listingId,
                        parcel_id: parcelId,
                    }),
                })
                setIsFavorited(true)
            }
        } catch {
            // Silently fail - optimistic UI will revert
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, accessToken, isFavorited, isLoading, listingId, parcelId, showLoginPrompt])

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`p-2 rounded-full transition-all ${isFavorited
                    ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-stone-400 hover:text-red-500 hover:bg-stone-100'
                    } ${isLoading ? 'opacity-50' : ''} ${className}`}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
                {isFavorited ? (
                    <HeartSolidIcon className={sizeClasses[size]} />
                ) : (
                    <HeartIcon className={sizeClasses[size]} />
                )}
            </button>

            {/* Tooltip for guest limit */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
                    <button
                        onClick={() => signIn()}
                        className="text-stone-400 hover:text-stone-300 underline"
                    >
                        Sign in
                    </button>{' '}
                    to save more favorites
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                </div>
            )}
        </div>
    )
}
