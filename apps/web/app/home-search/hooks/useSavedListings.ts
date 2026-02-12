import { useState, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";

const STORAGE_KEY = "fairfield_saved_listings";

export function useSavedListings() {
    const { isSignedIn } = useUser();
    const clerk = useClerk();
    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(STORAGE_KEY);
            if (item) {
                setSavedIds(JSON.parse(item));
            }
        } catch (error) {
            console.warn("Error reading saved listings from localStorage:", error);
        } finally {
            setHasLoaded(true);
        }
    }, []);

    // Save to local storage whenever savedIds changes
    useEffect(() => {
        if (hasLoaded) {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
            } catch (error) {
                console.warn("Error saving listings to localStorage:", error);
            }
        }
    }, [savedIds, hasLoaded]);

    const toggleSave = (id: string) => {
        if (!isSignedIn) {
            clerk.openSignIn();
            return;
        }

        setSavedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((savedId) => savedId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const isSaved = (id: string) => savedIds.includes(id);

    return {
        savedIds,
        toggleSave,
        isSaved,
        hasLoaded,
    };
}
