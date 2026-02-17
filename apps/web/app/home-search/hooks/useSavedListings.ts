import { useState, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { trackWebsiteEvent } from "../../lib/analytics/website-events";

const STORAGE_KEY = "fairfield_saved_listings";

interface ListingInteractionContext {
    id: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    price?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    propertyType?: string;
}

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

    const toggleSave = (listing: string | ListingInteractionContext) => {
        if (!isSignedIn) {
            clerk.openSignIn();
            return;
        }

        const listingId = typeof listing === "string" ? listing : listing.id;
        const listingContext = typeof listing === "string" ? null : listing;

        setSavedIds((prev) => {
            const isCurrentlySaved = prev.includes(listingId);

            void trackWebsiteEvent({
                eventType: isCurrentlySaved ? "website.listing.unfavorited" : "website.listing.favorited",
                payload: {
                    source: "home_search",
                    listing: {
                        id: listingId,
                        address: listingContext?.address?.street || null,
                        city: listingContext?.address?.city || null,
                        state: listingContext?.address?.state || null,
                        zip: listingContext?.address?.zip || null,
                        price: listingContext?.price ?? null,
                        beds: listingContext?.beds ?? null,
                        baths: listingContext?.baths ?? null,
                        sqft: listingContext?.sqft ?? null,
                        propertyType: listingContext?.propertyType || null,
                    },
                    searchContext: null,
                    actor: null,
                },
            });

            if (isCurrentlySaved) {
                return prev.filter((savedId) => savedId !== listingId);
            } else {
                return [...prev, listingId];
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
