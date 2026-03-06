"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import type { TenantWebsiteConfig } from "@real-estate/types";
import townData from "../data/acs/fairfield-county-towns.json";
import {
  Listing,
  ListingBounds,
  ListingFilters,
  ListingNeighborhoodOption,
  ListingSort,
} from "../lib/data/providers/listings.types";
import {
  formatListingPrice,
  getListingById,
  getListingsByIds,
  listNeighborhoods,
} from "../lib/data/providers/listings.provider";
import { useSavedListings } from "./hooks/useSavedListings";
import { useSavedSearches } from "./hooks/useSavedSearches";
import { HomeSearchTrigger, useHomeSearchResults } from "./hooks/useHomeSearchResults";
import {
  buildSavedSearchParams,
  buildSearchUrlParams,
  parseFiltersFromParams,
  parseSavedSearchParams,
  parseSortFromParams,
} from "./lib/search-url-state";
import { SavedSearchesModal, SaveSearchDialog } from "./SavedSearchesModal";
import type { TenantScope } from "../lib/data/providers/tenant-context";
import { trackWebsiteEvent } from "../lib/analytics/website-events";
import { getTenantWebsiteConfig } from "../lib/tenant/website-profile";
import { ResultsSidebar } from "./components/ResultsSidebar";
import { SearchToolbar } from "./components/SearchToolbar";

const HomeSearchMap = dynamic(() => import("./HomeSearchMap"), { ssr: false });
const loadListingModal = () =>
  import("./ListingModal").then((module) => module.ListingModal);
const ListingModal = dynamic(loadListingModal, { ssr: false });

