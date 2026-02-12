/**
 * DataModule - Shared wrapper for all data modules
 * 
 * Enforces consistent styling with:
 * - Title + optional "why it matters" line
 * - Content slot (table/list/chips)
 * - Footer: Source + Last updated + optional Method disclosure
 */

import React from 'react';

export interface DataModuleProps {
    /** Module title */
    title: string;
    /** Optional subtitle explaining why this matters */
    whyItMatters?: string;
    /** Source name for attribution */
    source: string;
    /** URL to the data source */
    sourceUrl?: string;
    /** When the data was last updated */
    lastUpdated?: string;
    /** Optional method disclosure text */
    method?: string;
    /** Optional disclaimer text */
    disclaimer?: string;
    /** Content to render inside the module */
    children: React.ReactNode;
    /** Optional className for custom styling */
    className?: string;
    /** Loading state */
    loading?: boolean;
    /** Error state - show graceful fallback */
    error?: string;
}

export function DataModule({
    title,
    whyItMatters,
    source,
    sourceUrl,
    lastUpdated,
    method,
    disclaimer,
    children,
    className = '',
    loading = false,
    error,
}: DataModuleProps) {
    // Format the last updated date
    const formattedDate = lastUpdated
        ? formatDate(lastUpdated)
        : 'Date unavailable';

    return (
        <div className={`bg-white border border-stone-200 rounded-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100">
                <h3 className="text-lg font-bold text-slate-900 font-serif">{title}</h3>
                {whyItMatters && (
                    <p className="text-sm text-slate-500 mt-1">{whyItMatters}</p>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse flex space-x-4">
                            <div className="h-4 w-32 bg-stone-200 rounded"></div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-stone-400 text-sm">{error}</p>
                    </div>
                ) : (
                    children
                )}
            </div>

            {/* Disclaimer (if present) */}
            {disclaimer && (
                <div className="px-6 pb-4">
                    <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                        {disclaimer}
                    </p>
                </div>
            )}

            {/* Footer - Source + Last Updated */}
            <div className="px-6 py-3 bg-stone-50 border-t border-stone-100">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                        <span>Source:</span>
                        {sourceUrl ? (
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-700 hover:underline"
                            >
                                {source}
                            </a>
                        ) : (
                            <span>{source}</span>
                        )}
                        {method && (
                            <>
                                <span className="text-stone-300">|</span>
                                <span className="text-stone-400">{method}</span>
                            </>
                        )}
                    </div>
                    <span>Last updated: {formattedDate}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Format a date string or Date object to a readable format
 */
function formatDate(dateInput: string | Date): string {
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return 'Date unavailable';
    }
}

/**
 * DataModuleGrid - Grid layout for multiple modules
 */
export function DataModuleGrid({
    children,
    columns = 2,
    className = '',
}: {
    children: React.ReactNode;
    columns?: 1 | 2 | 3;
    className?: string;
}) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
            {children}
        </div>
    );
}

/**
 * DataChip - Compact display for a single stat
 */
export function DataChip({
    label,
    value,
    subValue,
}: {
    label: string;
    value: string | number;
    subValue?: string;
}) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-stone-500 uppercase tracking-wide">{label}</span>
            <span className="text-lg font-semibold text-slate-900">{value}</span>
            {subValue && (
                <span className="text-xs text-stone-400">{subValue}</span>
            )}
        </div>
    );
}

/**
 * DataChipGrid - Grid layout for multiple chips
 */
export function DataChipGrid({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
            {children}
        </div>
    );
}

export default DataModule;
