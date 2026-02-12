'use client';

/**
 * ListingsModule - Property listings with filters, sort, pagination, and MAP.
 * 
 * Uses the mock listings provider by default.
 * Can be swapped to real IDX provider without UI changes.
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {
    Listing,
    ListingFilters,
    ListingSort,
    ListingStatus,
    PropertyType,
    PROPERTY_TYPE_LABELS,
    STATUS_LABELS,
    DEFAULT_FILTERS,
    ListingBounds,
} from '../../lib/data/providers/listings.types';
import {
    searchListings,
    formatFullPrice,
} from '../../lib/data/providers/listings.provider';
import { ListingModal } from '../../home-search/ListingModal';
import { useSavedListings } from '../../home-search/hooks/useSavedListings';

// Dynamic import for Map (client-side only)
const HomeSearchMap = dynamic(() => import('../../home-search/HomeSearchMap'), { ssr: false });

interface ListingsModuleProps {
    townSlug: string;
    townName: string;
    neighborhoodSlug?: string;
    neighborhoodName?: string;
    center?: { lat: number; lng: number };
}

export function ListingsModule({
    townSlug,
    townName,
    neighborhoodSlug,
    neighborhoodName,
    center,
}: ListingsModuleProps) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    // Default filters now include Active + Pending
    const [filters, setFilters] = useState<ListingFilters>({
        ...DEFAULT_FILTERS,
        status: ['active', 'pending'],
    });

    const [sort, setSort] = useState<ListingSort>({ field: 'listedAt', order: 'desc' });
    const [showFilters, setShowFilters] = useState(false);

    // Map & Modal State
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    // Note: We don't filter by map bounds in the embed view, so we don't need 'bounds' state driving the search
    // But we pass 'onBoundsChange' to the map to keep it happy (no-op or optional)

    // Saved Listings Hook
    const { isSaved, toggleSave } = useSavedListings();

    // Client-side mount guard to prevent Leaflet hydration errors
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const scope = neighborhoodSlug ? 'neighborhood' : 'town';
    // For neighborhoods, show "Neighborhood, Town" format; for towns just show town name
    const locationName = neighborhoodName ? `${neighborhoodName}, ${townName}` : townName;

    // Construct "View Full Search" URL
    const fullSearchQuery = new URLSearchParams();
    fullSearchQuery.set('town', townSlug);
    if (neighborhoodSlug) fullSearchQuery.set('neighborhood', neighborhoodSlug);
    if (filters.status) fullSearchQuery.set('status', filters.status.join(','));
    const fullSearchUrl = `/home-search?${fullSearchQuery.toString()}`;

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await searchListings({
                scope,
                townSlug,
                neighborhoodSlug,
                filters,
                sort,
                page,
                pageSize: 6,
            });
            setListings(result.listings);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    }, [scope, townSlug, neighborhoodSlug, filters, sort, page]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const handleFilterChange = (newFilters: Partial<ListingFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    const handleSortChange = (newSort: ListingSort) => {
        setSort(newSort);
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilters({ ...DEFAULT_FILTERS, status: ['active', 'pending'] });
        setPage(1);
    };

    const handleSelectListing = (listing: Listing) => {
        setSelectedListing(listing);
        setSelectedPhotoIndex(0);
    };

    return (
        <div>
            {/* Section Header - Outside container */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900">
                        Homes for Sale in {locationName}
                    </h2>
                    <p className="text-stone-500 mt-2">
                        {total} {total === 1 ? 'listing' : 'listings'} available
                    </p>
                </div>
                <Link
                    href={fullSearchUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    View Full Search
                </Link>
            </div>

            {/* Map + Listings Container */}
            <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800">

                {/* Map Embed Section */}
                <div className="h-[400px] w-full relative z-0 border-b border-stone-800">
                    {isMounted ? (
                        <HomeSearchMap
                            listings={listings}
                            center={center ? [center.lat, center.lng] : [41.1307, -73.4975]}
                            onBoundsChange={() => { }} // No-op for embed view; we don't re-search on drag
                            onSelectListing={handleSelectListing}
                        />
                    ) : (
                        <div className="h-full w-full bg-stone-800 animate-pulse flex items-center justify-center">
                            <span className="text-stone-500">Loading map...</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-stone-900 p-4 border-b border-stone-800">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm border border-stone-700 hover:bg-stone-700 transition-colors"
                        >
                            {showFilters ? 'Hide Filters' : 'Filters'}
                        </button>

                        <SortDropdown value={sort} onChange={handleSortChange} />

                        <StatusTabs
                            value={filters.status || ['active', 'pending']}
                            onChange={(status) => handleFilterChange({ status })}
                        />
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <FiltersPanel
                            filters={filters}
                            onChange={handleFilterChange}
                            onReset={handleResetFilters}
                        />
                    )}
                </div>

                {/* Listings Grid */}
                <div className="p-6 bg-stone-900 min-h-[400px]">
                    {loading ? (
                        <LoadingState />
                    ) : listings.length === 0 ? (
                        <EmptyState onReset={handleResetFilters} />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                        onClick={() => handleSelectListing(listing)}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            )}
                        </>
                    )}
                </div>

                <div className="px-6 py-6 bg-stone-900 border-t border-stone-800">
                    <p className="text-xs text-stone-500">
                        * Sample listings for demonstration. Real listings coming soon via MLS integration.
                    </p>
                </div>

                {/* Listing Modal */}
                {selectedListing && (
                    <ListingModal
                        listing={selectedListing}
                        photoIndex={selectedPhotoIndex}
                        onPhotoChange={setSelectedPhotoIndex}
                        onClose={() => setSelectedListing(null)}
                        isFavorite={isSaved(selectedListing.id)}
                        onToggleFavorite={() => toggleSave(selectedListing.id)}
                    />
                )}
            </div>
        </div>
    );
}

