/**
 * Favorites Hook
 * 
 * Client-side hook for managing saved/favorite listings.
 * - Logged out: Uses localStorage (local-first experience)
 * - Logged in: Syncs with Sanity via API (cloud storage)
 * 
 * On login, localStorage favorites are merged with cloud data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

const FAVORITES_STORAGE_KEY = 'mattcaiola_saved_listings';

export interface UseFavoritesReturn {
    favorites: string[];
    isFavorite: (listingId: string) => boolean;
    toggleFavorite: (listingId: string) => void;
    addFavorite: (listingId: string) => void;
    removeFavorite: (listingId: string) => void;
    clearFavorites: () => void;
    isSyncing: boolean;
    isLoaded: boolean;
}

function getFavoritesFromStorage(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to parse favorites from localStorage:', e);
    }
    return [];
}

function saveFavoritesToStorage(favorites: string[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.warn('Failed to save favorites to localStorage:', e);
    }
}

export function useFavorites(): UseFavoritesReturn {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const hasInitialSynced = useRef(false);

    // Load favorites on mount (from localStorage initially)
    useEffect(() => {
        const stored = getFavoritesFromStorage();
        setFavorites(stored);
        setIsLoaded(true);
    }, []);

    // Sync with cloud when user signs in
    useEffect(() => {
        if (!authLoaded || !isLoaded) return;

        if (isSignedIn && !hasInitialSynced.current) {
            hasInitialSynced.current = true;
            syncWithCloud();
        } else if (!isSignedIn) {
            // User signed out - reset sync flag
            hasInitialSynced.current = false;
        }
    }, [isSignedIn, authLoaded, isLoaded]);

    // Sync localStorage favorites with cloud storage
    const syncWithCloud = async () => {
        setIsSyncing(true);
        try {
            const localFavorites = getFavoritesFromStorage();

            const response = await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ savedHomes: localFavorites }),
            });

            if (response.ok) {
                const data = await response.json();
                const cloudFavorites = data.profile?.savedHomes || [];
                setFavorites(cloudFavorites);
                // Update localStorage with merged cloud data
                saveFavoritesToStorage(cloudFavorites);
            }
        } catch (error) {
            console.error('Failed to sync favorites:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Update cloud when favorites change (if signed in)
    const updateCloud = useCallback(async (listingId: string, action: 'add' | 'remove') => {
        if (!isSignedIn) return;

        try {
            await fetch('/api/user/sync', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId, action }),
            });
        } catch (error) {
            console.error('Failed to update cloud:', error);
        }
    }, [isSignedIn]);

    const isFavorite = useCallback(
        (listingId: string) => favorites.includes(listingId),
        [favorites]
    );

    const addFavorite = useCallback((listingId: string) => {
        setFavorites((prev) => {
            if (prev.includes(listingId)) return prev;
            const updated = [...prev, listingId];
            saveFavoritesToStorage(updated);
            return updated;
        });
        updateCloud(listingId, 'add');
    }, [updateCloud]);

    const removeFavorite = useCallback((listingId: string) => {
        setFavorites((prev) => {
            const updated = prev.filter((id) => id !== listingId);
            saveFavoritesToStorage(updated);
            return updated;
        });
        updateCloud(listingId, 'remove');
    }, [updateCloud]);

    const toggleFavorite = useCallback((listingId: string) => {
        setFavorites((prev) => {
            const isCurrentlyFavorite = prev.includes(listingId);
            const updated = isCurrentlyFavorite
                ? prev.filter((id) => id !== listingId)
                : [...prev, listingId];
            saveFavoritesToStorage(updated);

            // Update cloud
            updateCloud(listingId, isCurrentlyFavorite ? 'remove' : 'add');

            return updated;
        });
    }, [updateCloud]);

    const clearFavorites = useCallback(() => {
        setFavorites([]);
        saveFavoritesToStorage([]);
        // Note: clearFavorites doesn't sync to cloud - intentional for now
    }, []);

    return {
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        isSyncing,
        isLoaded,
    };
}

