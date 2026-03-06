"use client";

import { useEffect, useRef, useState } from "react";

import type { Listing } from "../../lib/data/providers/listings.types";
import type { TenantScope } from "../../lib/data/providers/tenant-context";
import { formatFullPrice, suggestListings } from "../../lib/data/providers/listings.provider";

interface AddressSearchBarProps {
  onSelect: (listing: Listing) => void;
  initialValue?: string;
  onChange?: (value: string) => void;
  tenantContext?: TenantScope;
}

export function AddressSearchBar({
  onSelect,
  initialValue = "",
  onChange,
  tenantContext,
}: AddressSearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Listing[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const results = await suggestListings({ q: query, limit: 6, tenantContext });
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, tenantContext]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) => (previous < suggestions.length - 1 ? previous + 1 : previous));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) => (previous > 0 ? previous - 1 : -1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (listing: Listing) => {
    setQuery(listing.address.street);
    onChange?.(listing.address.street);
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            onChange?.(value);
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
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 text-sm transition-colors ${
                      index === highlightedIndex
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
                      <span className="font-semibold text-stone-900">{formatFullPrice(listing.price)}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                          statusColors[listing.status]
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-stone-500 text-center">No listings found matching: {query}</div>
          )}
        </div>
      )}
    </div>
  );
}
