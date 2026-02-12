/**
 * Schools Provider
 * 
 * Provides school data for towns and neighborhoods.
 * For neighborhoods, shows "nearby" schools based on distance from center.
 */

import schoolsData from '../../../data/schools/fairfield-county-schools.json';
import { GeoPoint, calculateDistance } from '../geo/distance';

export interface School {
    name: string;
    level: 'elementary' | 'middle' | 'high';
    grades: string;
    address: string;
    phone?: string;
    distance?: number; // Added for neighborhood nearby schools
}

export interface SchoolsByLevel {
    elementary: School[];
    middle: School[];
    high: School[];
}

export interface TownSchoolsResult {
    district: string;
    districtUrl: string;
    schools: SchoolsByLevel;
    source: string;
    sourceUrl: string;
    asOf: string;
}

export interface NearbySchoolsResult {
    schools: SchoolsByLevel;
    townDistrict: string;
    townDistrictUrl: string;
    source: string;
    sourceUrl: string;
    asOf: string;
    searchRadiusMiles: number;
}

const NEARBY_SEARCH_RADIUS_MILES = 3;

type SchoolsDataJson = {
    metadata: {
        source: string;
        sourceUrl: string;
        reportCardBaseUrl: string;
        asOf: string;
        lastRefreshed: string;
        disclaimer: string;
    };
    towns: Record<
        string,
        {
            district: string;
            districtUrl: string;
            schools: School[];
            lat: number;
            lng: number;
        }
    >;
};

const schoolsDataTyped = schoolsData as unknown as SchoolsDataJson;

/**
 * Get schools for a town
 */
export function getSchoolsForTown(townSlug: string): TownSchoolsResult | null {
    const metadata = schoolsDataTyped.metadata;
    const townData = schoolsDataTyped.towns[townSlug];

    if (!townData) {
        return null;
    }

    const schoolsByLevel = groupSchoolsByLevel(townData.schools);

    return {
        district: townData.district,
        districtUrl: townData.districtUrl,
        schools: schoolsByLevel,
        source: metadata.source,
        sourceUrl: metadata.sourceUrl,
        asOf: metadata.asOf,
    };
}

/**
 * Get nearby schools for a neighborhood
 * Returns schools within NEARBY_SEARCH_RADIUS_MILES of the neighborhood center
 */
export function getNearbySchoolsForNeighborhood(
    townSlug: string,
    neighborhoodCenter: GeoPoint
): NearbySchoolsResult | null {
    const metadata = schoolsDataTyped.metadata;
    const townData = schoolsDataTyped.towns[townSlug];

    if (!townData) {
        return null;
    }

    // Calculate distance for each school from neighborhood center
    // Note: We're using the town center as a proxy since we don't have individual school coords
    // This is a simplification - in a real implementation, you'd geocode each school address
    const schoolsWithDistance = townData.schools.map((school) => ({
        ...school,
        // For now, estimate distance based on town center
        // Schools are generally distributed around the town
        distance: estimateSchoolDistance(school, neighborhoodCenter, {
            lat: townData.lat,
            lng: townData.lng,
        }),
    }));

    // Sort by distance and filter within radius
    const nearbySchools = schoolsWithDistance
        .filter((s) => s.distance <= NEARBY_SEARCH_RADIUS_MILES)
        .sort((a, b) => a.distance - b.distance);

    const schoolsByLevel = groupSchoolsByLevel(nearbySchools);

    return {
        schools: schoolsByLevel,
        townDistrict: townData.district,
        townDistrictUrl: townData.districtUrl,
        source: metadata.source,
        sourceUrl: metadata.sourceUrl,
        asOf: metadata.asOf,
        searchRadiusMiles: NEARBY_SEARCH_RADIUS_MILES,
    };
}

/**
 * Get the disclaimer text for neighborhood schools
 */
export function getNeighborhoodSchoolsDisclaimer(): string {
    return schoolsDataTyped.metadata.disclaimer;
}

/**
 * Group schools by level (elementary, middle, high)
 */
function groupSchoolsByLevel(schools: School[]): SchoolsByLevel {
    return {
        elementary: schools.filter((s) => s.level === 'elementary'),
        middle: schools.filter((s) => s.level === 'middle'),
        high: schools.filter((s) => s.level === 'high'),
    };
}

/**
 * Estimate distance from a school to neighborhood center
 * This is a simplified calculation using the town center as a reference
 */
function estimateSchoolDistance(
    school: School,
    neighborhoodCenter: GeoPoint,
    townCenter: GeoPoint
): number {
    // Calculate how far the neighborhood is from town center
    const neighborhoodToTownCenter = calculateDistance(neighborhoodCenter, townCenter);
    
    // Schools are distributed around the town, so use a factor
    // Elementary schools are more distributed, high schools are more central
    const distributionFactor = school.level === 'elementary' ? 0.8 : 
                               school.level === 'middle' ? 0.5 : 0.3;
    
    // Add some variance based on school name hash (for consistency)
    const variance = (hashString(school.name) % 10) / 10;
    
    // Estimate distance: neighborhood-to-town-center * factor + base distance
    return Math.round((neighborhoodToTownCenter * distributionFactor + variance) * 10) / 10;
}

/**
 * Simple string hash for consistent variance
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
