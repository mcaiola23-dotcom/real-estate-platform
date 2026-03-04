'use client';

import { X, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { useComparison } from './ComparisonContext';

export default function ComparisonBar() {
  const { items, remove, clear, setOverlayOpen } = useComparison();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Property thumbnails */}
        <div className="flex items-center gap-3 flex-1 overflow-x-auto">
          {items.map((property) => (
            <div
              key={property.parcelId}
              className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2 border border-stone-200 flex-shrink-0"
            >
              {property.photo ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={property.photo}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    quality={50}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-stone-400 text-xs">N/A</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-stone-900 truncate max-w-[140px]">
                  {property.address}
                </p>
                <p className="text-[10px] text-stone-500">
                  {property.listPrice
                    ? `$${property.listPrice.toLocaleString()}`
                    : property.city}
                </p>
              </div>
              <button
                onClick={() => remove(property.parcelId)}
                className="p-1 rounded-full hover:bg-stone-200 transition-colors flex-shrink-0"
                title="Remove from comparison"
              >
                <X size={12} className="text-stone-400" />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - items.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-10 h-10 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center flex-shrink-0"
            >
              <span className="text-stone-300 text-xs">+</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clear}
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors px-3 py-1.5"
          >
            Clear
          </button>
          <button
            onClick={() => setOverlayOpen(true)}
            disabled={items.length < 2}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            <BarChart3 size={16} />
            Compare ({items.length})
          </button>
        </div>
      </div>
    </div>
  );
}