const defaultCenter: [number, number] = [41.1307, -73.4975];

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function HomeSearchClient({
  tenantContext,
  tenantWebsiteConfig,
}: {
  tenantContext?: TenantScope;
  tenantWebsiteConfig?: TenantWebsiteConfig;
}) {
  const websiteConfig = tenantWebsiteConfig ?? getTenantWebsiteConfig(tenantContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const listingIdFromUrl = searchParams.get("listing_id");

  // Initialize state from URL params
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") || "1", 10));

  const [filters, setFilters] = useState<ListingFilters>(() => parseFiltersFromParams(searchParams));
  const [sort, setSort] = useState<ListingSort>(() => parseSortFromParams(searchParams));

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [townSlugs, setTownSlugs] = useState<string[]>(() => searchParams.get("towns") ? searchParams.get("towns")!.split(",") : []);
  const [neighborhoodSlugs, setNeighborhoodSlugs] = useState<string[]>(() => searchParams.get("neighborhoods") ? searchParams.get("neighborhoods")!.split(",") : []);
  const [bounds, setBounds] = useState<ListingBounds | undefined>(undefined);
  const [pendingBounds, setPendingBounds] = useState<ListingBounds | null>(null);
  const [hasSearched, setHasSearched] = useState(true);

  // Saved listings
  const { savedIds, toggleSave, isSaved } = useSavedListings();
  const [showSaved, setShowSaved] = useState(false);

  // Saved searches
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches();
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const triggerSearchFromLoadRef = useRef(false);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [allNeighborhoods, setAllNeighborhoods] = useState<ListingNeighborhoodOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedListings() {
      if (savedIds.length === 0) {
        setSavedListings([]);
        return;
      }

      try {
        const results = await getListingsByIds(savedIds);
        if (!cancelled) {
          setSavedListings(results);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load saved listings:", error);
          setSavedListings([]);
        }
      }
    }

    void loadSavedListings();
    return () => {
      cancelled = true;
    };
  }, [savedIds]);

  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const hasInitializedSearch = useRef(false);
  const pendingBoundsRef = useRef<ListingBounds | null>(null);
  const firstModalOpenStartRef = useRef<number | null>(null);
  const firstModalOpenListingIdRef = useRef<string | null>(null);
  const firstModalTimingLoggedRef = useRef(false);

  const logPerfMetric = useCallback(
    (name: string, durationMs: number, extra?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "production") {
        return;
      }
      // Dev-only timing traces to baseline map/search/modal latency.
      console.info(`[home-search perf] ${name}: ${Math.round(durationMs)}ms`, extra ?? {});
    },
    []
  );

  // Sync state to URL
  useEffect(() => {
    if (!hasInitializedSearch.current) return;

    const params = buildSearchUrlParams({
      searchQuery,
      page,
      townSlugs,
      neighborhoodSlugs,
      filters,
      sort,
      selectedListingId: selectedListing?.id ?? null,
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, neighborhoodSlugs, page, pathname, router, searchQuery, selectedListing, sort, townSlugs]);

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => {
      void loadListingModal();
    }, 1200);

    return () => {
      window.clearTimeout(preloadTimer);
    };
  }, []);

  useEffect(() => {
    if (!listingIdFromUrl) {
      return;
    }
    const resolvedListingId = listingIdFromUrl;

    let cancelled = false;

    async function loadListingFromUrl() {
      try {
        const listing = await getListingById(resolvedListingId);
        if (!cancelled) {
          setSelectedListing(listing);
          setSelectedPhotoIndex(0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load listing from URL:", error);
        }
      }
    }

    void loadListingFromUrl();
    return () => {
      cancelled = true;
    };
  }, [listingIdFromUrl]);

  const towns = useMemo(
    () =>
      Object.entries(townData.towns).map(([slug, town]) => ({
        slug,
        name: town.name,
      })),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadNeighborhoods() {
      try {
        const options = await listNeighborhoods();
        if (!cancelled) {
          setAllNeighborhoods(options);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load neighborhood options:", error);
          setAllNeighborhoods([]);
        }
      }
    }

    void loadNeighborhoods();
    return () => {
      cancelled = true;
    };
  }, []);

  const neighborhoodsByTown = useMemo(() => {
    const map: Record<string, { slug: string; name: string }[]> = {};
    for (const neighborhood of allNeighborhoods) {
      if (!map[neighborhood.townSlug]) {
        map[neighborhood.townSlug] = [];
      }
      map[neighborhood.townSlug].push({
        slug: neighborhood.slug,
        name: neighborhood.name,
      });
    }
    Object.values(map).forEach((items) => {
      items.sort((a, b) => a.name.localeCompare(b.name));
    });
    return map;
  }, [allNeighborhoods]);

  const neighborhoodOptions = useMemo(() => {
    if (townSlugs.length === 0) return [];
    const allOptions = townSlugs.flatMap((slug) => neighborhoodsByTown[slug] || []);
    const unique = new Map<string, { slug: string; name: string }>();
    allOptions.forEach((option) => unique.set(option.slug, option));
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [townSlugs, neighborhoodsByTown]);

  const handleSearchResolved = useCallback(
    ({
      result,
      nextPage,
      nextBounds,
      trigger,
      durationMs,
    }: {
      result: { total: number };
      nextPage: number;
      nextBounds?: ListingBounds;
      trigger: HomeSearchTrigger;
      durationMs: number;
    }) => {
      void trackWebsiteEvent({
        eventType: "website.search.performed",
        payload: {
          source: "home_search",
          searchContext: {
            query: searchQuery.trim() ? searchQuery.trim() : null,
            filtersJson: JSON.stringify({
              ...filters,
              townSlugs,
              neighborhoodSlugs,
              bounds: nextBounds || null,
              trigger,
            }),
            sortField: sort.field,
            sortOrder: sort.order,
            page: nextPage,
          },
          resultCount: result.total,
          actor: null,
        },
      });

      logPerfMetric("search", durationMs, {
        trigger,
        page: nextPage,
        resultTotal: result.total,
      });
    },
    [filters, logPerfMetric, neighborhoodSlugs, searchQuery, sort.field, sort.order, townSlugs]
  );

  const { listings, total, totalPages, loading, executeSearch } = useHomeSearchResults({
    tenantContext,
    townSlugs,
    neighborhoodSlugs,
    searchQuery,
    filters,
    sort,
    onSearchResolved: handleSearchResolved,
    onSearchError: (error) => {
      console.error("Failed to fetch listings:", error);
    },
  });

  const displayedListings = showSaved ? savedListings : listings;
  const displayTotal = showSaved ? savedListings.length : total;
  const mapListings = hasSearched || showSaved ? displayedListings : [];
  const deferredMapListings = useDeferredValue(mapListings);

  useEffect(() => {
    if (!triggerSearchFromLoadRef.current) {
      return;
    }
    triggerSearchFromLoadRef.current = false;
    void executeSearch(1, undefined, "load_saved_search");
  }, [executeSearch]);

  useEffect(() => {
    if (hasInitializedSearch.current) return;
    hasInitializedSearch.current = true;
    void executeSearch(1, undefined, "initial_load");
  }, [executeSearch]);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    executeSearch(1, bounds, "manual");
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    executeSearch(nextPage, bounds, "pagination");
  };

  const handleSearchArea = () => {
    if (!pendingBounds) return;
    setBounds(pendingBounds);
    setPendingBounds(null);
    pendingBoundsRef.current = null;
    setHasSearched(true);
    setPage(1);
    executeSearch(1, pendingBounds, "map_bounds");
  };

  const openListing = useCallback((listing: Listing, source: string = "home_search") => {
    if (!firstModalTimingLoggedRef.current && firstModalOpenStartRef.current === null) {
      firstModalOpenStartRef.current =
        typeof window === "undefined" ? Date.now() : window.performance.now();
      firstModalOpenListingIdRef.current = listing.id;
      void loadListingModal();
    }

    setSelectedListing(listing);
    setSelectedPhotoIndex(0);

    void trackWebsiteEvent({
      eventType: "website.listing.viewed",
      payload: {
        source,
        listing: {
          id: listing.id,
          address: listing.address.street || null,
          city: listing.address.city || null,
          state: listing.address.state || null,
          zip: listing.address.zip || null,
          price: listing.price ?? null,
          beds: listing.beds ?? null,
          baths: listing.baths ?? null,
          sqft: listing.sqft ?? null,
          propertyType: listing.propertyType || null,
        },
        searchContext: {
          query: searchQuery.trim() ? searchQuery.trim() : null,
          filtersJson: JSON.stringify({
            ...filters,
            townSlugs,
            neighborhoodSlugs,
          }),
          sortField: sort.field,
          sortOrder: sort.order,
          page,
        },
        actor: null,
      },
    });
  }, [filters, neighborhoodSlugs, page, searchQuery, sort.field, sort.order, townSlugs]);

  const handleFirstModalMount = useCallback(() => {
    if (firstModalTimingLoggedRef.current || firstModalOpenStartRef.current === null) {
      return;
    }
    const completedAt = typeof window === "undefined" ? Date.now() : window.performance.now();
    logPerfMetric("modal_first_open", completedAt - firstModalOpenStartRef.current, {
      listingId: firstModalOpenListingIdRef.current,
    });
    firstModalTimingLoggedRef.current = true;
    firstModalOpenStartRef.current = null;
    firstModalOpenListingIdRef.current = null;
  }, [logPerfMetric]);

  const preloadListingModal = useCallback(() => {
    void loadListingModal();
  }, []);

  const handleAutocompleteSelect = useCallback(
    (listing: Listing) => {
      openListing(listing, "home_search_autocomplete");
      if (listing.lat && listing.lng) {
        setBounds({
          north: listing.lat + 0.01,
          south: listing.lat - 0.01,
          east: listing.lng + 0.01,
          west: listing.lng - 0.01,
        });
      }
    },
    [openListing]
  );

  const handleMapSelectListing = useCallback(
    (listing: Listing) => {
      openListing(listing, "home_search_map");
    },
    [openListing]
  );

  const handleListSelectListing = useCallback(
    (listing: Listing) => {
      openListing(listing, "home_search_list");
    },
    [openListing]
  );

  const handleCloseListingModal = useCallback(() => {
    setSelectedListing(null);
  }, []);

  const handleBoundsChange = useCallback((nextBounds: ListingBounds) => {
    const previousBounds = pendingBoundsRef.current;
    if (previousBounds) {
      const isSameBounds =
        Math.abs(previousBounds.north - nextBounds.north) < 0.0001 &&
        Math.abs(previousBounds.south - nextBounds.south) < 0.0001 &&
        Math.abs(previousBounds.east - nextBounds.east) < 0.0001 &&
        Math.abs(previousBounds.west - nextBounds.west) < 0.0001;

      if (isSameBounds) {
        return;
      }
    }

    pendingBoundsRef.current = nextBounds;
    setPendingBounds(nextBounds);
  }, []);

  const handleLoadSearch = (paramsString: string) => {
    const parsed = parseSavedSearchParams(paramsString);
    setSearchQuery(parsed.searchQuery);
    setPage(parsed.page);
    setTownSlugs(parsed.townSlugs);
    setNeighborhoodSlugs(parsed.neighborhoodSlugs);
    setFilters(parsed.filters);
    setSort(parsed.sort);
    setSelectedListing(null);

    // Trigger search
    setHasSearched(true);
    triggerSearchFromLoadRef.current = true;
  };


  const generateFiltersSummary = () => {
    const parts = [];
    if (townSlugs.length > 0) {
      const townNames = townSlugs.map(slug => towns.find(t => t.slug === slug)?.name || slug).join(", ");
      parts.push(townNames);
    }
    if (neighborhoodSlugs.length > 0) {
      parts.push(neighborhoodSlugs.map(slug => titleCase(slug)).join(", "));
    }
    if (filters.priceMin && filters.priceMin > 0 || filters.priceMax && filters.priceMax < 10000000) {
      const min = filters.priceMin && filters.priceMin > 0 ? formatListingPrice(filters.priceMin) : "$0";
      const max = filters.priceMax && filters.priceMax < 10000000 ? formatListingPrice(filters.priceMax) : "Any";
      parts.push(`${min}-${max}`);
    }
    return parts.join(" • ") || "All Listings";
  };

  const handleSaveSearchSubmit = (name: string) => {
    const params = buildSavedSearchParams({
      searchQuery,
      townSlugs,
      neighborhoodSlugs,
      filters,
      sort,
    });

    saveSearch(name, params.toString(), generateFiltersSummary());
    setShowSaveDialog(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:h-screen lg:overflow-hidden">
      <SearchToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tenantContext={tenantContext}
        onAutocompleteSelect={handleAutocompleteSelect}
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        onSearch={handleSearch}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        townSlugs={townSlugs}
        setTownSlugs={setTownSlugs}
        neighborhoodsByTown={neighborhoodsByTown}
        neighborhoodSlugs={neighborhoodSlugs}
        setNeighborhoodSlugs={setNeighborhoodSlugs}
        neighborhoodOptions={neighborhoodOptions}
        towns={towns}
        showSaved={showSaved}
        setShowSaved={setShowSaved}
        setShowSaveDialog={setShowSaveDialog}
        setShowSavedSearches={setShowSavedSearches}
      />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-320px)] lg:h-[calc(100vh-200px)] lg:overflow-hidden">
        <div className={`relative flex-1 min-h-[420px] lg:min-h-0 bg-stone-200 z-0 ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
          <HomeSearchMap
            listings={deferredMapListings}
            center={defaultCenter}
            onBoundsChange={handleBoundsChange}
            onSelectListing={handleMapSelectListing}
          />
          {pendingBounds && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <button
                type="button"
                onClick={handleSearchArea}
                className="px-4 py-2 rounded-full bg-white text-stone-800 text-sm shadow-md border border-stone-200 hover:border-stone-300"
              >
                Search this area
              </button>
            </div>
          )}
        </div>

        <div className={`${viewMode === "map" ? "hidden lg:block" : "block"}`}>
          <ResultsSidebar
            displayTotal={displayTotal}
            sort={sort}
            loading={loading}
            displayedListings={displayedListings}
            showSaved={showSaved}
            totalPages={totalPages}
            page={page}
            onPageChange={handlePageChange}
            onSelectListing={handleListSelectListing}
            onPreloadListingModal={preloadListingModal}
            isSaved={isSaved}
            onToggleSave={toggleSave}
            setShowSaved={setShowSaved}
            websiteConfig={websiteConfig}
          />
        </div>
        {/* Floating Mobile Toggle Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
          <button
            onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
            className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm transition-transform active:scale-95"
          >
            {viewMode === 'list' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Show Map
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Show List
              </>
            )}
          </button>
        </div>
      </div>

      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          photoIndex={selectedPhotoIndex}
          onPhotoChange={setSelectedPhotoIndex}
          onClose={handleCloseListingModal}
          onMount={handleFirstModalMount}
          isFavorite={isSaved(selectedListing.id)}
          onToggleFavorite={() => toggleSave(selectedListing)}
        />
      )}

      <SavedSearchesModal
        isOpen={showSavedSearches}
        onClose={() => setShowSavedSearches(false)}
        savedSearches={savedSearches}
        onLoad={handleLoadSearch}
        onDelete={deleteSearch}
      />

      <SaveSearchDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveSearchSubmit}
      />

    </div>
  );
}

