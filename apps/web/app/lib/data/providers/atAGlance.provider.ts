/**
 * At a Glance Provider
 * 
 * Provides ACS demographic data for towns.
 * Data is loaded from a static JSON file (no API calls needed).
 */

import acsData from '../../../data/acs/fairfield-county-towns.json';

export interface AgeGroups {
    under18: number;
    age18to24: number;
    age25to44: number;
    age45to64: number;
    age65plus: number;
}

export interface EducationLevels {
    lessHighSchool: number;
    highSchool: number;
    someCollege: number;
    bachelors: number;
    graduate: number;
}

export interface AtAGlanceData {
    population: number;
    medianAge: number;
    medianHouseholdIncome: number;
    incomeNote?: string;
    perCapitaIncome?: number;
    ownerOccupiedPercent: number;
    medianYearBuilt: number;
    totalHousingUnits?: number;
    medianHomeValue?: number;
    homeValueNote?: string;
    // New demographic fields
    landAreaSqMi?: number;
    populationDensity?: number;
    densityLabel?: 'LOW' | 'MODERATE' | 'HIGH';
    malePercent?: number;
    femalePercent?: number;
    ageGroups?: AgeGroups;
    education?: EducationLevels;
}

export interface AtAGlanceResult {
    data: AtAGlanceData | null;
    source: string;
    sourceUrl: string;
    asOf: string;
    methodology: string;
}

type TownDataKey = keyof typeof acsData.towns;

interface TownDataRaw {
    name: string;
    population: number;
    medianAge: number;
    medianHouseholdIncome: number;
    incomeNote?: string;
    perCapitaIncome?: number;
    ownerOccupiedPercent: number;
    medianYearBuilt: number;
    totalHousingUnits: number;
    medianHomeValue?: number;
    homeValueNote?: string;
    landAreaSqMi?: number;
    populationDensity?: number;
    densityLabel?: string;
    malePercent?: number;
    femalePercent?: number;
    ageGroups?: AgeGroups;
    education?: EducationLevels;
}

/**
 * Get At a Glance data for a town
 */
export function getAtAGlanceForTown(townSlug: string): AtAGlanceResult {
    const metadata = acsData.metadata;
    const townData = acsData.towns[townSlug as TownDataKey] as TownDataRaw | undefined;

    if (!townData) {
        return {
            data: null,
            source: metadata.source,
            sourceUrl: metadata.sourceUrl,
            asOf: metadata.asOf,
            methodology: metadata.methodology,
        };
    }

    return {
        data: {
            population: townData.population,
            medianAge: townData.medianAge,
            medianHouseholdIncome: townData.medianHouseholdIncome,
            incomeNote: townData.incomeNote,
            perCapitaIncome: townData.perCapitaIncome,
            ownerOccupiedPercent: townData.ownerOccupiedPercent,
            medianYearBuilt: townData.medianYearBuilt,
            totalHousingUnits: townData.totalHousingUnits,
            medianHomeValue: townData.medianHomeValue,
            homeValueNote: townData.homeValueNote,
            landAreaSqMi: townData.landAreaSqMi,
            populationDensity: townData.populationDensity,
            densityLabel: townData.densityLabel as 'LOW' | 'MODERATE' | 'HIGH' | undefined,
            malePercent: townData.malePercent,
            femalePercent: townData.femalePercent,
            ageGroups: townData.ageGroups,
            education: townData.education,
        },
        source: metadata.source,
        sourceUrl: metadata.sourceUrl,
        asOf: metadata.asOf,
        methodology: metadata.methodology,
    };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, note?: string): string {
    if (note) {
        return note;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}
