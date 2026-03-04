import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParcelData } from '../../../components/LeafletParcelMap';
import { logPerf, logPerfDuration, perfDurationMs, perfNow } from '../../../lib/perf';

const API_BASE = '/api/portal';
const MAX_CONTEXT_LISTING_MARKERS = 500;
const VIEWPORT_FETCH_PADDING = 0.2;
const VIEWPORT_FETCH_SHIFT_RATIO = 0.2;
const MIN_VIEWPORT_SHIFT_DEGREES = 0.0008;

type MapViewportBounds = [number, number, number, number];
type MapFetchMode = 'parcels' | 'listings';

type ViewportFetchState = {
  bounds: MapViewportBounds;
  zoom: number;
  mode: MapFetchMode;
};

interface MapFetchOptions {
  showLoader?: boolean;
}

interface CallToAction {
  endpoint: string;
  params: Record<string, string>;
}

interface UseMapViewportFetchOptions {
  debugLog?: (...args: unknown[]) => void;
  debugWarn?: (...args: unknown[]) => void;
}

const expandBounds = (bounds: MapViewportBounds, paddingRatio: number): MapViewportBounds => {
  const [west, south, east, north] = bounds;
  const lngPadding = (east - west) * paddingRatio;
  const latPadding = (north - south) * paddingRatio;
  return [
    west - lngPadding,
    south - latPadding,
    east + lngPadding,
    north + latPadding,
  ];
};

const hasViewportShiftedEnough = (previous: MapViewportBounds, next: MapViewportBounds): boolean => {
  const previousCenterLng = (previous[0] + previous[2]) / 2;
  const previousCenterLat = (previous[1] + previous[3]) / 2;
  const nextCenterLng = (next[0] + next[2]) / 2;
  const nextCenterLat = (next[1] + next[3]) / 2;

  const lngThreshold = Math.max(
    Math.abs(previous[2] - previous[0]) * VIEWPORT_FETCH_SHIFT_RATIO,
    MIN_VIEWPORT_SHIFT_DEGREES
  );
  const latThreshold = Math.max(
    Math.abs(previous[3] - previous[1]) * VIEWPORT_FETCH_SHIFT_RATIO,
    MIN_VIEWPORT_SHIFT_DEGREES
  );

  return (
    Math.abs(nextCenterLng - previousCenterLng) >= lngThreshold ||
    Math.abs(nextCenterLat - previousCenterLat) >= latThreshold
  );
};

const formatBoundsToBbox = (bounds: MapViewportBounds) => bounds.map((value) => value.toFixed(6)).join(',');

const convertFeatureToParcelData = (feature: any, isSearchResult: boolean = false): ParcelData => {
  const properties = feature.properties || {};
  const centroid = properties.centroid || [properties.longitude || -73.2, properties.latitude || 41.2];

  return {
    parcel_id: properties.parcel_id,
    address: properties.address_full || 'Unknown address',
    city: properties.city || '',
    state: properties.state || 'CT',
    zip_code: properties.zip_code || '',
    coordinates: { lat: centroid[1] || 41.2, lng: centroid[0] || -73.2 },
    boundary: feature.geometry,
    list_price: properties.list_price ?? null,
    listing_status: properties.status ?? null,
    highlight: Boolean(properties.highlight),
    property_type: properties.property_type ?? null,
    lot_size_acres: properties.lot_size_acres ?? null,
    updated_at: properties.updated_at ?? null,
    isSearchResult,
    property_details: {
      square_feet: properties.square_feet ?? null,
      bedrooms: properties.bedrooms ?? null,
      bathrooms: properties.bathrooms ?? null,
      acreage: properties.lot_size_acres ?? null,
      year_built: properties.year_built ?? null,
      property_type: properties.property_type ?? null,
    },
    market_data: {
      estimated_value: properties.list_price ?? null,
      last_sale_price: properties.last_sale_price ?? null,
      last_sale_date: properties.last_sale_date ?? null,
      price_per_sqft: properties.square_feet ? (properties.list_price ?? 0) / properties.square_feet : null,
    },
    zoning: {
      zone: properties.zoning ?? null,
      use_restrictions: [],
    },
  };
};

