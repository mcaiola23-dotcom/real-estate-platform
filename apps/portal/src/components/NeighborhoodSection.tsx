'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Trees, BarChart3, Footprints, CloudRain } from 'lucide-react';

const API_BASE = '/api/portal';

interface NeighborhoodInfo {
  id: number;
  name: string;
  city: string;
  active_listing_count?: number;
  property_count?: number;
  avg_price?: number | null;
  parcel_count?: number;
}

interface NeighborhoodSectionProps {
  listingId?: number;
  parcelId?: string;
  city: string;
  state: string;
  neighborhood?: string;
}

function formatPrice(value: number | null | undefined): string {
  if (!value) return '\u2014';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString()}`;
}

export default function NeighborhoodSection({ city, state, neighborhood }: NeighborhoodSectionProps) {
  const [neighborhoodInfo, setNeighborhoodInfo] = useState<NeighborhoodInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      try {
        const listRes = await fetch(
          `${API_BASE}/api/neighborhoods/list?cities=${encodeURIComponent(city)}`
        );
        if (!listRes.ok) throw new Error('Failed to fetch neighborhoods');
        const listData = await listRes.json();
        const neighborhoods = listData.neighborhoods || [];

        let matched: NeighborhoodInfo | null = null;

        if (neighborhood && neighborhoods.length > 0) {
          const normalizedName = neighborhood.toLowerCase().trim();
          const found = neighborhoods.find(
            (n: any) => n.name.toLowerCase().trim() === normalizedName
          );
          if (found) {
            matched = {
              id: found.id,
              name: found.name,
              city: found.city || city,
              parcel_count: found.parcel_count,
            };
          }
        }

        if (!matched && neighborhood) {
          const slug = neighborhood
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          try {
            const slugRes = await fetch(`${API_BASE}/api/neighborhoods/by-slug/${slug}`);
            if (slugRes.ok) {
              const slugData = await slugRes.json();
              if (slugData.neighborhood_id) {
                matched = {
                  id: slugData.neighborhood_id,
                  name: slugData.name || neighborhood,
                  city: slugData.town_name || city,
                  active_listing_count: slugData.active_listing_count,
                  property_count: slugData.property_count,
                  avg_price: slugData.avg_price,
                };
              }
            }
          } catch {
            // slug lookup not critical
          }
        }

        if (!matched && neighborhoods.length === 1) {
          const n = neighborhoods[0];
          matched = {
            id: n.id,
            name: n.name,
            city: n.city || city,
            parcel_count: n.parcel_count,
          };
        }

        if (matched) setNeighborhoodInfo(matched);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city, neighborhood]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 animate-pulse">
          <div className="h-4 w-32 bg-stone-200 rounded mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 w-16 bg-stone-200 rounded mb-2" />
                <div className="h-5 w-20 bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 text-center">
        <p className="text-sm text-stone-500">Neighborhood data is not available at this time.</p>
      </div>
    );
  }

  const displayName = neighborhoodInfo?.name || neighborhood || city;

  return (
    <div className="space-y-5">
      {/* Header + Quick Stats */}
      <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg border border-stone-200">
            <MapPin size={16} className="text-stone-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-stone-900">{displayName}</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {city}, {state}
            </p>
          </div>
        </div>

        {neighborhoodInfo && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200">
            {neighborhoodInfo.active_listing_count != null && (
              <div>
                <p className="text-xs text-stone-500">Active Listings</p>
                <p className="text-base font-bold text-stone-900">
                  {neighborhoodInfo.active_listing_count}
                </p>
              </div>
            )}
            {neighborhoodInfo.avg_price != null && (
              <div>
                <p className="text-xs text-stone-500">Avg Price</p>
                <p className="text-base font-bold text-stone-900">
                  {formatPrice(neighborhoodInfo.avg_price)}
                </p>
              </div>
            )}
            {(neighborhoodInfo.property_count != null ||
              neighborhoodInfo.parcel_count != null) && (
              <div>
                <p className="text-xs text-stone-500">Properties</p>
                <p className="text-base font-bold text-stone-900">
                  {neighborhoodInfo.property_count ?? neighborhoodInfo.parcel_count}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Walk Score */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <Footprints size={14} className="text-stone-400" />
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Walk Score
          </h4>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-stone-200 text-[10px] font-medium text-stone-500">
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-[3px] border-stone-200 flex items-center justify-center mb-1">
              <span className="text-sm font-bold text-stone-300">&mdash;</span>
            </div>
            <p className="text-[10px] text-stone-400">Walk</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-[3px] border-stone-200 flex items-center justify-center mb-1">
              <span className="text-sm font-bold text-stone-300">&mdash;</span>
            </div>
            <p className="text-[10px] text-stone-400">Transit</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-[3px] border-stone-200 flex items-center justify-center mb-1">
              <span className="text-sm font-bold text-stone-300">&mdash;</span>
            </div>
            <p className="text-[10px] text-stone-400">Bike</p>
          </div>
        </div>
      </div>

      {/* Climate Risk */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <CloudRain size={14} className="text-stone-400" />
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Climate & Environmental Risk
          </h4>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-stone-200 text-[10px] font-medium text-stone-500">
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['Flood', 'Fire', 'Heat', 'Wind'].map((risk) => (
            <div key={risk} className="text-center">
              <div className="h-2 w-full rounded-full bg-stone-200 mb-1.5" />
              <p className="text-[10px] text-stone-400">{risk}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-stone-400 mt-2">
          Environmental risk assessment for this property
        </p>
      </div>

      {/* Other Coming Soon */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-stone-400" />
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Demographics
            </h4>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-stone-200 text-[10px] font-medium text-stone-500">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-stone-400">
            Population, median income, education, home ownership
          </p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <Trees size={14} className="text-stone-400" />
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Nearby Amenities
            </h4>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-stone-200 text-[10px] font-medium text-stone-500">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-stone-400">Restaurants, parks, shopping, schools nearby</p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-stone-400" />
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Safety & Crime
            </h4>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-stone-200 text-[10px] font-medium text-stone-500">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-stone-400">Crime statistics, safety index, trends</p>
        </div>
      </div>
    </div>
  );
}
