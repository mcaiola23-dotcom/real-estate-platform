"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import townData from "../data/acs/fairfield-county-towns.json";
import mockListings from "../data/listings/mock-listings.json";
import {
  DEFAULT_FILTERS,
  Listing,
  ListingBounds,
  ListingFilters,
  ListingSort,
  ListingStatus,
  PropertyType,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
} from "../lib/data/providers/listings.types";
import {
  formatFullPrice,
  formatListingPrice,
  searchListings,
  suggestListings,
} from "../lib/data/providers/listings.provider";
import ListingInquiryModal from "./ListingInquiryModal";
import { ListingModal } from "./ListingModal";
import { useSavedListings } from "./hooks/useSavedListings";
import { useSavedSearches } from "./hooks/useSavedSearches";
import { SavedSearchesModal, SaveSearchDialog } from "./SavedSearchesModal";

const HomeSearchMap = dynamic(() => import("./HomeSearchMap"), { ssr: false });

const defaultCenter: [number, number] = [41.1307, -73.4975];

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function AddressSearchBar({
  onSelect,
  initialValue = "",
  onChange,
}: {
  onSelect: (listing: Listing) => void;
  initialValue?: string;
  onChange?: (value: string) => void;
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const results = await suggestListings({ q: query, limit: 6 });
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (listing: Listing) => {
    setQuery(listing.address.street);
    if (onChange) onChange(listing.address.street);
    setShowSuggestions(false);
    onSelect(listing);
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    sold: "bg-rose-100 text-rose-800",
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (onChange) onChange(val);
            setShowSuggestions(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address, city, zip..."
          className="w-full rounded-full border border-stone-300 bg-white pl-9 pr-4 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-shadow"
        />
      </div>

      {showSuggestions && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden max-h-[60vh] overflow-y-auto">
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((listing, index) => (
                <li key={listing.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(listing)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 text-sm transition-colors ${index === highlightedIndex
                      ? "bg-stone-50 text-stone-900"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{listing.address.street}</span>
                      <span className="text-xs text-stone-400 truncate">
                        {listing.address.city}, {listing.address.state} {listing.address.zip}
                      </span>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 gap-1">
                      <span className="font-semibold text-stone-900">
                        {formatFullPrice(listing.price)}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${statusColors[listing.status]}`}>
                        {listing.status}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-stone-500 text-center">
              No listings found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeSearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL params
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") || "1", 10));
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<ListingFilters>(() => ({
    ...DEFAULT_FILTERS,
    status: searchParams.get("status") ? (searchParams.get("status")!.split(",") as ListingStatus[]) : ["active"],
    propertyTypes: searchParams.get("types") ? (searchParams.get("types")!.split(",") as PropertyType[]) : undefined,
    priceMin: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : 0,
    priceMax: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : 10000000,
    bedsMin: searchParams.get("beds") ? Number(searchParams.get("beds")) : 0,
    bathsMin: searchParams.get("baths") ? Number(searchParams.get("baths")) : 0,
    sqftMin: searchParams.get("min_sqft") ? Number(searchParams.get("min_sqft")) : 0,
    sqftMax: searchParams.get("max_sqft") ? Number(searchParams.get("max_sqft")) : 10000,
  }));

  const [sort, setSort] = useState<ListingSort>(() => {
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      const [field, order] = sortParam.split("-");
      return { field: field as any, order: order as "asc" | "desc" };
    }
    return { field: "listedAt", order: "desc" };
  });

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [townSlugs, setTownSlugs] = useState<string[]>(() => searchParams.get("towns") ? searchParams.get("towns")!.split(",") : []);
  const [neighborhoodSlugs, setNeighborhoodSlugs] = useState<string[]>(() => searchParams.get("neighborhoods") ? searchParams.get("neighborhoods")!.split(",") : []);
  const [bounds, setBounds] = useState<ListingBounds | undefined>(undefined);
  const [pendingBounds, setPendingBounds] = useState<ListingBounds | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Saved listings
  const { savedIds, toggleSave, isSaved } = useSavedListings();
  const [showSaved, setShowSaved] = useState(false);

  // Saved searches
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches();
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [triggerSearchFromLoad, setTriggerSearchFromLoad] = useState(false);

  // Compute displayed listings (search results vs saved)
  const savedListings = useMemo(() => {
    const allListings = mockListings.listings as unknown as Listing[];
    return savedIds
      .map((id) => allListings.find((l) => l.id === id))
      .filter((l): l is Listing => l !== undefined);
  }, [savedIds]);

  const displayedListings = showSaved ? savedListings : listings;
  const displayTotal = showSaved ? savedListings.length : total;
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedListing, setSelectedListing] = useState<Listing | null>(() => {
    const id = searchParams.get("listing_id");
    if (id) {
      // Note: In a real app this might need an async fetch if not in initial dataset
      // Since we have mockListings, we can look it up sync
      return mockListings.listings.find((l) => l.id === id) as Listing || null;
    }
    return null;
  });

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const hasInitializedSearch = useRef(false);

  // Sync state to URL
  useEffect(() => {
    if (!hasInitializedSearch.current) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (page > 1) params.set("page", page.toString());

    // Geo
    if (townSlugs.length > 0) params.set("towns", townSlugs.join(","));
    if (neighborhoodSlugs.length > 0) params.set("neighborhoods", neighborhoodSlugs.join(","));

    // Filters
    if (filters.status && filters.status.join(",") !== "active") params.set("status", filters.status.join(","));
    if (filters.propertyTypes && filters.propertyTypes.length > 0) params.set("types", filters.propertyTypes.join(","));
    if (filters.priceMin && filters.priceMin > 0) params.set("min_price", filters.priceMin.toString());
    if (filters.priceMax && filters.priceMax < 10000000) params.set("max_price", filters.priceMax.toString());
    if (filters.bedsMin && filters.bedsMin > 0) params.set("beds", filters.bedsMin.toString());
    if (filters.bathsMin && filters.bathsMin > 0) params.set("baths", filters.bathsMin.toString());
    if (filters.sqftMin && filters.sqftMin > 0) params.set("min_sqft", filters.sqftMin.toString());
    if (filters.sqftMax && filters.sqftMax < 10000) params.set("max_sqft", filters.sqftMax.toString());

    // Sort
    if (sort.field !== "listedAt" || sort.order !== "desc") {
      params.set("sort", `${sort.field}-${sort.order}`);
    }

    // Listing
    if (selectedListing) {
      params.set("listing_id", selectedListing.id);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, page, searchQuery, sort, selectedListing, townSlugs, neighborhoodSlugs, router, pathname]);

  const towns = useMemo(
    () =>
      Object.entries(townData.towns).map(([slug, town]) => ({
        slug,
        name: town.name,
      })),
    []
  );

  const townSlugByCity = useMemo(() => {
    return Object.entries(townData.towns).reduce<Record<string, string>>(
      (acc, [slug, town]) => {
        acc[town.name.toLowerCase()] = slug;
        return acc;
      },
      {}
    );
  }, []);

  const neighborhoodsByTown = useMemo(() => {
    const map: Record<string, { slug: string; name: string }[]> = {};
    for (const listing of mockListings.listings) {
      if (!listing.address.neighborhood) continue;
      const slug = townSlugByCity[listing.address.city.toLowerCase()];
      if (!slug) continue;
      if (!map[slug]) {
        map[slug] = [];
      }
      if (!map[slug].some((item) => item.slug === listing.address.neighborhood)) {
        map[slug].push({
          slug: listing.address.neighborhood,
          name: titleCase(listing.address.neighborhood),
        });
      }
    }
    Object.values(map).forEach((items) =>
      items.sort((a, b) => a.name.localeCompare(b.name))
    );
    return map;
  }, [townSlugByCity]);

  // const activeTown = townSlugs[0] || "";
  // const neighborhoodOptions = activeTown ? neighborhoodsByTown[activeTown] || [] : [];

  const neighborhoodOptions = useMemo(() => {
    if (townSlugs.length === 0) return [];
    // Aggregate all neighborhoods from selected towns
    const allOptions = townSlugs.flatMap(slug => neighborhoodsByTown[slug] || []);
    // Dedupe by slug just in case (though towns are distinct)
    const unique = new Map();
    allOptions.forEach(opt => unique.set(opt.slug, opt));
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [townSlugs, neighborhoodsByTown]);

  const executeSearch = useCallback(
    async (nextPage: number, nextBounds?: ListingBounds) => {
      setLoading(true);
      try {
        const result = await searchListings({
          scope: "global",
          townSlugs: townSlugs.length ? townSlugs : undefined,
          neighborhoodSlugs: neighborhoodSlugs.length ? neighborhoodSlugs : undefined,
          bounds: nextBounds,
          q: searchQuery.trim() ? searchQuery.trim() : undefined,
          filters,
          sort,
          page: nextPage,
          pageSize: 12,
        });
        setListings(result.listings);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters, neighborhoodSlugs, searchQuery, sort, townSlugs]
  );

  useEffect(() => {
    if (triggerSearchFromLoad) {
      executeSearch(1);
      setTriggerSearchFromLoad(false);
    }
  }, [triggerSearchFromLoad, executeSearch]);

  useEffect(() => {
    if (hasInitializedSearch.current) return;
    hasInitializedSearch.current = true;
    setHasSearched(true);
    executeSearch(1);
  }, [executeSearch]);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    executeSearch(1, bounds);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    executeSearch(nextPage, bounds);
  };

  const handleSearchArea = () => {
    if (!pendingBounds) return;
    setBounds(pendingBounds);
    setPendingBounds(null);
    setHasSearched(true);
    setPage(1);
    executeSearch(1, pendingBounds);
  };

  const openListing = (listing: Listing) => {
    setSelectedListing(listing);
    setSelectedPhotoIndex(0);
  };

  const handleBoundsChange = useCallback((nextBounds: ListingBounds) => {
    setPendingBounds(nextBounds);
  }, []);

  const handleLoadSearch = (paramsString: string) => {
    const p = new URLSearchParams(paramsString);

    // Restore state from params (mirroring initialization)
    setSearchQuery(p.get("q") || "");
    setPage(parseInt(p.get("page") || "1", 10));
    setTownSlugs(p.get("towns") ? p.get("towns")!.split(",") : []);
    setNeighborhoodSlugs(p.get("neighborhoods") ? p.get("neighborhoods")!.split(",") : []);

    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      status: p.get("status") ? (p.get("status")!.split(",") as ListingStatus[]) : ["active"],
      propertyTypes: p.get("types") ? (p.get("types")!.split(",") as PropertyType[]) : undefined,
      priceMin: p.get("min_price") ? Number(p.get("min_price")) : 0,
      priceMax: p.get("max_price") ? Number(p.get("max_price")) : 10000000,
      bedsMin: p.get("beds") ? Number(p.get("beds")) : 0,
      bathsMin: p.get("baths") ? Number(p.get("baths")) : 0,
      sqftMin: p.get("min_sqft") ? Number(p.get("min_sqft")) : 0,
      sqftMax: p.get("max_sqft") ? Number(p.get("max_sqft")) : 10000,
    }));

    const sortParam = p.get("sort");
    if (sortParam) {
      const [field, order] = sortParam.split("-");
      setSort({ field: field as any, order: order as "asc" | "desc" });
    } else {
      setSort({ field: "listedAt", order: "desc" });
    }

    // Trigger search
    setHasSearched(true);
    setTriggerSearchFromLoad(true);
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
    // Generate params string from current state
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    // We don't save page
    if (townSlugs.length > 0) params.set("towns", townSlugs.join(","));
    if (neighborhoodSlugs.length > 0) params.set("neighborhoods", neighborhoodSlugs.join(","));
    if (filters.status && filters.status.join(",") !== "active") params.set("status", filters.status.join(","));
    if (filters.propertyTypes && filters.propertyTypes.length > 0) params.set("types", filters.propertyTypes.join(","));
    if (filters.priceMin && filters.priceMin > 0) params.set("min_price", filters.priceMin.toString());
    if (filters.priceMax && filters.priceMax < 10000000) params.set("max_price", filters.priceMax.toString());
    if (filters.bedsMin && filters.bedsMin > 0) params.set("beds", filters.bedsMin.toString());
    if (filters.bathsMin && filters.bathsMin > 0) params.set("baths", filters.bathsMin.toString());
    if (filters.sqftMin && filters.sqftMin > 0) params.set("min_sqft", filters.sqftMin.toString());
    if (filters.sqftMax && filters.sqftMax < 10000) params.set("max_sqft", filters.sqftMax.toString());
    if (sort.field !== "listedAt" || sort.order !== "desc") params.set("sort", `${sort.field}-${sort.order}`);

    saveSearch(name, params.toString(), generateFiltersSummary());
    setShowSaveDialog(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:h-screen lg:overflow-hidden">
      <div className="relative z-30 bg-stone-50 border-b border-stone-200 shadow-md">
        <div className="max-w-[92rem] mx-auto px-3 sm:px-5 lg:px-6 py-1.5">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col lg:flex-row lg:items-end gap-2">
              <div className="flex-1">
                <label className="sr-only">Address search</label>
                <AddressSearchBar
                  initialValue={searchQuery}
                  onChange={setSearchQuery}
                  onSelect={(listing) => {
                    openListing(listing);
                    // Optional: Center map on listing
                    if (listing.lat && listing.lng) {
                      setBounds({
                        north: listing.lat + 0.01,
                        south: listing.lat - 0.01,
                        east: listing.lng + 0.01,
                        west: listing.lng - 0.01,
                      });
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusTabs
                  value={filters.status || ["active"]}
                  onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
                />
                <SortDropdown value={sort} onChange={setSort} />
                <PropertyTypeDropdown
                  value={filters.propertyTypes || []}
                  onChange={(propertyTypes) =>
                    setFilters((prev) => ({ ...prev, propertyTypes }))
                  }
                />
                <button
                  className="px-5 py-1.5 text-sm rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                  type="button"
                  onClick={handleSearch}
                >
                  Search
                </button>
                <button
                  className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                >
                  {showAdvanced ? "Hide advanced" : "Advanced"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <MultiSelectDropdown
                label="Town"
                value={townSlugs}
                onChange={(value) => {
                  setTownSlugs(value);
                  // Filter out neighborhoods that don't belong to the new town selection
                  // Use a Set for faster lookup of valid neighborhoods
                  const validNeighborhoods = new Set(
                    value.flatMap(slug => (neighborhoodsByTown[slug] || []).map(n => n.slug))
                  );
                  setNeighborhoodSlugs(prev => prev.filter(slug => validNeighborhoods.has(slug)));
                }}
                options={towns.map((town) => ({ value: town.slug, label: town.name }))}
              />
              <MultiSelectDropdown
                label="Neighborhood"
                value={neighborhoodSlugs}
                onChange={(value) => setNeighborhoodSlugs(value)}
                options={neighborhoodOptions.map((option) => ({
                  value: option.slug,
                  label: option.name,
                }))}
                disabled={townSlugs.length === 0}
              />
              <label className="flex flex-col text-xs text-stone-500">
                Price min
                <input
                  type="number"
                  inputMode="numeric"
                  value={filters.priceMin && filters.priceMin > 0 ? filters.priceMin : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      priceMin: value ? Number(value) : 0,
                    }));
                  }}
                  placeholder="No min"
                  className="mt-0.5 w-28 sm:w-32 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </label>
              <label className="flex flex-col text-xs text-stone-500">
                Price max
                <input
                  type="number"
                  inputMode="numeric"
                  value={
                    filters.priceMax && filters.priceMax < DEFAULT_FILTERS.priceMax
                      ? filters.priceMax
                      : ""
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      priceMax: value ? Number(value) : DEFAULT_FILTERS.priceMax,
                    }));
                  }}
                  placeholder="No max"
                  className="mt-0.5 w-28 sm:w-32 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </label>
              <FilterSelect
                label="Beds"
                value={filters.bedsMin?.toString() || "0"}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, bedsMin: Number(value) }))
                }
                options={[
                  { value: "0", label: "Any" },
                  { value: "2", label: "2+" },
                  { value: "3", label: "3+" },
                  { value: "4", label: "4+" },
                  { value: "5", label: "5+" },
                ]}
              />
              <FilterSelect
                label="Baths"
                value={filters.bathsMin?.toString() || "0"}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, bathsMin: Number(value) }))
                }
                options={[
                  { value: "0", label: "Any" },
                  { value: "2", label: "2+" },
                  { value: "3", label: "3+" },
                  { value: "4", label: "4+" },
                ]}
              />
              <div className="flex items-center gap-2 lg:ml-auto">
                <button
                  className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                  type="button"
                  onClick={() => setShowSaveDialog(true)}
                >
                  Save search
                </button>
                <button
                  className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                  type="button"
                  onClick={() => setShowSavedSearches(true)}
                >
                  Saved searches
                </button>
                <button
                  className={`px-4 py-1.5 text-xs border rounded-full transition-colors ${showSaved
                    ? "bg-stone-900 text-white border-stone-900"
                    : "border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400"
                    }`}
                  type="button"
                  onClick={() => setShowSaved(!showSaved)}
                >
                  {showSaved ? "Back to search" : "View saved"}
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div className="flex flex-wrap items-end gap-3 border-t border-stone-200 pt-3">
                <label className="flex flex-col text-xs text-stone-500">
                  Sqft min
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.sqftMin && filters.sqftMin > 0 ? filters.sqftMin : ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        sqftMin: value ? Number(value) : 0,
                      }));
                    }}
                    placeholder="No min"
                    className="mt-1 w-28 sm:w-32 px-3 py-2 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Sqft max
                  <input
                    type="number"
                    inputMode="numeric"
                    value={
                      filters.sqftMax && filters.sqftMax < DEFAULT_FILTERS.sqftMax
                        ? filters.sqftMax
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        sqftMax: value ? Number(value) : DEFAULT_FILTERS.sqftMax,
                      }));
                    }}
                    placeholder="No max"
                    className="mt-1 w-28 sm:w-32 px-3 py-2 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Acres min
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={
                      filters.lotAcresMin && filters.lotAcresMin > 0
                        ? filters.lotAcresMin
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        lotAcresMin: value ? Number(value) : 0,
                      }));
                    }}
                    placeholder="No min"
                    className="mt-1 w-24 sm:w-28 px-3 py-2 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
                <label className="flex flex-col text-xs text-stone-500">
                  Acres max
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={
                      filters.lotAcresMax && filters.lotAcresMax < DEFAULT_FILTERS.lotAcresMax
                        ? filters.lotAcresMax
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        lotAcresMax: value ? Number(value) : DEFAULT_FILTERS.lotAcresMax,
                      }));
                    }}
                    placeholder="No max"
                    className="mt-1 w-24 sm:w-28 px-3 py-2 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </label>
              </div>
            )}


          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-320px)] lg:h-[calc(100vh-200px)] lg:overflow-hidden">
        <div className={`relative flex-1 min-h-[420px] lg:min-h-0 bg-stone-200 z-0 ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
          <HomeSearchMap
            listings={hasSearched || showSaved ? displayedListings : []}
            center={defaultCenter}
            onBoundsChange={handleBoundsChange}
            onSelectListing={openListing}
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

        <aside className={`w-full lg:w-[520px] border-l border-stone-200 bg-white lg:h-full lg:overflow-y-auto ${viewMode === 'map' ? 'hidden lg:block' : 'block'}`}>
          <div className="p-6 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Results</p>
                <p className="text-lg font-semibold text-stone-900">
                  {displayTotal} {displayTotal === 1 ? "listing" : "listings"}
                </p>
              </div>
              <span className="text-xs text-stone-400">
                Sorted by {sort.field}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <LoadingState />
            ) : displayedListings.length === 0 ? (
              showSaved ? (
                <div className="text-center py-20">
                  <p className="text-stone-500">You haven't saved any homes yet.</p>
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
                      onSelect={openListing}
                      isSaved={isSaved(listing.id)}
                      onToggleSave={(e) => {
                        e.stopPropagation();
                        toggleSave(listing.id);
                      }}
                    />
                  ))}
                </div>
                {!showSaved && totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}

                {/* Bottom CTA */}
                <div className="mt-12 py-12 px-6 bg-stone-900 text-white rounded-2xl text-center">
                  <h3 className="font-serif text-2xl font-medium mb-4">
                    Ready to make a move?
                  </h3>
                  <p className="text-stone-300 mb-8 leading-relaxed">
                    Whether you&apos;re curious about your home&apos;s value or ready to start touring, I&apos;m here to help you take the next step.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/home-value"
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      Get Home Estimate
                    </Link>
                    <Link
                      href="/contact"
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Contact Matt
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
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
          onClose={() => setSelectedListing(null)}
          isFavorite={isSaved(selectedListing.id)}
          onToggleFavorite={() => toggleSave(selectedListing.id)}
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

function StatusTabs({
  value,
  onChange,
}: {
  value: ListingStatus[];
  onChange: (status: ListingStatus[]) => void;
}) {
  const statuses: ListingStatus[] = ["active", "pending", "sold"];

  const toggleStatus = (status: ListingStatus) => {
    if (value.includes(status)) {
      // Don't allow empty selection, default to at least one or handle empty? 
      // User might want to uncheck all? Usually checking none means none shown or all shown?
      // Default filter is ["active"]. If they uncheck active, they likely want to see nothing?
      // Or if they uncheck all, maybe reset to active?
      // Let's allow unchecking, but if empty, maybe it implies "None"? 
      // Actually, standard behavior: if everything unchecked, show nothing.
      // But typically "Status" filter must have at least one.
      // Let's just toggle.
      const next = value.filter((s) => s !== status);
      if (next.length === 0) return; // Prevent empty for now to match typical IDX behavior
      onChange(next);
    } else {
      onChange([...value, status]);
    }
  };

  return (
    <div className="flex rounded-full overflow-hidden border border-stone-200 bg-white">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => toggleStatus(status)}
          className={`px-3 py-1 text-xs transition-colors ${value.includes(status)
            ? "bg-stone-900 text-white"
            : "text-stone-500 hover:text-stone-800"
            }`}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: ListingSort;
  onChange: (sort: ListingSort) => void;
}) {
  const options = [
    { label: "Newest", field: "listedAt" as const, order: "desc" as const },
    { label: "Price: Low to High", field: "price" as const, order: "asc" as const },
    { label: "Price: High to Low", field: "price" as const, order: "desc" as const },
    { label: "Beds", field: "beds" as const, order: "desc" as const },
    { label: "Sq Ft", field: "sqft" as const, order: "desc" as const },
  ];

  return (
    <select
      value={`${value.field}-${value.order}`}
      onChange={(event) => {
        const [field, order] = event.target.value.split("-") as [
          ListingSort["field"],
          ListingSort["order"]
        ];
        onChange({ field, order });
      }}
      className="px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
    >
      {options.map((opt) => (
        <option key={`${opt.field}-${opt.order}`} value={`${opt.field}-${opt.order}`}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function MultiSelectDropdown({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const isAll = value.length === 0;
  const displayLabel = isAll
    ? `${label}: All`
    : `${label}: ${value.length}`;

  const toggleOption = (optionValue: string) => {
    // If we are currently "All" (empty array), checking one should select JUST that one.
    // If we have selections, check if we are toggling off or on.

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <details className="relative group">
      <summary
        className={`list-none px-4 py-1.5 text-xs rounded-full border cursor-pointer bg-white transition-colors flex items-center gap-1
          ${value.length > 0 ? "border-stone-900 text-stone-900 font-medium" : "border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }}
      >
        {displayLabel}
        <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      {!disabled && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white shadow-lg p-3 z-30 max-h-80 overflow-y-auto">
          <label className="flex items-center gap-2 text-xs text-stone-600 font-medium pb-2 border-b border-stone-100 mb-2 hover:bg-stone-50 p-1 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={value.length === 0}
              onChange={() => onChange([])}
              className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            All {label}s
          </label>
          <div className="space-y-1">
            {options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-xs text-stone-600 hover:bg-stone-50 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}

function PropertyTypeDropdown({
  value,
  onChange,
}: {
  value: PropertyType[];
  onChange: (types: PropertyType[]) => void;
}) {
  return (
    <MultiSelectDropdown
      label="Type"
      value={value}
      onChange={(val) => onChange(val as PropertyType[])}
      options={Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
    />
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col text-xs text-stone-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-0.5 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400"
      >
        <option key={`${label}-all`} value="">
          All
        </option>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListingCard({
  listing,
  onSelect,
  isSaved,
  onToggleSave,
}: {
  listing: Listing;
  onSelect?: (listing: Listing) => void;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
}) {
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
        className="block w-full text-left rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="relative h-36">
          <Image
            src={listing.photos[0]}
            alt={listing.address.street}
            fill
            className="object-cover"
          />
          <span
            className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${statusStyles[listing.status]}`}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
        <div className="p-4">
          <div className="text-lg font-semibold text-stone-900">
            {formatFullPrice(listing.price)}
          </div>
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

function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-stone-200 bg-white p-4 animate-pulse">
          <div className="h-32 bg-stone-100 rounded-xl" />
          <div className="mt-4 h-4 bg-stone-100 rounded w-2/3" />
          <div className="mt-2 h-3 bg-stone-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">
      No listings match your current filters. Adjust your selections and search again.
    </div>
  );
}

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