// --- Subcomponents ---

/**
 * Status tabs (Active / Pending / Sold)
 */
function StatusTabs({
    value,
    onChange,
}: {
    value: ListingStatus[];
    onChange: (status: ListingStatus[]) => void;
}) {
    const statuses: ListingStatus[] = ['active', 'pending', 'sold'];

    const toggleStatus = (status: ListingStatus) => {
        if (value.includes(status)) {
            // Prevent empty selection
            const next = value.filter((s) => s !== status);
            if (next.length > 0) onChange(next);
        } else {
            onChange([...value, status]);
        }
    };

    return (
        <div className="flex rounded-lg overflow-hidden border border-stone-700">
            {statuses.map((status) => (
                <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1.5 text-sm transition-colors ${value.includes(status)
                        ? 'bg-white text-stone-900'
                        : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700'
                        }`}
                >
                    {STATUS_LABELS[status]}
                </button>
            ))}
        </div>
    );
}

/**
 * Sort dropdown
 */
function SortDropdown({
    value,
    onChange,
}: {
    value: ListingSort;
    onChange: (sort: ListingSort) => void;
}) {
    const options = [
        { label: 'Newest', field: 'listedAt' as const, order: 'desc' as const },
        { label: 'Price: Low to High', field: 'price' as const, order: 'asc' as const },
        { label: 'Price: High to Low', field: 'price' as const, order: 'desc' as const },
        { label: 'Beds', field: 'beds' as const, order: 'desc' as const },
        { label: 'Sq Ft', field: 'sqft' as const, order: 'desc' as const },
    ];

    return (
        <select
            value={`${value.field}-${value.order}`}
            onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [typeof value.field, typeof value.order];
                onChange({ field, order });
            }}
            className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm border border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
            {options.map((opt) => (
                <option key={`${opt.field}-${opt.order}`} value={`${opt.field}-${opt.order}`}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

/**
 * Filters panel
 */
function FiltersPanel({
    filters,
    onChange,
    onReset,
}: {
    filters: ListingFilters;
    onChange: (filters: Partial<ListingFilters>) => void;
    onReset: () => void;
}) {
    return (
        <div className="mt-4 p-4 bg-stone-800 rounded-lg border border-stone-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Price Range */}
                <div>
                    <label className="block text-xs text-stone-400 mb-1">Min Price</label>
                    <select
                        value={filters.priceMin || 0}
                        onChange={(e) => onChange({ priceMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-stone-700 text-white rounded text-sm border border-stone-600 focus:outline-none focus:border-stone-500"
                    >
                        <option value={0}>No min</option>
                        <option value={500000}>$500K</option>
                        <option value={1000000}>$1M</option>
                        <option value={2000000}>$2M</option>
                        <option value={3000000}>$3M</option>
                        <option value={5000000}>$5M</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-stone-400 mb-1">Max Price</label>
                    <select
                        value={filters.priceMax || 10000000}
                        onChange={(e) => onChange({ priceMax: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-stone-700 text-white rounded text-sm border border-stone-600 focus:outline-none focus:border-stone-500"
                    >
                        <option value={10000000}>No max</option>
                        <option value={1000000}>$1M</option>
                        <option value={2000000}>$2M</option>
                        <option value={3000000}>$3M</option>
                        <option value={5000000}>$5M</option>
                        <option value={10000000}>$10M+</option>
                    </select>
                </div>

                {/* Beds / Baths */}
                <div>
                    <label className="block text-xs text-stone-400 mb-1">Min Beds</label>
                    <select
                        value={filters.bedsMin || 0}
                        onChange={(e) => onChange({ bedsMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-stone-700 text-white rounded text-sm border border-stone-600 focus:outline-none focus:border-stone-500"
                    >
                        <option value={0}>Any</option>
                        <option value={2}>2+</option>
                        <option value={3}>3+</option>
                        <option value={4}>4+</option>
                        <option value={5}>5+</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-stone-400 mb-1">Min Baths</label>
                    <select
                        value={filters.bathsMin || 0}
                        onChange={(e) => onChange({ bathsMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-stone-700 text-white rounded text-sm border border-stone-600 focus:outline-none focus:border-stone-500"
                    >
                        <option value={0}>Any</option>
                        <option value={2}>2+</option>
                        <option value={3}>3+</option>
                        <option value={4}>4+</option>
                    </select>
                </div>
            </div>

            {/* Property Types */}
            <div className="mt-4">
                <label className="block text-xs text-stone-400 mb-2">Property Type</label>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                const current = filters.propertyTypes || [];
                                const updated = current.includes(type)
                                    ? current.filter((t) => t !== type)
                                    : [...current, type];
                                onChange({ propertyTypes: updated });
                            }}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${(filters.propertyTypes || []).includes(type)
                                ? 'bg-white text-stone-900'
                                : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                }`}
                        >
                            {PROPERTY_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reset */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={onReset}
                    className="text-sm text-stone-400 hover:text-white"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}

/**
 * Listing card
 */
/**
 * Listing card
 */
function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
    const statusColors = {
        active: 'bg-white/95 text-stone-900 border border-white backdrop-blur-sm',
        pending: 'bg-amber-100/95 text-amber-800 border border-amber-200 backdrop-blur-sm',
        sold: 'bg-stone-200/95 text-stone-600 border border-stone-300 backdrop-blur-sm',
    };

    return (
        <div
            onClick={onClick}
            className="group bg-stone-900 rounded-xl overflow-hidden border border-stone-800 hover:border-stone-600 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-stone-900/50 hover:-translate-y-1"
        >
            {/* Image */}
            <div className="relative h-64 bg-stone-800 overflow-hidden">
                {listing.photos?.[0] ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${listing.photos[0]})` }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-700 bg-stone-800">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm ${statusColors[listing.status]}`}>
                    {STATUS_LABELS[listing.status]}
                </span>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-2xl font-serif text-white mb-1 shadow-sm">
                        {formatFullPrice(listing.price)}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 border-t border-stone-800/50 bg-stone-900">
                <div className="mb-4">
                    <div className="text-sm font-medium text-white mb-1 truncate">
                        {listing.address.street}
                    </div>
                    <div className="text-xs text-stone-400 font-light">
                        {listing.address.city}, {listing.address.state}
                    </div>
                </div>

                <div className="flex items-center justify-between text-stone-400 pt-4 border-t border-stone-800">
                    <div className="flex items-center gap-1.5" title="Bedrooms">
                        <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm">{listing.beds}</span>
                    </div>
                    <div className="w-px h-3 bg-stone-800"></div>
                    <div className="flex items-center gap-1.5" title="Bathrooms">
                        <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{listing.baths}</span>
                    </div>
                    <div className="w-px h-3 bg-stone-800"></div>
                    <div className="flex items-center gap-1.5" title="Square Footage">
                        <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span className="text-sm">{listing.sqft.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Pagination
 */
function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors text-sm"
            >
                ← Prev
            </button>
            <span className="text-stone-400 text-sm px-4">
                Page {page} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors text-sm"
            >
                Next →
            </button>
        </div>
    );
}

/**
 * Loading state
 */
function LoadingState() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-stone-800 rounded-xl overflow-hidden animate-pulse border border-stone-700">
                    <div className="h-56 bg-stone-700" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-stone-700 rounded w-1/2" />
                        <div className="h-4 bg-stone-700 rounded w-3/4" />
                        <div className="h-10 bg-stone-700 rounded mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Empty state
 */
function EmptyState({ onReset }: { onReset: () => void }) {
    return (
        <div className="text-center py-20">
            <div className="text-stone-600 mb-6">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <p className="text-lg text-white font-medium mb-2">No listings found in this area</p>
            <p className="text-stone-400 mb-6 max-w-sm mx-auto">
                We couldn't find any listings matching your current filters. Try changing your search or checking a different status.
            </p>
            <button
                onClick={onReset}
                className="px-6 py-2.5 bg-white text-stone-900 rounded-full hover:bg-stone-100 transition-colors text-sm font-medium"
            >
                Reset Filters
            </button>
        </div>
    );
}

export default ListingsModule;
