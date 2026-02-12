"use client";

import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useSavedListings } from "../home-search/hooks/useSavedListings";
import mockListings from "../data/listings/mock-listings.json";
import { Listing } from "../lib/data/providers/listings.types"; // Fixed import path
import Link from "next/link"; // Added missing import
import Image from "next/image"; // Added missing import
import { useMemo, useState } from "react";
import ListingInquiryModal from "../home-search/ListingInquiryModal"; // Ensure path is correct
import { ListingModal } from "../home-search/ListingModal"; // Ensure path is correct
import Container from "../components/Container";

// Reusing ListingCard - ideally this should be a shared component, but copying locally for now 
// or importing if it was exported. It wasn't exported from HomeSearchClient.
// I'll quickly recreate a version here or better yet, refactor ListingCard to a shared component?
// For speed/safety in this "agentic" flow, I'll inline a simple version or try to extract it.
// Checking file structure, there isn't a shared ListingCard. I will create a simple one here.

function SavedListingCard({
    listing,
    onSelect,
    onRemove,
}: {
    listing: Listing;
    onSelect: (listing: Listing) => void;
    onRemove: (e: React.MouseEvent) => void;
}) {
    const statusStyles: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-800",
        pending: "bg-amber-100 text-amber-800",
        sold: "bg-rose-100 text-rose-800",
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="relative group rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
                type="button"
                onClick={() => onSelect(listing)}
                className="block w-full text-left"
            >
                <div className="relative h-48 sm:h-56">
                    <Image
                        src={listing.photos[0]}
                        alt={listing.address.street}
                        fill
                        className="object-cover"
                    />
                    <span
                        className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${statusStyles[listing.status]}`}
                    >
                        {listing.status}
                    </span>
                </div>
                <div className="p-5">
                    <div className="text-xl font-semibold text-stone-900">
                        {formatPrice(listing.price)}
                    </div>
                    <div className="text-base text-stone-700 mt-1">{listing.address.street}</div>
                    <div className="text-sm text-stone-500">
                        {listing.address.city}, {listing.address.state}
                    </div>
                    <div className="mt-4 flex gap-4 text-sm text-stone-600 border-t border-stone-100 pt-3">
                        <span>{listing.beds} <span className="text-stone-400">bd</span></span>
                        <span>{listing.baths} <span className="text-stone-400">ba</span></span>
                        <span>{listing.sqft.toLocaleString()} <span className="text-stone-400">sqft</span></span>
                    </div>
                </div>
            </button>
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 flex items-center justify-center shadow-sm transition-colors text-rose-500"
                title="Remove from saved"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </button>
        </div>
    );
}

export default function SavedHomesClient() {
    const { isLoaded, isSignedIn } = useUser();
    const { savedIds, toggleSave } = useSavedListings();
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    const savedListings = useMemo(() => {
        // Note: In a real app with 10k+ listings, we would fetch by ID from API
        // with mock data, we filter the big list
        const allListings = mockListings.listings as unknown as Listing[];
        return savedIds
            .map((id) => allListings.find((l) => l.id === id))
            .filter((l): l is Listing => l !== undefined);
    }, [savedIds]);

    if (!isLoaded) return null;

    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="bg-white border-b border-stone-200">
                <Container className="py-12">
                    <h1 className="font-serif text-3xl md:text-4xl text-stone-900">Saved Homes</h1>
                </Container>
            </div>

            <Container className="py-12">
                {savedListings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-stone-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-medium text-stone-900 mb-2">No saved homes yet</h2>
                        <p className="text-stone-500 mb-8 max-w-sm mx-auto">
                            Start exploring listings and tap the heart icon to save properties you're interested in.
                        </p>
                        <Link
                            href="/home-search"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
                        >
                            Browse Listings
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {savedListings.map((listing) => (
                                <SavedListingCard
                                    key={listing.id}
                                    listing={listing}
                                    onSelect={(l) => {
                                        setSelectedListing(l);
                                        setSelectedPhotoIndex(0);
                                    }}
                                    onRemove={(e) => {
                                        e.stopPropagation();
                                        toggleSave(listing.id);
                                    }}
                                />
                            ))}
                        </div>

                        {/* C6: Lead Capture CTA */}
                        <div className="mt-12 bg-stone-900 rounded-2xl p-8 md:p-12 text-center">
                            <h2 className="text-2xl md:text-3xl font-serif font-medium text-white mb-4">
                                Interested in These Properties?
                            </h2>
                            <p className="text-stone-300 mb-8 max-w-2xl mx-auto">
                                Let Matt help you schedule tours, get more information, or make an offer on your saved homes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-stone-900 font-medium rounded-lg hover:bg-stone-100 transition-colors"
                                >
                                    Contact Matt
                                </Link>
                                <a
                                    href="tel:+19143256746"
                                    className="inline-flex items-center justify-center px-8 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call Now
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </Container>

            {selectedListing && (
                <ListingModal
                    listing={selectedListing}
                    photoIndex={selectedPhotoIndex}
                    onPhotoChange={setSelectedPhotoIndex}
                    onClose={() => setSelectedListing(null)}
                    isFavorite={true}
                    onToggleFavorite={() => toggleSave(selectedListing.id)}
                />
            )}
        </div>
    );
}