export function useMapViewportFetch({
  debugLog = () => {},
  debugWarn = () => {},
}: UseMapViewportFetchOptions) {
  const [mapParcels, setMapParcels] = useState<ParcelData[]>([]);
  const [listingMarkers, setListingMarkers] = useState<ParcelData[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  const lastFetchKeyRef = useRef<string | null>(null);
  const mapFetchAbortRef = useRef<AbortController | null>(null);
  const mapLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRequestSeqRef = useRef(0);
  const lastViewportFetchRef = useRef<ViewportFetchState | null>(null);
  const pendingViewportPerfRef = useRef<{
    startedAt: number;
    mode: MapFetchMode;
    zoom: number;
    bbox: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      mapFetchAbortRef.current?.abort();
      if (mapLoadingTimerRef.current) {
        clearTimeout(mapLoadingTimerRef.current);
      }
    };
  }, []);

  const clearMapContext = useCallback(() => {
    setMapParcels([]);
    setListingMarkers([]);
    setMapLoading(false);
    lastFetchKeyRef.current = null;
    pendingViewportPerfRef.current = null;
  }, []);

  const fetchMapFeatures = useCallback(async (callToAction: CallToAction, options?: MapFetchOptions) => {
    const fetchKey = JSON.stringify(callToAction.params);
    const showLoader = options?.showLoader ?? true;
    const fetchStartedAt = perfNow();
    let featureCount = 0;
    let listingCount = 0;
    let parcelCount = 0;

    if (fetchKey === lastFetchKeyRef.current) {
      debugLog('Skipping duplicate map request', fetchKey);
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    mapFetchAbortRef.current?.abort();

    const controller = new AbortController();
    mapFetchAbortRef.current = controller;
    const requestSeq = ++mapRequestSeqRef.current;

    if (mapLoadingTimerRef.current) {
      clearTimeout(mapLoadingTimerRef.current);
      mapLoadingTimerRef.current = null;
    }

    if (showLoader) {
      mapLoadingTimerRef.current = setTimeout(() => {
        if (requestSeq === mapRequestSeqRef.current) {
          setMapLoading(true);
        }
      }, 220);
    } else {
      setMapLoading(false);
    }

    debugLog('Fetching map features', callToAction);

    try {
      const normalizedEndpoint = callToAction.endpoint.startsWith('/')
        ? callToAction.endpoint
        : `/${callToAction.endpoint}`;
      const query = new URLSearchParams(callToAction.params).toString();
      const requestUrl = `${API_BASE}${normalizedEndpoint}${query ? `?${query}` : ''}`;

      const response = await fetch(requestUrl, { signal: controller.signal });
      if (requestSeq !== mapRequestSeqRef.current) return;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Map parcels request failed with status ${response.status}: ${errorText}`);
      }

      const geojson = await response.json();
      if (requestSeq !== mapRequestSeqRef.current) return;

      if (geojson?.features && geojson.features.length > 0) {
        featureCount = geojson.features.length;
        const converted: ParcelData[] = geojson.features.map((feature: any) =>
          convertFeatureToParcelData(feature, false)
        );

        const listings = converted.filter(
          (parcel) => parcel.listing_status && ['Active', 'Pending', 'Contingent'].includes(parcel.listing_status)
        );
        const regularParcels = converted.filter(
          (parcel) => !parcel.listing_status || !['Active', 'Pending', 'Contingent'].includes(parcel.listing_status)
        );

        const dedupedListings = Array.from(
          new Map(listings.map((listing) => [listing.parcel_id, listing])).values()
        ).slice(0, MAX_CONTEXT_LISTING_MARKERS);
        listingCount = dedupedListings.length;
        parcelCount = regularParcels.length;

        setListingMarkers(dedupedListings);
        setMapParcels(regularParcels);
      } else {
        debugWarn('No map features in response');
        setMapParcels([]);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error fetching map parcels:', error);
      setMapParcels([]);
    } finally {
      if (requestSeq === mapRequestSeqRef.current) {
        if (mapLoadingTimerRef.current) {
          clearTimeout(mapLoadingTimerRef.current);
          mapLoadingTimerRef.current = null;
        }
        setMapLoading(false);

        logPerfDuration('properties.map.fetch', perfDurationMs(fetchStartedAt), {
          endpoint: callToAction.endpoint,
          zoom: callToAction.params.zoom,
          status: callToAction.params.status,
          featureCount,
          listingCount,
          parcelCount,
          showLoader,
        });

        const pendingViewport = pendingViewportPerfRef.current;
        if (pendingViewport && pendingViewport.bbox === callToAction.params.bbox) {
          logPerfDuration('properties.map.viewport_to_render', perfDurationMs(pendingViewport.startedAt), {
            mode: pendingViewport.mode,
            zoom: pendingViewport.zoom,
            featureCount,
          });
          pendingViewportPerfRef.current = null;
        }
      }
    }
  }, [debugLog, debugWarn]);

  const handleViewportChange = useCallback((bounds: MapViewportBounds, zoom: number) => {
    const mode: MapFetchMode | null = zoom >= 15 ? 'parcels' : zoom >= 10 ? 'listings' : null;
    if (!mode) return;

    const bufferedBounds = expandBounds(bounds, VIEWPORT_FETCH_PADDING);
    const previousViewport = lastViewportFetchRef.current;

    const shouldFetchViewport =
      !previousViewport ||
      previousViewport.zoom !== zoom ||
      previousViewport.mode !== mode ||
      hasViewportShiftedEnough(previousViewport.bounds, bufferedBounds);

    if (!shouldFetchViewport) return;

    lastViewportFetchRef.current = {
      bounds: bufferedBounds,
      zoom,
      mode,
    };

    const bbox = formatBoundsToBbox(bufferedBounds);
    pendingViewportPerfRef.current = {
      startedAt: perfNow(),
      mode,
      zoom,
      bbox,
    };

    if (mode === 'parcels') {
      let limit = 120;
      if (zoom >= 18) {
        limit = 800;
      } else if (zoom >= 17) {
        limit = 350;
      }

      void fetchMapFeatures(
        {
          endpoint: '/api/map/parcels',
          params: {
            bbox,
            zoom: zoom.toString(),
            limit: limit.toString(),
            status: 'any',
          },
        },
        { showLoader: true }
      );
      return;
    }

    void fetchMapFeatures(
      {
        endpoint: '/api/map/parcels',
        params: {
          bbox,
          zoom: zoom.toString(),
          limit: '250',
          status: 'Active,Pending,Contingent',
        },
      },
      { showLoader: false }
    );
  }, [fetchMapFeatures]);

  return {
    mapParcels,
    listingMarkers,
    mapLoading,
    fetchMapFeatures,
    handleViewportChange,
    clearMapContext,
  };
}
