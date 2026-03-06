"use client";

import Image from "next/image";

import {
  Listing,
  ListingStatus,
  STATUS_LABELS,
} from "../../lib/data/providers/listings.types";
import { formatFullPrice } from "../../lib/data/providers/listings.provider";

interface ListingCardProps {
  listing: Listing;
  onSelect?: (listing: Listing) => void;
  onPreloadModal?: () => void;
  isSaved?: boolean;
  onToggleSave?: (event: React.MouseEvent) => void;
}

export function ListingCard({
  listing,
  onSelect,
  onPreloadModal,
  isSaved,
  onToggleSave,
}: ListingCardProps) {
  const statusStyles: Record<ListingStatus, string> = {
    active: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    sold: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => onSelect?.(listing)}
        onMouseEnter={onPreloadModal}
        onFocus={onPreloadModal}
        className="block w-full text-left rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="relative h-36">
          <Image src={listing.photos[0]} alt={listing.address.street} fill className="object-cover" />
          <span className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${statusStyles[listing.status]}`}>
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
        <div className="p-4">
          <div className="text-lg font-semibold text-stone-900">{formatFullPrice(listing.price)}</div>
          <div className="text-sm text-stone-600">{listing.address.street}</div>
          <div className="text-xs text-stone-500">
            {listing.address.city}, {listing.address.state}
          </div>
          <div className="mt-3 flex gap-3 text-xs text-stone-500">
            <span>{listing.beds} bd</span>
            <span>{listing.baths} ba</span>
            <span>{listing.sqft.toLocaleString()} sqft</span>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onToggleSave}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isSaved ? "currentColor" : "none"}
          stroke="currentColor"
          className={`w-5 h-5 ${isSaved ? "text-rose-500" : "text-stone-400 hover:text-rose-500"}`}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="rounded-2xl border border-stone-200 bg-white p-4 animate-pulse">
          <div className="h-32 bg-stone-100 rounded-xl" />
          <div className="mt-4 h-4 bg-stone-100 rounded w-2/3" />
          <div className="mt-2 h-3 bg-stone-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">
      No listings match your current filters. Adjust your selections and search again.
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between text-xs text-stone-500">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-full border border-stone-200 disabled:opacity-50"
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-full border border-stone-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
