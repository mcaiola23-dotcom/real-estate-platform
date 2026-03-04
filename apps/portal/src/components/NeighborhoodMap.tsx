'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const API_BASE = '/api/portal';

interface NeighborhoodMapProps {
  latitude: number;
  longitude: number;
  parcelId: string;
  address?: string;
  neighborhood?: string;
  onPropertyClick?: (parcelId: string, listingId?: number) => void;
}

interface ParcelFeature {
  type: 'Feature';
  id: string;
  geometry: any;
  properties: {
    parcel_id: string;
    address_full?: string;
    city?: string;
    list_price?: number;
    status?: string;
    lot_size_acres?: number;
    listing_id?: number;
  };
}

interface AVMEstimate {
  parcel_id: string;
  estimated_value: number;
}

// Dynamic import for the inner map — Leaflet needs `window`
const NeighborhoodMapInner = dynamic(() => import('./NeighborhoodMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[4/3] max-h-[500px] bg-stone-200 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-500 mb-2" />
        <p className="text-xs text-stone-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function NeighborhoodMap({ latitude, longitude, parcelId, address, neighborhood, onPropertyClick }: NeighborhoodMapProps) {
  const [parcels, setParcels] = useState<ParcelFeature[]>([]);
  const [avmPrices, setAvmPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownParcelIds = useRef<Set<string>>(new Set());

  const fetchParcelsForBbox = useCallback(async (bbox: string, zoom: number, isInitial = false) => {
    try {
      const parcelRes = await fetch(`${API_BASE}/api/map/parcels?bbox=${bbox}&zoom=${zoom}&limit=80`);
      if (!parcelRes.ok) throw new Error('Failed to fetch parcels');
      const parcelData = await parcelRes.json();
      const features: ParcelFeature[] = parcelData.features || [];

      // Track new parcels
      const newFeatures = features.filter((f) => !knownParcelIds.current.has(f.properties.parcel_id));
      for (const f of features) {
        knownParcelIds.current.add(f.properties.parcel_id);
      }

      if (isInitial) {
        setParcels(features);
      } else if (newFeatures.length > 0) {
        setParcels((prev) => [...prev, ...newFeatures]);
      }

      // Batch AVM for new parcels without listing price
      const parcelIdsWithoutPrice = (isInitial ? features : newFeatures)
        .filter((f) => !f.properties.list_price)
        .map((f) => f.properties.parcel_id)
        .slice(0, 100);

      if (parcelIdsWithoutPrice.length > 0) {
        try {
          const avmRes = await fetch(`${API_BASE}/api/avm/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parcel_ids: parcelIdsWithoutPrice }),
          });
          if (avmRes.ok) {
            const avmData = await avmRes.json();
            if (avmData.avms && typeof avmData.avms === 'object') {
              const newPrices: Record<string, number> = {};
              for (const [pid, estimate] of Object.entries(avmData.avms)) {
                const est = estimate as { estimated_value?: number };
                if (est.estimated_value != null && est.estimated_value > 0) {
                  newPrices[pid] = est.estimated_value;
                }
              }
              setAvmPrices((prev) => ({ ...prev, ...newPrices }));
            }
          }
        } catch {
          // AVM not critical
        }
      }
    } catch {
      if (isInitial) setError(true);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const delta = 0.003;
    const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
    fetchParcelsForBbox(bbox, 18, true);
  }, [latitude, longitude, fetchParcelsForBbox]);

  // Handle map pan/zoom — debounced
  const handleBoundsChange = useCallback((bbox: string, zoom: number) => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchParcelsForBbox(bbox, zoom, false);
    }, 500);
  }, [fetchParcelsForBbox]);

  if (error) {
    return (
      <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 text-center">
        <p className="text-sm text-stone-500">Neighborhood map is not available.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {neighborhood ? `Neighborhood Map: ${neighborhood}` : 'Neighborhood Map'}
      </h3>
      <div className="rounded-xl overflow-hidden border border-stone-200">
        {loading ? (
          <div className="w-full aspect-[4/3] max-h-[500px] bg-stone-200 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-500 mb-2" />
              <p className="text-xs text-stone-500">Loading neighborhood...</p>
            </div>
          </div>
        ) : (
          <NeighborhoodMapInner
            latitude={latitude}
            longitude={longitude}
            subjectParcelId={parcelId}
            parcels={parcels}
            avmPrices={avmPrices}
            onBoundsChange={handleBoundsChange}
            onPropertyClick={onPropertyClick}
          />
        )}
      </div>
      {address && (
        <p className="text-[0.65rem] text-stone-400 mt-1.5">
          Showing properties near {address}. Prices shown are AVM estimates or listing prices.
        </p>
      )}
    </div>
  );
}
