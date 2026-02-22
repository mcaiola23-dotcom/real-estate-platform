'use client';

import type { ListingFilters, ListingStatus, PropertyType } from '@real-estate/types/listings';
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@real-estate/types/listings';

interface PropertyFiltersProps {
  filters: ListingFilters;
  onFilterChange: (filters: ListingFilters) => void;
  onReset: () => void;
}

const ALL_STATUSES: ListingStatus[] = ['active', 'pending', 'sold'];
const ALL_PROPERTY_TYPES: PropertyType[] = ['single-family', 'condo', 'townhouse', 'multi-family', 'land'];

export function PropertyFilters({ filters, onFilterChange, onReset }: PropertyFiltersProps) {
  const activeStatuses = filters.status ?? [];
  const activeTypes = filters.propertyTypes ?? [];

  function toggleStatus(status: ListingStatus) {
    const current = new Set(activeStatuses);
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }
    onFilterChange({ ...filters, status: Array.from(current) });
  }

  function togglePropertyType(type: PropertyType) {
    const current = new Set(activeTypes);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    onFilterChange({ ...filters, propertyTypes: Array.from(current) });
  }

  function setPriceMin(val: string) {
    const num = val ? parseInt(val, 10) : undefined;
    onFilterChange({ ...filters, priceMin: num });
  }

  function setPriceMax(val: string) {
    const num = val ? parseInt(val, 10) : undefined;
    onFilterChange({ ...filters, priceMax: num });
  }

  function setBedsMin(val: string) {
    const num = val ? parseInt(val, 10) : undefined;
    onFilterChange({ ...filters, bedsMin: num });
  }

  function setBathsMin(val: string) {
    const num = val ? parseInt(val, 10) : undefined;
    onFilterChange({ ...filters, bathsMin: num });
  }

  const hasActiveFilters =
    activeStatuses.length > 0 ||
    activeTypes.length > 0 ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.bedsMin !== undefined ||
    filters.bathsMin !== undefined;

  return (
    <div className="crm-property-filters">
      <div className="crm-property-filters__header">
        <h3 className="crm-property-filters__title">Filters</h3>
        {hasActiveFilters && (
          <button className="crm-property-filters__reset" onClick={onReset}>
            Clear All
          </button>
        )}
      </div>

      <div className="crm-property-filters__section">
        <h4 className="crm-property-filters__label">Status</h4>
        <div className="crm-property-filters__chips">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              className={`crm-property-filters__chip ${activeStatuses.includes(status) ? 'crm-property-filters__chip--active' : ''}`}
              onClick={() => toggleStatus(status)}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="crm-property-filters__section">
        <h4 className="crm-property-filters__label">Property Type</h4>
        <div className="crm-property-filters__chips">
          {ALL_PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              className={`crm-property-filters__chip ${activeTypes.includes(type) ? 'crm-property-filters__chip--active' : ''}`}
              onClick={() => togglePropertyType(type)}
            >
              {PROPERTY_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="crm-property-filters__section">
        <h4 className="crm-property-filters__label">Price Range</h4>
        <div className="crm-property-filters__range">
          <input
            type="number"
            className="crm-property-filters__input"
            placeholder="Min"
            value={filters.priceMin ?? ''}
            onChange={(e) => setPriceMin(e.target.value)}
            min={0}
            step={50000}
          />
          <span className="crm-property-filters__separator">—</span>
          <input
            type="number"
            className="crm-property-filters__input"
            placeholder="Max"
            value={filters.priceMax ?? ''}
            onChange={(e) => setPriceMax(e.target.value)}
            min={0}
            step={50000}
          />
        </div>
      </div>

      <div className="crm-property-filters__section">
        <h4 className="crm-property-filters__label">Bedrooms</h4>
        <div className="crm-property-filters__chips">
          {['Any', '1+', '2+', '3+', '4+', '5+'].map((label, i) => {
            const val = i === 0 ? undefined : i;
            return (
              <button
                key={label}
                className={`crm-property-filters__chip ${filters.bedsMin === val ? 'crm-property-filters__chip--active' : ''}`}
                onClick={() => setBedsMin(val === undefined ? '' : String(val))}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="crm-property-filters__section">
        <h4 className="crm-property-filters__label">Bathrooms</h4>
        <div className="crm-property-filters__chips">
          {['Any', '1+', '2+', '3+', '4+'].map((label, i) => {
            const val = i === 0 ? undefined : i;
            return (
              <button
                key={label}
                className={`crm-property-filters__chip ${filters.bathsMin === val ? 'crm-property-filters__chip--active' : ''}`}
                onClick={() => setBathsMin(val === undefined ? '' : String(val))}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
