import { useCallback, useEffect, useState } from 'react';
import { calculateEstimatedTax } from '../../lib/ct-mill-rates';
import type { AvmData, PropertyData } from './types';

const API_BASE = '/api/portal';
const MODAL_CACHE_TTL_MS = 2 * 60 * 1000;

type ModalCacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const propertyCache = new Map<string, ModalCacheEntry<PropertyData>>();
const avmCache = new Map<string, ModalCacheEntry<AvmData>>();

const now = () => Date.now();

const readCache = <T>(cache: Map<string, ModalCacheEntry<T>>, key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const writeCache = <T>(cache: Map<string, ModalCacheEntry<T>>, key: string, data: T) => {
  cache.set(key, {
    data,
    expiresAt: now() + MODAL_CACHE_TTL_MS,
  });
};

const listingCacheKey = (listingId: number) => `listing:${listingId}`;
const parcelCacheKey = (parcelId: string) => `parcel:${parcelId}`;
const prefetchInFlight = new Map<string, Promise<void>>();

function normalizeStatus(raw: string | undefined): PropertyData['status'] {
  if (!raw) return 'Off-Market';
  const status = raw.toLowerCase();
  if (status === 'active') return 'Active';
  if (status === 'pending' || status === 'contingent') return 'Pending';
  if (status === 'sold' || status === 'closed') return 'Sold';
  return 'Off-Market';
}

function normalizeFromListing(listing: any, parcelData?: any): PropertyData {
  const parcel = listing.parcel || parcelData || {};
  const assessedTotal = parcel.assessment?.total ?? parcel.assessment_total;
  const mlsTax = listing.tax_annual_amount;
  const estimatedTax = !mlsTax
    ? calculateEstimatedTax(assessedTotal, listing.city) ?? undefined
    : undefined;

  return {
    parcelId: parcel.parcel_id || listing.parcel_id || '',
    listingId: listing.listing_id,
    status: normalizeStatus(listing.status),
    hasListing: true,
    address: listing.address_full || 'Address Not Available',
    city: listing.city || '',
    state: listing.state || 'CT',
    zipCode: listing.zip_code,
    latitude: listing.latitude || parcel.latitude,
    longitude: listing.longitude || parcel.longitude,
    listPrice: listing.list_price,
    originalListPrice: listing.original_list_price,
    soldPrice: listing.sold_price,
    soldDate: listing.sold_date,
    listDate: listing.list_date,
    daysOnMarket: listing.days_on_market,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    bathsFull: listing.baths_full,
    bathsHalf: listing.baths_half,
    squareFeet: listing.square_feet,
    lotSizeAcres: listing.acres,
    yearBuilt: listing.year_built,
    stories: listing.stories,
    garageSpaces: listing.garage_spaces,
    totalRooms: parcel.total_rooms,
    condition: parcel.condition,
    effectiveArea: parcel.effective_area,
    propertyType: listing.property_type,
    style: listing.style,
    subdivision: listing.subdivision || parcelData?.neighborhood_name || undefined,
    photos: listing.photos || [],
    virtualTourUrl: listing.virtual_tour_url,
    publicRemarks: listing.public_remarks,
    interiorFeatures: listing.interior_features,
    exteriorFeatures: listing.exterior_features,
    construction: listing.construction,
    heating: listing.heating,
    cooling: listing.cooling,
    flooring: listing.flooring,
    roof: listing.roof,
    foundation: listing.foundation,
    pool: listing.pool,
    view: listing.view,
    water: listing.water,
    fireplaces: listing.fireplaces,
    parkingSpaces: listing.parking_spaces,
    parkingDescription: listing.parking_description,
    schoolElementary: listing.school_elementary,
    schoolMiddle: listing.school_middle,
    schoolHigh: listing.school_high,
    schoolDistrict: listing.school_district,
    hoaFee: listing.hoa_fee,
    hoaFrequency: listing.hoa_frequency,
    hoaName: listing.hoa_name,
    assessmentTotal: parcel.assessment?.total ?? parcel.assessment_total,
    assessmentLand: parcel.assessment?.land ?? parcel.assessment_land,
    assessmentBuilding: parcel.assessment?.building ?? parcel.assessment_building,
    appraisedTotal: parcel.appraisal?.total ?? parcel.appraised_total,
    appraisedLand: parcel.appraisal?.land ?? parcel.appraised_land,
    appraisedBuilding: parcel.appraisal?.building ?? parcel.appraised_building,
    taxAnnualAmount: mlsTax,
    estimatedTaxAnnual: estimatedTax,
    taxSource: mlsTax ? 'mls' : estimatedTax ? 'mill-rate' : undefined,
    zoning: parcel.zoning,
    landUse: parcel.land_use,
    lastSalePrice: parcel.sales_history?.[0]?.price ?? parcel.last_sale_price,
    lastSaleDate: parcel.sales_history?.[0]?.date ?? parcel.last_sale_date,
    priorSalePrice: parcel.sales_history?.[1]?.price ?? parcel.prior_sale_price,
    priorSaleDate: parcel.sales_history?.[1]?.date ?? parcel.prior_sale_date,
    agent: listing.agent
      ? {
          name: `${listing.agent.first_name || ''} ${listing.agent.last_name || ''}`.trim(),
          email: listing.agent.email,
          phone: listing.agent.cell_phone || listing.agent.office_phone,
        }
      : undefined,
    office: listing.office
      ? {
          name: listing.office.name,
          email: listing.office.email,
          phone: listing.office.office_phone,
        }
      : undefined,
  };
}

function normalizeFromParcel(parcelApiData: any, listingData?: any): PropertyData {
  const addr = parcelApiData.address || {};
  const parcel = parcelApiData.parcel || {};
  const location = parcelApiData.location || {};
  const assessedTotal = parcel.assessment?.total;
  const cityName = addr.city || '';
  const estimatedTax = calculateEstimatedTax(assessedTotal, cityName) ?? undefined;

  const base: PropertyData = {
    parcelId: parcelApiData.parcel_id,
    status: 'Off-Market',
    hasListing: false,
    address: addr.full || 'Address Not Available',
    city: cityName,
    state: addr.state || 'CT',
    zipCode: addr.zip,
    latitude: location.centroid?.[1],
    longitude: location.centroid?.[0],
    bedrooms: parcel.bedrooms,
    bathrooms: parcel.bathrooms,
    bathsFull: parcel.baths_full,
    bathsHalf: parcel.baths_half,
    squareFeet: parcel.square_feet,
    lotSizeAcres: location.lot_size_acres,
    yearBuilt: parcel.year_built,
    totalRooms: parcel.total_rooms,
    condition: parcel.condition,
    effectiveArea: parcel.effective_area,
    propertyType: parcel.property_type,
    subdivision: parcelApiData.neighborhood_name || undefined,
    photos: [],
    assessmentTotal: assessedTotal,
    assessmentLand: parcel.assessment?.land,
    assessmentBuilding: parcel.assessment?.building,
    appraisedTotal: parcel.appraisal?.total,
    appraisedLand: parcel.appraisal?.land,
    appraisedBuilding: parcel.appraisal?.building,
    estimatedTaxAnnual: estimatedTax,
    taxSource: estimatedTax ? 'mill-rate' : undefined,
    zoning: location.zoning,
    landUse: location.land_use,
    lastSalePrice: parcel.sales_history?.[0]?.price,
    lastSaleDate: parcel.sales_history?.[0]?.date,
    priorSalePrice: parcel.sales_history?.[1]?.price,
    priorSaleDate: parcel.sales_history?.[1]?.date,
  };

  if (!listingData) return base;

  return {
    ...base,
    listingId: listingData.listing_id,
    status: normalizeStatus(listingData.status),
    hasListing: true,
    listPrice: listingData.list_price,
    originalListPrice: listingData.original_list_price,
    soldPrice: listingData.sold_price,
    soldDate: listingData.sold_date,
    listDate: listingData.list_date,
    daysOnMarket: listingData.days_on_market,
    photos: listingData.photos || [],
    virtualTourUrl: listingData.virtual_tour_url,
    publicRemarks: listingData.public_remarks,
    interiorFeatures: listingData.interior_features,
    exteriorFeatures: listingData.exterior_features,
    construction: listingData.construction,
    heating: listingData.heating,
    cooling: listingData.cooling,
    flooring: listingData.flooring,
    roof: listingData.roof,
    foundation: listingData.foundation,
    pool: listingData.pool,
    view: listingData.view,
    water: listingData.water,
    fireplaces: listingData.fireplaces,
    parkingSpaces: listingData.parking_spaces,
    parkingDescription: listingData.parking_description,
    schoolElementary: listingData.school_elementary,
    schoolMiddle: listingData.school_middle,
    schoolHigh: listingData.school_high,
    schoolDistrict: listingData.school_district,
    hoaFee: listingData.hoa_fee,
    hoaFrequency: listingData.hoa_frequency,
    hoaName: listingData.hoa_name,
    taxAnnualAmount: listingData.tax_annual_amount,
    estimatedTaxAnnual: listingData.tax_annual_amount ? undefined : estimatedTax,
    taxSource: listingData.tax_annual_amount ? 'mls' : estimatedTax ? 'mill-rate' : undefined,
    style: listingData.style,
    subdivision: listingData.subdivision || parcelApiData.neighborhood_name || undefined,
    stories: listingData.stories,
    garageSpaces: listingData.garage_spaces,
    agent: listingData.agent
      ? {
          name: `${listingData.agent.first_name || ''} ${listingData.agent.last_name || ''}`.trim(),
          email: listingData.agent.email,
          phone: listingData.agent.cell_phone || listingData.agent.office_phone,
        }
      : undefined,
    office: listingData.office
      ? {
          name: listingData.office.name,
          email: listingData.office.email,
          phone: listingData.office.office_phone,
        }
      : undefined,
  };
}

interface UsePropertyModalDataOptions {
  listingId?: number;
  parcelId?: string;
  isOpen: boolean;
}

interface PrefetchPropertyModalDataOptions {
  listingId?: number | null;
  parcelId?: string | null;
}

export async function prefetchPropertyModalData({
  listingId,
  parcelId,
}: PrefetchPropertyModalDataOptions) {
  const key = listingId ? listingCacheKey(listingId) : parcelId ? parcelCacheKey(parcelId) : null;
  if (!key) return;
  if (readCache(propertyCache, key)) return;
  if (prefetchInFlight.has(key)) {
    await prefetchInFlight.get(key);
    return;
  }

  const prefetchTask = (async () => {
    try {
      if (listingId) {
        const res = await fetch(`${API_BASE}/listings/${listingId}`);
        if (!res.ok) return;

        const listingData = await res.json();
        const normalized = normalizeFromListing(listingData);

        writeCache(propertyCache, listingCacheKey(listingId), normalized);
        if (normalized.parcelId) {
          writeCache(propertyCache, parcelCacheKey(normalized.parcelId), normalized);
        }
        return;
      }

      if (!parcelId) return;
      const pKey = parcelCacheKey(parcelId);
      const encodedParcelId = encodeURIComponent(parcelId);
      const parcelRes = await fetch(`${API_BASE}/api/map/parcels/${encodedParcelId}`);
      if (!parcelRes.ok) return;

      const parcelApiData = await parcelRes.json();
      const normalizedParcel = normalizeFromParcel(parcelApiData);
      writeCache(propertyCache, pKey, normalizedParcel);

      const listingRes = await fetch(`${API_BASE}/listings/by-parcel/${encodedParcelId}`);
      if (!listingRes.ok) return;
      const listingResult = await listingRes.json();
      const listings = listingResult.listings || [];
      const active = listings.find((listing: any) => listing.status === 'Active');
      if (!active?.listing_id) return;

      const fullRes = await fetch(`${API_BASE}/listings/${active.listing_id}`);
      if (!fullRes.ok) return;
      const listingData = await fullRes.json();
      const normalizedWithListing = normalizeFromParcel(parcelApiData, listingData);
      writeCache(propertyCache, pKey, normalizedWithListing);
      writeCache(propertyCache, listingCacheKey(active.listing_id), normalizedWithListing);
    } catch {
      // Best-effort prefetch only.
    } finally {
      prefetchInFlight.delete(key);
    }
  })();

  prefetchInFlight.set(key, prefetchTask);
  await prefetchTask;
}

export function usePropertyModalData({ listingId, parcelId, isOpen }: UsePropertyModalDataOptions) {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avmData, setAvmData] = useState<AvmData | null>(null);
  const [avmLoading, setAvmLoading] = useState(false);

  const fetchAvm = useCallback(async (pid: string, signal?: AbortSignal) => {
    const cached = readCache(avmCache, pid);
    if (cached) {
      setAvmData(cached);
      return;
    }

    setAvmLoading(true);
    try {
      const encoded = encodeURIComponent(pid);
      const res = await fetch(`${API_BASE}/api/avm/estimate/${encoded}`, { signal });
      if (!res.ok) {
        setAvmData(null);
        return;
      }
      const payload = (await res.json()) as AvmData;
      writeCache(avmCache, pid, payload);
      setAvmData(payload);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setAvmData(null);
    } finally {
      setAvmLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!listingId && !parcelId) return;

    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (listingId) {
          const lKey = listingCacheKey(listingId);
          const cachedListing = readCache(propertyCache, lKey);
          if (cachedListing) {
            setProperty(cachedListing);
            setLoading(false);
            if (cachedListing.parcelId) {
              void fetchAvm(cachedListing.parcelId, signal);
            }
            return;
          }

          const listingRes = await fetch(`${API_BASE}/listings/${listingId}`, { signal });
          if (!listingRes.ok) throw new Error('Failed to fetch listing');

          const listingData = await listingRes.json();
          if (signal.aborted) return;

          const normalized = normalizeFromListing(listingData);
          if (signal.aborted) return;

          writeCache(propertyCache, lKey, normalized);
          writeCache(propertyCache, parcelCacheKey(normalized.parcelId), normalized);
          setProperty(normalized);
          setLoading(false);

          if (normalized.parcelId && !signal.aborted) {
            void fetchAvm(normalized.parcelId, signal);
          }
          return;
        }

        if (!parcelId) return;

        const pKey = parcelCacheKey(parcelId);
        const cachedParcel = readCache(propertyCache, pKey);
        if (cachedParcel) {
          setProperty(cachedParcel);
          setLoading(false);
          void fetchAvm(parcelId, signal);
          return;
        }

        const encodedParcelId = encodeURIComponent(parcelId);
        const parcelRes = await fetch(`${API_BASE}/api/map/parcels/${encodedParcelId}`, { signal });
        if (!parcelRes.ok) throw new Error('Failed to fetch parcel details');

        const parcelApiData = await parcelRes.json();
        if (signal.aborted) return;

        const normalizedParcel = normalizeFromParcel(parcelApiData);
        if (signal.aborted) return;

        writeCache(propertyCache, pKey, normalizedParcel);
        setProperty(normalizedParcel);
        setLoading(false);
        void fetchAvm(parcelId, signal);

        void (async () => {
          try {
            const listingRes = await fetch(`${API_BASE}/listings/by-parcel/${encodedParcelId}`, { signal });
            if (!listingRes.ok || signal.aborted) return;

            const listingResult = await listingRes.json();
            if (signal.aborted) return;

            const listings = listingResult.listings || [];
            const active = listings.find((listing: any) => listing.status === 'Active');
            if (!active) return;

            const fullRes = await fetch(`${API_BASE}/listings/${active.listing_id}`, { signal });
            if (!fullRes.ok || signal.aborted) return;

            const listingData = await fullRes.json();
            if (signal.aborted) return;

            const normalizedWithListing = normalizeFromParcel(parcelApiData, listingData);
            writeCache(propertyCache, pKey, normalizedWithListing);
            writeCache(propertyCache, listingCacheKey(active.listing_id), normalizedWithListing);
            setProperty(normalizedWithListing);
          } catch (err: any) {
            if (err?.name === 'AbortError') return;
          }
        })();
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
        setLoading(false);
      }
    };

    void fetchData();
    return () => {
      controller.abort();
    };
  }, [listingId, parcelId, isOpen, fetchAvm]);

  return {
    property,
    loading,
    error,
    avmData,
    avmLoading,
  };
}
