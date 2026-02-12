"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Listing, ListingStatus, STATUS_LABELS, PROPERTY_TYPE_LABELS } from "../lib/data/providers/listings.types";
import { formatFullPrice } from "../lib/data/providers/listings.provider";
import ListingInquiryModal from "./ListingInquiryModal";

// --- Components ---

function ListingLightbox({
    isOpen,
    onClose,
    photos,
    currentIndex,
    onIndexChange,
}: {
    isOpen: boolean;
    onClose: () => void;
    photos: string[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") {
                onIndexChange(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
            }
            if (e.key === "ArrowRight") {
                onIndexChange(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, currentIndex, photos.length, onIndexChange]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] bg-black flex flex-col items-center justify-center">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
                    <Image
                        src={photos[currentIndex]}
                        alt={`Photo ${currentIndex + 1}`}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white font-medium text-sm backdrop-blur-sm">
                {currentIndex + 1} / {photos.length}
            </div>
        </div>
    );
}

export function ListingModal({
    listing,
    photoIndex,
    onPhotoChange,
    onClose,
    isFavorite,
    onToggleFavorite,
}: {
    listing: Listing;
    photoIndex: number;
    onPhotoChange: (index: number) => void;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);

    const statusStyles: Record<ListingStatus, string> = {
        active: 'bg-stone-900 text-white border border-stone-800', // Dark pill for modal
        pending: 'bg-amber-100 text-amber-800 border border-amber-200',
        sold: 'bg-stone-100 text-stone-500 border border-stone-200',
    };

    const handlePrevPhoto = () => {
        onPhotoChange(photoIndex === 0 ? listing.photos.length - 1 : photoIndex - 1);
    };

    const handleNextPhoto = () => {
        onPhotoChange(photoIndex === listing.photos.length - 1 ? 0 : photoIndex + 1);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            // Only close modal if lightbox is not open
            if (e.key === "Escape" && !isLightboxOpen) onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose, isLightboxOpen]);

    return (
        <>
            {isInquiryOpen && (
                <ListingInquiryModal
                    listing={listing}
                    onClose={() => setIsInquiryOpen(false)}
                />
            )}
            <ListingLightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                photos={listing.photos}
                currentIndex={photoIndex}
                onIndexChange={onPhotoChange}
            />
            <div
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-7xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[listing.status]}`}>
                                {STATUS_LABELS[listing.status]}
                            </span>
                            <div>
                                <p className="text-lg font-semibold text-stone-900">{listing.address.street}</p>
                                <p className="text-sm text-stone-500">
                                    {listing.address.city}, {listing.address.state} {listing.address.zip}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onToggleFavorite}
                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${isFavorite
                                    ? "border-rose-200 bg-rose-50 text-rose-600"
                                    : "border-stone-200 text-stone-500 hover:text-rose-500 hover:border-rose-200"
                                    }`}
                                aria-label={isFavorite ? "Remove from saved" : "Save listing"}
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill={isFavorite ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                {isFavorite ? "Saved" : "Save"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full border border-stone-200 p-2 text-stone-400 hover:text-stone-600 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 p-6">
                            <div>
                                <div
                                    className="relative h-72 sm:h-80 lg:h-96 rounded-2xl overflow-hidden bg-stone-100 group cursor-pointer"
                                    onClick={() => setIsLightboxOpen(true)}
                                >
                                    <Image
                                        src={listing.photos[photoIndex] || listing.photos[0]}
                                        alt={listing.address.street}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    {listing.photos.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePrevPhoto();
                                                }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                                                aria-label="Previous photo"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNextPhoto();
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                                                aria-label="Next photo"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                                        {photoIndex + 1} / {listing.photos.length}
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-6 gap-2">
                                    {listing.photos.slice(0, 6).map((photo, index) => (
                                        <button
                                            key={`${listing.id}-thumb-${index}`}
                                            type="button"
                                            onClick={() => onPhotoChange(index)}
                                            className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${index === photoIndex
                                                ? "border-stone-900"
                                                : "border-transparent hover:border-stone-300"
                                                }`}
                                        >
                                            <Image src={photo} alt="" fill className="object-cover" />
                                            {index === 5 && listing.photos.length > 6 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium">
                                                    +{listing.photos.length - 6}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <p className="text-3xl font-semibold text-stone-900">{formatFullPrice(listing.price)}</p>
                                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
                                        <span className="flex items-center gap-1.5">
                                            <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            {listing.beds} beds
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                            </svg>
                                            {listing.baths} baths
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                            {listing.sqft.toLocaleString()} sqft
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-stone-100 pt-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-stone-400">Property Type</span>
                                            <p className="text-stone-700 font-medium">{PROPERTY_TYPE_LABELS[listing.propertyType]}</p>
                                        </div>
                                        {listing.address.neighborhood && (
                                            <div>
                                                <span className="text-stone-400">Neighborhood</span>
                                                <p className="text-stone-700 font-medium capitalize">{listing.address.neighborhood.replace(/-/g, " ")}</p>
                                            </div>
                                        )}
                                        {listing.lotAcres && (
                                            <div>
                                                <span className="text-stone-400">Lot Size</span>
                                                <p className="text-stone-700 font-medium">{listing.lotAcres} acres</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-stone-400">Listed</span>
                                            <p className="text-stone-700 font-medium">
                                                {new Date(listing.listedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                                    <div className="flex items-center justify-center">
                                        <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-md -mr-2">
                                            <Image
                                                src="/brand/matt-headshot.jpg"
                                                alt="Matt Caiola"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="relative h-14 w-52 flex-shrink-0">
                                            <Image
                                                src="/brand/matt-caiola-logo.png"
                                                alt="Matt Caiola Luxury Properties"
                                                fill
                                                className="object-contain object-right"
                                            />
                                        </div>
                                        <div className="h-12 w-px bg-stone-300 flex-shrink-0 mx-2"></div>
                                        <div className="relative h-12 w-44 opacity-90 flex-shrink-0">
                                            <Image
                                                src="/brand/higgins-lockup.jpg"
                                                alt="Higgins Group Private Brokerage"
                                                fill
                                                className="object-contain object-left"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-600 mt-3">
                                        Interested in {listing.address.street}? I&apos;d love to help you learn more about this property.
                                    </p>
                                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsInquiryOpen(true)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Contact Matt
                                        </button>
                                        <a
                                            href="tel:914-325-6746"
                                            className="sm:hidden flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Call Matt
                                        </a>
                                    </div>
                                </div>

                                <p className="text-xs text-stone-400 leading-relaxed">
                                    Listing data is for informational purposes only. Information deemed reliable but not guaranteed.
                                    Verify all details before making any real estate decisions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
