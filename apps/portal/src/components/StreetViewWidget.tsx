/**
 * StreetViewWidget - Google Street View image component
 *
 * Displays Google Street View imagery for a property.
 * - Only fetches when component is rendered (on-demand)
 * - Caches results in backend database
 * - Falls back to placeholder if Street View unavailable
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const API_BASE = '/api/portal';
const debugLog = (..._args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(..._args);
  }
};

interface StreetViewWidgetProps {
  parcelId: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fallbackSrc?: string;
  onAvailabilityChange?: (available: boolean) => void;
}

interface StreetViewData {
  available: boolean;
  imageUrl: string | null;
  thumbnailUrl?: string | null;
  parcelId: string;
  location?: { lat: number; lng: number };
  cached?: boolean;
}

export const StreetViewWidget: React.FC<StreetViewWidgetProps> = ({
  parcelId,
  width = '100%',
  height = 400,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=500&fit=crop',
  onAvailabilityChange,
}) => {
  const [data, setData] = useState<StreetViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreetView = async () => {
      if (!parcelId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const encodedParcelId = encodeURIComponent(parcelId);
        const response = await fetch(
          `${API_BASE}/api/properties/${encodedParcelId}/street-view`
        );

        if (!response.ok) {
          let detail = `Failed to fetch Street View (${response.status})`;
          try {
            const errorPayload = await response.json();
            if (typeof errorPayload?.detail === 'string' && errorPayload.detail.trim()) {
              detail = errorPayload.detail;
            }
          } catch {
            // ignore JSON parsing errors
          }
          throw new Error(detail);
        }

        const result: StreetViewData = await response.json();
        setData(result);

        if (onAvailabilityChange) {
          onAvailabilityChange(result.available);
        }

        if (!result.cached) {
          debugLog(
            `[StreetView] API CALL for parcel ${parcelId} - ${result.available ? 'Available' : 'Not available'}`
          );
        } else {
          debugLog(`[StreetView] Cached result for parcel ${parcelId}`);
        }
      } catch (err: any) {
        console.error('[StreetViewWidget] Error:', err);
        setError(err.message);
        if (onAvailabilityChange) {
          onAvailabilityChange(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStreetView();
  }, [parcelId, onAvailabilityChange]);

  if (loading) {
    return (
      <div
        className={`bg-stone-100 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700 mb-2" />
          <p className="text-stone-500 text-sm">Loading Street View...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.available || !data.imageUrl) {
    return (
      <div className="relative" style={{ width, height }}>
        <Image
          src={fallbackSrc!}
          alt="Property placeholder"
          className={className}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {!error && data && !data.available && (
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full">
            Street View unavailable
          </div>
        )}
        {error && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-600/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full">
            {error.includes('GOOGLE_MAPS_API_KEY')
              ? 'Street View unavailable: API key not configured'
              : error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <Image
        src={data.imageUrl!}
        alt="Street View"
        className={className}
        fill
        style={{ objectFit: 'cover' }}
        sizes="(max-width: 768px) 100vw, 800px"
      />
      <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path
            fillRule="evenodd"
            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
            clipRule="evenodd"
          />
        </svg>
        Street View
      </div>
    </div>
  );
};
