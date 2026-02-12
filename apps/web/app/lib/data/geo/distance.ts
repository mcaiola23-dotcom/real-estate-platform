/**
 * Geographic distance utilities
 * 
 * Used for calculating distances between coordinates
 * for "nearby" schools, POIs, etc.
 */

export interface GeoPoint {
    lat: number;
    lng: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) *
        Math.cos(toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Filter items by distance from a center point
 */
export function filterByDistance<T extends { lat?: number; lng?: number }>(
    items: T[],
    center: GeoPoint,
    maxDistanceMiles: number
): (T & { distance: number })[] {
    return items
        .filter((item) => item.lat !== undefined && item.lng !== undefined)
        .map((item) => ({
            ...item,
            distance: calculateDistance(center, { lat: item.lat!, lng: item.lng! }),
        }))
        .filter((item) => item.distance <= maxDistanceMiles)
        .sort((a, b) => a.distance - b.distance);
}

/**
 * Get items within radius, sorted by distance
 */
export function getNearbyItems<T extends { lat?: number; lng?: number }>(
    items: T[],
    center: GeoPoint,
    maxDistanceMiles: number,
    limit?: number
): (T & { distance: number })[] {
    const filtered = filterByDistance(items, center, maxDistanceMiles);
    return limit ? filtered.slice(0, limit) : filtered;
}
