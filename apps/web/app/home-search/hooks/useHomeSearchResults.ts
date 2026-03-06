import { useCallback, useRef, useState } from "react";
import { searchListings } from "../../lib/data/providers/listings.provider";
import type { Listing, ListingBounds, ListingFilters, ListingSearchResult, ListingSort } from "../../lib/data/providers/listings.types";
import type { TenantScope } from "../../lib/data/providers/tenant-context";

export type HomeSearchTrigger =
  | "initial_load"
  | "manual"
  | "pagination"
  | "map_bounds"
  | "load_saved_search";

interface UseHomeSearchResultsParams {
  tenantContext?: TenantScope;
  townSlugs: string[];
  neighborhoodSlugs: string[];
  searchQuery: string;
  filters: ListingFilters;
  sort: ListingSort;
  pageSize?: number;
  onSearchResolved?: (context: {
    result: ListingSearchResult;
    nextPage: number;
    nextBounds?: ListingBounds;
    trigger: HomeSearchTrigger;
    durationMs: number;
  }) => void;
  onSearchError?: (error: unknown) => void;
}

export function useHomeSearchResults({
  tenantContext,
  townSlugs,
  neighborhoodSlugs,
  searchQuery,
  filters,
  sort,
  pageSize = 12,
  onSearchResolved,
  onSearchError,
}: UseHomeSearchResultsParams) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const latestSearchRequestIdRef = useRef(0);

  const executeSearch = useCallback(
    async (nextPage: number, nextBounds?: ListingBounds, trigger: HomeSearchTrigger = "manual") => {
      const requestId = ++latestSearchRequestIdRef.current;
      const startedAt = typeof window === "undefined" ? Date.now() : window.performance.now();
      setLoading(true);

      try {
        const result = await searchListings({
          scope: "global",
          tenantContext,
          townSlugs: townSlugs.length ? townSlugs : undefined,
          neighborhoodSlugs: neighborhoodSlugs.length ? neighborhoodSlugs : undefined,
          bounds: nextBounds,
          q: searchQuery.trim() ? searchQuery.trim() : undefined,
          filters,
          sort,
          page: nextPage,
          pageSize,
        });

        if (requestId !== latestSearchRequestIdRef.current) {
          return;
        }

        setListings(result.listings);
        setTotal(result.total);
        setTotalPages(result.totalPages);

        const completedAt = typeof window === "undefined" ? Date.now() : window.performance.now();
        onSearchResolved?.({
          result,
          nextPage,
          nextBounds,
          trigger,
          durationMs: completedAt - startedAt,
        });
      } catch (error) {
        onSearchError?.(error);
      } finally {
        if (requestId === latestSearchRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [
      filters,
      neighborhoodSlugs,
      onSearchError,
      onSearchResolved,
      pageSize,
      searchQuery,
      sort,
      tenantContext,
      townSlugs,
    ]
  );

  return {
    listings,
    total,
    totalPages,
    loading,
    executeSearch,
  };
}
