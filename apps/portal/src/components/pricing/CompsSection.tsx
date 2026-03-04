'use client';

import { useState, useEffect } from 'react';
import CompCard from './CompCard';
import { TrendingUp, Home } from 'lucide-react';

const API_BASE = '/api/portal';

interface CompProperty {
  listing_id?: number | null;
  parcel_id?: string | null;
  photo_url?: string | null;
  address: string;
  city: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  price: number;
  price_per_sqft?: number | null;
  date: string;
  days_on_market?: number | null;
  match_score: number;
  distance_miles: number;
  property_type?: string | null;
}

interface CompsSectionProps {
  propertyId: string;
  onPropertyClick?: (listingId: number | string) => void;
}

export default function CompsSection({ propertyId, onPropertyClick }: CompsSectionProps) {
  const [soldComps, setSoldComps] = useState<CompProperty[]>([]);
  const [activeComps, setActiveComps] = useState<CompProperty[]>([]);
  const [soldLoading, setSoldLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(true);
  const [soldError, setSoldError] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;

    const fetchSoldComps = async () => {
      setSoldLoading(true);
      setSoldError(null);
      try {
        const response = await fetch(`${API_BASE}/api/properties/${propertyId}/comps-sold`);
        if (response.ok) {
          setSoldComps(await response.json());
        } else {
          const error = await response.json();
          setSoldError(error.detail || 'Failed to load sold comps');
        }
      } catch {
        setSoldError('Failed to load sold comps');
      } finally {
        setSoldLoading(false);
      }
    };

    const fetchActiveComps = async () => {
      setActiveLoading(true);
      setActiveError(null);
      try {
        const response = await fetch(`${API_BASE}/api/properties/${propertyId}/comps-active`);
        if (response.ok) {
          setActiveComps(await response.json());
        } else {
          const error = await response.json();
          setActiveError(error.detail || 'Failed to load active comps');
        }
      } catch {
        setActiveError('Failed to load active comps');
      } finally {
        setActiveLoading(false);
      }
    };

    fetchSoldComps();
    fetchActiveComps();
  }, [propertyId]);

  const handleCompClick = (comp: CompProperty) => {
    if (onPropertyClick) {
      const id = comp.listing_id || comp.parcel_id;
      if (id) onPropertyClick(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Sold Comps */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-stone-600" />
          <h3 className="text-lg font-semibold text-stone-900">Recently Sold</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Showing comps within 3 miles or in the same city
        </p>

        {soldLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700" />
          </div>
        ) : soldError ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
            <Home className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-500">No comparable sold properties available</p>
          </div>
        ) : soldComps.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
            <Home className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No recent sales nearby</p>
            <p className="text-sm text-stone-400 mt-1">Try expanding search radius or check back later</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldComps.map((comp, index) => (
                <CompCard
                  key={`sold-${comp.listing_id || comp.parcel_id || index}`}
                  {...comp}
                  type="sold"
                  onClick={() => handleCompClick(comp)}
                />
              ))}
            </div>
            {soldComps.length < 3 && (
              <div className="mt-4 text-sm text-stone-400 italic">
                Limited comparable sales in this area
              </div>
            )}
          </>
        )}
      </div>

      {/* Active Listings */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Home className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-stone-900">Active Listings</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Showing comps within 3 miles or in the same city
        </p>

        {activeLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-teal-700" />
          </div>
        ) : activeError ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
            <Home className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-500">No comparable active listings available</p>
          </div>
        ) : activeComps.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
            <Home className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No active listings nearby</p>
            <p className="text-sm text-stone-400 mt-1">Limited active listings in this area</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeComps.map((comp, index) => (
                <CompCard
                  key={`active-${comp.listing_id || comp.parcel_id || index}`}
                  {...comp}
                  type="active"
                  onClick={() => handleCompClick(comp)}
                />
              ))}
            </div>
            {activeComps.length < 3 && (
              <div className="mt-4 text-sm text-stone-400 italic">
                Limited active listings in this area
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
