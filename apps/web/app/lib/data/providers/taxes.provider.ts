/**
 * Taxes Provider
 * 
 * Provides mill rate and property tax information for towns.
 * Data is loaded from a static JSON file (no API calls needed).
 */

import taxesData from '../../../data/taxes/fairfield-county-mill-rates.json';

export interface TaxData {
    millRate: number;
    assessorUrl: string;
    assessmentRatio: number;
    fiscalYear: string;
}

export interface TaxResult {
    data: TaxData | null;
    source: string;
    sourceUrl: string;
    methodology: string;
    fiscalYear: string;
}

/**
 * Get tax data for a town
 */
export function getTaxesForTown(townSlug: string): TaxResult {
    const metadata = taxesData.metadata;
    const townData = taxesData.towns[townSlug as keyof typeof taxesData.towns];

    if (!townData) {
        return {
            data: null,
            source: metadata.source,
            sourceUrl: metadata.sourceUrl,
            methodology: metadata.methodology,
            fiscalYear: metadata.fiscalYear,
        };
    }

    return {
        data: {
            millRate: townData.millRate,
            assessorUrl: townData.assessorUrl,
            assessmentRatio: townData.assessmentRatio,
            fiscalYear: townData.fiscalYear,
        },
        source: metadata.source,
        sourceUrl: metadata.sourceUrl,
        methodology: metadata.methodology,
        fiscalYear: metadata.fiscalYear,
    };
}

/**
 * Calculate estimated annual property tax
 */
export function calculatePropertyTax(
    marketValue: number,
    millRate: number,
    assessmentRatio: number = 70
): number {
    const assessedValue = marketValue * (assessmentRatio / 100);
    return (assessedValue * millRate) / 1000;
}

/**
 * Format currency
 */
export function formatTaxAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Example price points for tax estimates
 */
export const EXAMPLE_PRICE_POINTS = [500000, 1000000, 2000000];
