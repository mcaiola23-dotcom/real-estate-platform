'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Listing, ListingFilters, ListingSortField, ListingSortOrder } from '@real-estate/types/listings';

import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PropertyDetailModal, type LeadOption } from './PropertyDetailModal';
import { EmptyState } from '../shared/EmptyState';
import { FeedStatusChip } from './FeedStatusChip';
import { ListingDescriptionGenerator } from './ListingDescriptionGenerator';

interface PropertiesViewProps {
  leadOptions: LeadOption[];
  onAssignToLead: (listing: Listing, leadId: string) => void;
  onSendToClient: (listing: Listing, leadId: string) => void;
  pushToast: (kind: 'success' | 'error', message: string) => void;
}

interface PropertiesData {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const INITIAL_FILTERS: ListingFilters = {};

export function PropertiesView({
  leadOptions,
  onAssignToLead,
  onSendToClient,
  pushToast,
}: PropertiesViewProps) {
  const [data, setData] = useState<PropertiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ListingFilters>(INITIAL_FILTERS);
  const [sortField, setSortField] = useState<ListingSortField>('listedAt');
  const [sortOrder, setSortOrder] = useState<ListingSortOrder>('desc');
  const [page, setPage] = useState(1);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDescGenerator, setShowDescGenerator] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      params.set('sortField', sortField);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', '12');

      if (filters.status && filters.status.length > 0) {
        params.set('status', filters.status.join(','));
      }
      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        params.set('propertyTypes', filters.propertyTypes.join(','));
      }
      if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
      if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
      if (filters.bedsMin !== undefined) params.set('bedsMin', String(filters.bedsMin));
      if (filters.bathsMin !== undefined) params.set('bathsMin', String(filters.bathsMin));

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load properties');
      const json = await res.json();
      setData({
        listings: json.listings,
        total: json.total,
        page: json.page,
        pageSize: json.pageSize,
        totalPages: json.totalPages,
      });
    } catch {
      pushToast('error', 'Failed to load properties.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortField, sortOrder, page, pushToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Reset page when filters/sort/search change
  const handleFilterChange = useCallback((newFilters: ListingFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  }, []);

  const handleAssignToLead = useCallback(
    (listing: Listing, leadId: string) => {
      onAssignToLead(listing, leadId);
      setDetailListing(null);
      pushToast('success', 'Property assigned to lead.');
    },
    [onAssignToLead, pushToast]
  );

  const handleSendToClient = useCallback(
    (listing: Listing, leadId: string) => {
      onSendToClient(listing, leadId);
      setDetailListing(null);
      pushToast('success', 'Property details sent to client.');
    },
    [onSendToClient, pushToast]
  );

  const sortOptions: { field: ListingSortField; label: string }[] = useMemo(
    () => [
      { field: 'listedAt', label: 'Newest' },
      { field: 'price', label: 'Price' },
      { field: 'beds', label: 'Beds' },
      { field: 'sqft', label: 'Sqft' },
    ],
    []
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.propertyTypes && filters.propertyTypes.length > 0) count++;
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) count++;
    if (filters.bedsMin !== undefined) count++;
    if (filters.bathsMin !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <div className="crm-properties-view">
      {/* Feed Status + Toolbar */}
      <FeedStatusChip />
      <div className="crm-properties-toolbar">
        <form className="crm-properties-search" onSubmit={handleSearch}>
          <input
            type="text"
            className="crm-properties-search__input"
            placeholder="Search by address, city, zip, or MLS #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="crm-properties-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </form>

        <div className="crm-properties-toolbar__controls">
          <button
            className="crm-btn crm-btn-ghost crm-btn-sm"
            onClick={() => setShowDescGenerator(true)}
            title="AI Listing Description Generator"
          >
            <span className="crm-ai-glyph">◆</span> Write Description
          </button>
          <button
            className={`crm-properties-toolbar__filter-btn ${showFilters ? 'crm-properties-toolbar__filter-btn--active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="crm-properties-toolbar__filter-badge">{activeFilterCount}</span>
            )}
          </button>

          <div className="crm-properties-toolbar__sort">
            <select
              className="crm-properties-toolbar__sort-select"
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as ListingSortField);
                setPage(1);
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.field} value={opt.field}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              className="crm-properties-toolbar__sort-dir"
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setPage(1);
              }}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="crm-properties-layout">
        {/* Filters panel */}
        {showFilters && (
          <div className="crm-properties-layout__filters">
            <PropertyFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>
        )}

        {/* Main content */}
        <div className="crm-properties-layout__main">
          {loading ? (
            <div className="crm-properties-loading">
              <div className="crm-properties-loading__shimmer" />
              <div className="crm-properties-loading__shimmer" />
              <div className="crm-properties-loading__shimmer" />
            </div>
          ) : !data || data.listings.length === 0 ? (
            <EmptyState
              title="No properties found"
              detail="Try adjusting your search or filters to find listings."
            />
          ) : (
            <>
              <div className="crm-properties-summary">
                <span>
                  {data.total} {data.total === 1 ? 'property' : 'properties'}
                </span>
                {data.totalPages > 1 && (
                  <span className="crm-properties-summary__page">
                    Page {data.page} of {data.totalPages}
                  </span>
                )}
              </div>

              <div className="crm-properties-grid">
                {data.listings.map((listing) => (
                  <PropertyCard
                    key={listing.id}
                    listing={listing}
                    onViewDetail={setDetailListing}
                    onAssignToLead={(l) => {
                      // Open detail modal for lead selection
                      setDetailListing(l);
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="crm-properties-pagination">
                  <button
                    className="crm-properties-pagination__btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span className="crm-properties-pagination__info">
                    {page} / {data.totalPages}
                  </span>
                  <button
                    className="crm-properties-pagination__btn"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {detailListing && (
        <PropertyDetailModal
          listing={detailListing}
          leadOptions={leadOptions}
          onClose={() => setDetailListing(null)}
          onAssignToLead={handleAssignToLead}
          onSendToClient={handleSendToClient}
        />
      )}

      {/* AI Listing Description Generator */}
      {showDescGenerator && (
        <ListingDescriptionGenerator
          onClose={() => setShowDescGenerator(false)}
          pushToast={pushToast}
        />
      )}
    </div>
  );
}
