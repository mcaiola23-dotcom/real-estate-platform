import { useState, useEffect } from "react";

const STORAGE_KEY = "fairfield_saved_searches";

export type SavedSearch = {
    id: string;
    name: string;
    params: string; // Full URL search params string
    createdAt: number;
    filtersSummary: string; // Human readable summary e.g. "Westport, $1M-$2M"
};

export function useSavedSearches() {
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(STORAGE_KEY);
            if (item) {
                setSavedSearches(JSON.parse(item));
            }
        } catch (error) {
            console.warn("Error reading saved searches from localStorage:", error);
        } finally {
            setHasLoaded(true);
        }
    }, []);

    // Persist to local storage
    useEffect(() => {
        if (hasLoaded) {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
            } catch (error) {
                console.warn("Error saving searches to localStorage:", error);
            }
        }
    }, [savedSearches, hasLoaded]);

    const saveSearch = (name: string, params: string, filtersSummary: string) => {
        const newSearch: SavedSearch = {
            id: crypto.randomUUID(),
            name,
            params,
            createdAt: Date.now(),
            filtersSummary,
        };
        setSavedSearches((prev) => [newSearch, ...prev]);
    };

    const deleteSearch = (id: string) => {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    };

    return {
        savedSearches,
        saveSearch,
        deleteSearch,
        hasLoaded,
    };
}
