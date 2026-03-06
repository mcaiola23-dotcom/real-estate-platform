"use client";

import Link from "next/link";
import type { TenantWebsiteConfig } from "@real-estate/types";

import type { Listing, ListingSort } from "../../lib/data/providers/listings.types";
import { EmptyState, ListingCard, LoadingState, Pagination } from "./SearchResults";

interface ResultsSidebarProps {
  displayTotal: number;
  sort: ListingSort;
  loading: boolean;
  displayedListings: Listing[];
  showSaved: boolean;
  totalPages: number;
  page: number;
  onPageChange: (nextPage: number) => void;
  onSelectListing: (listing: Listing) => void;
  onPreloadListingModal: () => void;
  isSaved: (listingId: string) => boolean;
  onToggleSave: (listing: Listing) => void;
  setShowSaved: (showSaved: boolean) => void;
  websiteConfig: TenantWebsiteConfig;
}

export function ResultsSidebar({
  displayTotal,
  sort,
  loading,
  displayedListings,
  showSaved,
  totalPages,
  page,
  onPageChange,
  onSelectListing,
  onPreloadListingModal,
  isSaved,
  onToggleSave,
  setShowSaved,
  websiteConfig,
}: ResultsSidebarProps) {
  return (
    <aside className="w-full lg:w-[520px] border-l border-stone-200 bg-white lg:h-full lg:overflow-y-auto">
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-500">Results</p>
            <p className="text-lg font-semibold text-stone-900">
              {displayTotal} {displayTotal === 1 ? "listing" : "listings"}
            </p>
          </div>
          <span className="text-xs text-stone-400">Sorted by {sort.field}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <LoadingState />
        ) : displayedListings.length === 0 ? (
          showSaved ? (
            <div className="text-center py-20">
              <p className="text-stone-500">You have not saved any homes yet.</p>
              <button
                onClick={() => setShowSaved(false)}
                className="mt-4 text-rose-600 hover:underline"
              >
                Browse listings
              </button>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={onSelectListing}
                  onPreloadModal={onPreloadListingModal}
                  isSaved={isSaved(listing.id)}
                  onToggleSave={(event) => {
                    event.stopPropagation();
                    onToggleSave(listing);
                  }}
                />
              ))}
            </div>
            {!showSaved && totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            )}

            <div className="mt-12 py-12 px-6 bg-stone-900 text-white rounded-2xl text-center">
              <h3 className="font-serif text-2xl font-medium mb-4">
                {websiteConfig.content.footerCta.heading}
              </h3>
              <p className="text-stone-300 mb-8 leading-relaxed">
                {websiteConfig.content.footerCta.body}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/home-value"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors"
                >
                  {websiteConfig.content.footerCta.primaryLabel}
                </Link>
                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  {websiteConfig.content.footerCta.secondaryLabel}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
