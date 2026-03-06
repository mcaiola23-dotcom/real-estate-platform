"use client";

import type { Dispatch, SetStateAction } from "react";

import { DEFAULT_FILTERS, Listing, ListingFilters, ListingSort } from "../../lib/data/providers/listings.types";
import type { TenantScope } from "../../lib/data/providers/tenant-context";
import { AddressSearchBar } from "./AddressSearchBar";
import {
  FilterSelect,
  MultiSelectDropdown,
  PropertyTypeDropdown,
  SortDropdown,
  StatusTabs,
} from "./SearchFilterControls";

interface SearchToolbarProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  tenantContext?: TenantScope;
  onAutocompleteSelect: (listing: Listing) => void;
  filters: ListingFilters;
  setFilters: Dispatch<SetStateAction<ListingFilters>>;
  sort: ListingSort;
  setSort: Dispatch<SetStateAction<ListingSort>>;
  onSearch: () => void;
  showAdvanced: boolean;
  setShowAdvanced: Dispatch<SetStateAction<boolean>>;
  townSlugs: string[];
  setTownSlugs: Dispatch<SetStateAction<string[]>>;
  neighborhoodsByTown: Record<string, { slug: string; name: string }[]>;
  neighborhoodSlugs: string[];
  setNeighborhoodSlugs: Dispatch<SetStateAction<string[]>>;
  neighborhoodOptions: { slug: string; name: string }[];
  towns: { slug: string; name: string }[];
  showSaved: boolean;
  setShowSaved: Dispatch<SetStateAction<boolean>>;
  setShowSaveDialog: Dispatch<SetStateAction<boolean>>;
  setShowSavedSearches: Dispatch<SetStateAction<boolean>>;
}

export function SearchToolbar({
  searchQuery,
  setSearchQuery,
  tenantContext,
  onAutocompleteSelect,
  filters,
  setFilters,
  sort,
  setSort,
  onSearch,
  showAdvanced,
  setShowAdvanced,
  townSlugs,
  setTownSlugs,
  neighborhoodsByTown,
  neighborhoodSlugs,
  setNeighborhoodSlugs,
  neighborhoodOptions,
  towns,
  showSaved,
  setShowSaved,
  setShowSaveDialog,
  setShowSavedSearches,
}: SearchToolbarProps) {
  return (
    <div className="relative z-30 bg-stone-50 border-b border-stone-200 shadow-md">
      <div className="max-w-[92rem] mx-auto px-3 sm:px-5 lg:px-6 py-1.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-2">
            <div className="flex-1">
              <label className="sr-only">Address search</label>
              <AddressSearchBar
                initialValue={searchQuery}
                onChange={setSearchQuery}
                tenantContext={tenantContext}
                onSelect={onAutocompleteSelect}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusTabs
                value={filters.status || ["active"]}
                onChange={(status) => setFilters((previous) => ({ ...previous, status }))}
              />
              <SortDropdown value={sort} onChange={setSort} />
              <PropertyTypeDropdown
                value={filters.propertyTypes || []}
                onChange={(propertyTypes) =>
                  setFilters((previous) => ({ ...previous, propertyTypes }))
                }
              />
              <button
                className="px-5 py-1.5 text-sm rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                type="button"
                onClick={onSearch}
              >
                Search
              </button>
              <button
                className="px-4 py-1.5 text-xs border border-stone-300 rounded-full text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                type="button"
                onClick={() => setShowAdvanced((previous) => !previous)}
              >
                {showAdvanced ? "Hide advanced" : "Advanced"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <MultiSelectDropdown
              label="Town"
              value={townSlugs}
              onChange={(nextTownSlugs) => {
                setTownSlugs(nextTownSlugs);
                const validNeighborhoods = new Set(
                  nextTownSlugs.flatMap((slug) => (neighborhoodsByTown[slug] || []).map((item) => item.slug))
                );
                setNeighborhoodSlugs((previous) => previous.filter((slug) => validNeighborhoods.has(slug)));
              }}
              options={towns.map((town) => ({ value: town.slug, label: town.name }))}
            />
            <MultiSelectDropdown
              label="Neighborhood"
              value={neighborhoodSlugs}
              onChange={setNeighborhoodSlugs}
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
                  setFilters((previous) => ({
                    ...previous,
                    priceMin: value ? Number(value) : 0,
                  }));
                }}
                placeholder="No min"
                className="mt-0.5 w-28 sm:w-32 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                onKeyDown={(event) => event.key === "Enter" && onSearch()}
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
                  setFilters((previous) => ({
                    ...previous,
                    priceMax: value ? Number(value) : DEFAULT_FILTERS.priceMax,
                  }));
                }}
                placeholder="No max"
                className="mt-0.5 w-28 sm:w-32 px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                onKeyDown={(event) => event.key === "Enter" && onSearch()}
              />
            </label>
            <FilterSelect
              label="Beds"
              value={filters.bedsMin?.toString() || "0"}
              onChange={(value) => setFilters((previous) => ({ ...previous, bedsMin: Number(value) }))}
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
              onChange={(value) => setFilters((previous) => ({ ...previous, bathsMin: Number(value) }))}
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
                className={`px-4 py-1.5 text-xs border rounded-full transition-colors ${
                  showSaved
                    ? "bg-stone-900 text-white border-stone-900"
                    : "border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400"
                }`}
                type="button"
                onClick={() => setShowSaved((previous) => !previous)}
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
                    setFilters((previous) => ({
                      ...previous,
                      sqftMin: value ? Number(value) : 0,
                    }));
                  }}
                  placeholder="No min"
                  className="mt-1 w-28 sm:w-32 px-3 py-2 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  onKeyDown={(event) => event.key === "Enter" && onSearch()}
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
                    setFilters((previous) => ({
                      ...previous,
                      sqftMax: value ? Number(value) : DEFAULT_FILTERS.sqftMax,
                    }));
                  }}
                  placeholder="No max"
                  className="mt-1 w-28 sm:w-32 px-3 py-2 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  onKeyDown={(event) => event.key === "Enter" && onSearch()}
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
                    setFilters((previous) => ({
                      ...previous,
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
                    setFilters((previous) => ({
                      ...previous,
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
  );
}
