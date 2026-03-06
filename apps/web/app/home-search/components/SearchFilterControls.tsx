"use client";

import {
  ListingSort,
  ListingStatus,
  PropertyType,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
} from "../../lib/data/providers/listings.types";

interface StatusTabsProps {
  value: ListingStatus[];
  onChange: (status: ListingStatus[]) => void;
}

export function StatusTabs({ value, onChange }: StatusTabsProps) {
  const statuses: ListingStatus[] = ["active", "pending", "sold"];

  const toggleStatus = (status: ListingStatus) => {
    if (value.includes(status)) {
      const next = value.filter((entry) => entry !== status);
      if (next.length === 0) {
        return;
      }
      onChange(next);
      return;
    }

    onChange([...value, status]);
  };

  return (
    <div className="flex rounded-full overflow-hidden border border-stone-200 bg-white">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => toggleStatus(status)}
          className={`px-3 py-1 text-xs transition-colors ${
            value.includes(status) ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}

interface SortDropdownProps {
  value: ListingSort;
  onChange: (sort: ListingSort) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
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
        const [field, order] = event.target.value.split("-") as [ListingSort["field"], ListingSort["order"]];
        onChange({ field, order });
      }}
      className="px-3 py-1.5 bg-white text-stone-700 rounded-full text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400"
    >
      {options.map((option) => (
        <option key={`${option.field}-${option.order}`} value={`${option.field}-${option.order}`}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface MultiSelectDropdownProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function MultiSelectDropdown({ label, value, onChange, options, disabled }: MultiSelectDropdownProps) {
  const displayLabel = value.length === 0 ? `${label}: All` : `${label}: ${value.length}`;

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((entry) => entry !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  };

  return (
    <details className="relative group">
      <summary
        className={`list-none px-4 py-1.5 text-xs rounded-full border cursor-pointer bg-white transition-colors flex items-center gap-1
          ${
            value.length > 0
              ? "border-stone-900 text-stone-900 font-medium"
              : "border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
          }
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
              <label
                key={option.value}
                className="flex items-center gap-2 text-xs text-stone-600 hover:bg-stone-50 p-1 rounded cursor-pointer"
              >
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

interface PropertyTypeDropdownProps {
  value: PropertyType[];
  onChange: (types: PropertyType[]) => void;
}

export function PropertyTypeDropdown({ value, onChange }: PropertyTypeDropdownProps) {
  return (
    <MultiSelectDropdown
      label="Type"
      value={value}
      onChange={(nextValue) => onChange(nextValue as PropertyType[])}
      options={Object.entries(PROPERTY_TYPE_LABELS).map(([valueKey, label]) => ({
        value: valueKey,
        label,
      }))}
    />
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function FilterSelect({ label, value, onChange, options, disabled }: FilterSelectProps) {
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
