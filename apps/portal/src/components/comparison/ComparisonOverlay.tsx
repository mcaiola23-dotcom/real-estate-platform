'use client';

import { X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useComparison, type ComparisonProperty } from './ComparisonContext';

function formatPrice(value: number | undefined): string {
  if (!value) return '\u2014';
  return `$${value.toLocaleString()}`;
}

function formatTax(property: ComparisonProperty): string {
  const tax = property.taxAnnualAmount || property.estimatedTaxAnnual;
  if (!tax) return '\u2014';
  const suffix = property.taxAnnualAmount ? '' : ' (Est.)';
  return `$${tax.toLocaleString()}/yr${suffix}`;
}

interface RowDef {
  label: string;
  render: (p: ComparisonProperty) => string;
  highlight?: boolean;
}

const rows: RowDef[] = [
  { label: 'Status', render: (p) => p.status || '\u2014' },
  { label: 'Price', render: (p) => formatPrice(p.listPrice), highlight: true },
  {
    label: '$/sqft',
    render: (p) =>
      p.listPrice && p.squareFeet
        ? `$${Math.round(p.listPrice / p.squareFeet)}`
        : '\u2014',
  },
  { label: 'Bedrooms', render: (p) => p.bedrooms?.toString() || '\u2014' },
  { label: 'Bathrooms', render: (p) => p.bathrooms?.toString() || '\u2014' },
  {
    label: 'Square Feet',
    render: (p) => (p.squareFeet ? p.squareFeet.toLocaleString() : '\u2014'),
  },
  {
    label: 'Lot Size',
    render: (p) =>
      p.lotSizeAcres ? `${p.lotSizeAcres.toFixed(2)} acres` : '\u2014',
  },
  { label: 'Year Built', render: (p) => p.yearBuilt?.toString() || '\u2014' },
  { label: 'Property Type', render: (p) => p.propertyType || '\u2014' },
  { label: 'Style', render: (p) => p.style || '\u2014' },
  {
    label: 'AVM Estimate',
    render: (p) => (p.avmEstimate ? formatPrice(p.avmEstimate) : '\u2014'),
  },
  {
    label: 'AVM Confidence',
    render: (p) =>
      p.avmConfidence != null ? `${Math.round(p.avmConfidence * 100)}%` : '\u2014',
  },
  { label: 'Annual Tax', render: (p) => formatTax(p) },
  {
    label: 'HOA',
    render: (p) =>
      p.hoaFee
        ? `$${p.hoaFee.toLocaleString()}${p.hoaFrequency ? `/${p.hoaFrequency}` : ''}`
        : 'None',
  },
  {
    label: 'Days on Market',
    render: (p) =>
      p.daysOnMarket != null ? p.daysOnMarket.toString() : '\u2014',
  },
  { label: 'Garage', render: (p) => (p.garageSpaces ? `${p.garageSpaces} car` : '\u2014') },
  { label: 'Pool', render: (p) => (p.pool ? 'Yes' : 'No') },
  { label: 'Elementary School', render: (p) => p.schoolElementary || '\u2014' },
  { label: 'Middle School', render: (p) => p.schoolMiddle || '\u2014' },
  { label: 'High School', render: (p) => p.schoolHigh || '\u2014' },
];

export default function ComparisonOverlay() {
  const { items, remove, clear, overlayOpen, setOverlayOpen } = useComparison();

  if (!overlayOpen || items.length < 2) return null;

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
        <div>
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            Property Comparison
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Comparing {items.length} properties side by side
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
          >
            <Trash2 size={14} />
            Clear All
          </button>
          <button
            onClick={() => setOverlayOpen(false)}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-[600px]">
          {/* Photo + address header row */}
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="w-44 p-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide border-b border-stone-200 bg-stone-50">
                Property
              </th>
              {items.map((property) => (
                <th
                  key={property.parcelId}
                  className="p-3 border-b border-stone-200 border-l bg-stone-50"
                >
                  <div className="flex flex-col items-center gap-2">
                    {property.photo ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden">
                        <Image
                          src={property.photo}
                          alt={property.address}
                          fill
                          className="object-cover"
                          sizes="250px"
                          quality={60}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-stone-200 flex items-center justify-center">
                        <span className="text-stone-400 text-sm">No Photo</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-stone-900">
                        {property.address}
                      </p>
                      <p className="text-xs text-stone-500">
                        {property.city}, {property.state}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(property.parcelId)}
                      className="text-[10px] text-stone-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
              {/* Empty columns to fill */}
              {Array.from({ length: 4 - items.length }).map((_, i) => (
                <th
                  key={`empty-${i}`}
                  className="p-3 border-b border-stone-200 border-l bg-stone-50 min-w-[200px]"
                >
                  <div className="h-28 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center">
                    <span className="text-sm text-stone-300">Add Property</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.label}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="px-3 py-2.5 text-xs font-medium text-stone-500 border-b border-stone-100">
                  {row.label}
                </td>
                {items.map((property) => {
                  const value = row.render(property);
                  return (
                    <td
                      key={property.parcelId}
                      className={`px-3 py-2.5 text-sm text-center border-b border-stone-100 border-l ${
                        row.highlight
                          ? 'font-serif font-bold text-stone-900'
                          : 'text-stone-700'
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td
                    key={`empty-${i}`}
                    className="px-3 py-2.5 text-center border-b border-stone-100 border-l text-stone-200"
                  >
                    &mdash;
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
