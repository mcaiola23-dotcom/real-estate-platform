'use client';

/**
 * PoisModule - Points of Interest
 * 
 * Displays local POIs from Google Places or curated fallback.
 * Supports category tabs for organized browsing.
 */

import { useState } from 'react';
import { DataModule } from './DataModule';
import {
    PlacesResult,
    Poi,
    PoiCategory,
    groupPoisByCategory,
    getCategoryLabel,
} from '../../lib/data/providers/places.provider';

interface PoisModuleProps {
    result: PlacesResult;
    locationName: string;
}

export function PoisModule({ result, locationName }: PoisModuleProps) {
    const [activeCategory, setActiveCategory] = useState<PoiCategory | 'all'>('all');

    const groupedPois = groupPoisByCategory(result.pois);

    // Get categories that have POIs
    const availableCategories = (Object.keys(groupedPois) as PoiCategory[]).filter(
        (cat) => groupedPois[cat].length > 0
    );

    // Filter POIs based on active category
    const displayedPois =
        activeCategory === 'all'
            ? result.pois
            : groupedPois[activeCategory] || [];

    if (result.pois.length === 0) {
        return (
            <DataModule
                title="Points of Interest"
                whyItMatters="Local spots for dining, coffee, and recreation"
                source={result.sourceLabel || 'Local Recommendations'}
                sourceUrl={result.sourceUrl}
                lastUpdated={result.fetchedAt}
                error="No points of interest available"
            >
                <div />
            </DataModule>
        );
    }

    return (
        <DataModule
            title="Points of Interest"
            whyItMatters={`Popular spots near ${locationName}`}
            source={result.sourceLabel}
            sourceUrl={result.sourceUrl}
            lastUpdated={result.fetchedAt}
            method={result.source === 'curated' ? 'Curated by Matt' : undefined}
        >
            <div className="space-y-4">
                {/* Category Tabs */}
                {availableCategories.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                        <CategoryTab
                            label="All"
                            isActive={activeCategory === 'all'}
                            onClick={() => setActiveCategory('all')}
                            count={result.pois.length}
                        />
                        {availableCategories.map((category) => (
                            <CategoryTab
                                key={category}
                                label={getCategoryLabel(category)}
                                isActive={activeCategory === category}
                                onClick={() => setActiveCategory(category)}
                                count={groupedPois[category].length}
                            />
                        ))}
                    </div>
                )}

                {/* POI List */}
                <div className="space-y-2">
                    {displayedPois.map((poi, index) => (
                        <PoiItem key={`${poi.name}-${index}`} poi={poi} />
                    ))}
                </div>
            </div>
        </DataModule>
    );
}

/**
 * Category tab button
 */
function CategoryTab({
    label,
    isActive,
    onClick,
    count,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
    count: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                px-3 py-1.5 text-sm rounded-full transition-colors
                ${isActive
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                }
            `}
        >
            {label}
            <span className={`ml-1 ${isActive ? 'text-stone-400' : 'text-slate-400'}`}>
                ({count})
            </span>
        </button>
    );
}

/**
 * Individual POI item
 */
function PoiItem({ poi }: { poi: Poi }) {
    return (
        <div className="flex items-start justify-between gap-3 py-2 border-b border-stone-100 last:border-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {poi.url ? (
                        <a
                            href={poi.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-slate-900 hover:text-stone-600 truncate"
                        >
                            {poi.name}
                        </a>
                    ) : (
                        <span className="font-medium text-slate-900 truncate">
                            {poi.name}
                        </span>
                    )}
                    {poi.rating && (
                        <span className="flex items-center text-xs text-amber-600">
                            <StarIcon className="w-3 h-3 mr-0.5" />
                            {poi.rating.toFixed(1)}
                        </span>
                    )}
                </div>
                {poi.note && (
                    <p className="text-sm text-slate-500 mt-0.5">{poi.note}</p>
                )}
                {poi.address && !poi.note && (
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{poi.address}</p>
                )}
            </div>
            <span className="text-xs text-stone-400 whitespace-nowrap px-2 py-0.5 bg-stone-50 rounded">
                {getCategoryLabel(poi.category)}
            </span>
        </div>
    );
}

/**
 * Star icon for ratings
 */
function StarIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

/**
 * PoisModulePlaceholder - Show when no POIs available
 */
export function PoisModulePlaceholder({ locationName }: { locationName: string }) {
    return (
        <DataModule
            title="Points of Interest"
            whyItMatters={`Popular spots near ${locationName}`}
            source="Local Recommendations"
            sourceUrl=""
            error="Points of interest coming soon"
        >
            <div />
        </DataModule>
    );
}

export default PoisModule;
