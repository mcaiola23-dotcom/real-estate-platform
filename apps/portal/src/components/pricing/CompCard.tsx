'use client';

import { MapPin, Home, Award } from 'lucide-react';
import Image from 'next/image';

interface CompCardProps {
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
  date: string;  // sale_date or list_date
  days_on_market?: number | null;
  match_score: number;
  distance_miles: number;
  type: 'sold' | 'active';  // sold or active listing
  onClick?: () => void;
}

export default function CompCard({
  photo_url,
  address,
  city,
  bedrooms,
  bathrooms,
  square_feet,
  price,
  price_per_sqft,
  date,
  days_on_market,
  match_score,
  distance_miles,
  type,
  onClick
}: CompCardProps) {
  const formatPrice = (p: number) => {
    if (p >= 1000000) {
      return `$${(p / 1000000).toFixed(2)}M`;
    } else if (p >= 1000) {
      return `$${(p / 1000).toFixed(0)}K`;
    }
    return `$${p.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isBestMatch = match_score >= 90;
  const isNewListing = type === 'active' && days_on_market != null && days_on_market < 7;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border-2 overflow-hidden
        hover:shadow-lg transition-all duration-200 cursor-pointer
        ${type === 'sold' ? 'border-stone-300 hover:border-stone-400' : 'border-emerald-300 hover:border-emerald-400'}
      `}
    >
      {/* Image */}
      <div className="relative w-full h-40 bg-stone-200">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={address}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <Home className="w-12 h-12 text-stone-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isBestMatch && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Award className="w-3 h-3" />
              Best Match
            </span>
          )}
          {isNewListing && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              New Listing
            </span>
          )}
        </div>

        {/* Type indicator */}
        <div className="absolute top-2 right-2">
          <span className={`
            text-xs font-bold px-2 py-1 rounded shadow-md
            ${type === 'sold' ? 'bg-stone-700 text-white' : 'bg-green-600 text-white'}
          `}>
            {type === 'sold' ? '[SOLD]' : '[ACTIVE]'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        {/* Price */}
        <div className="mb-2">
          <div className="text-2xl font-bold text-stone-900">
            {formatPrice(price)}
          </div>
          {price_per_sqft && (
            <div className="text-sm text-stone-500">
              ${Math.round(price_per_sqft)}/sqft
            </div>
          )}
        </div>

        {/* Address */}
        <div className="mb-3">
          <div className="font-semibold text-stone-900 text-sm truncate">{address}</div>
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>{city} • {distance_miles.toFixed(2)} mi away</span>
          </div>
        </div>

        {/* Property specs */}
        <div className="flex items-center gap-3 text-sm text-stone-600 mb-3">
          {bedrooms !== null && bedrooms !== undefined && (
            <span><span className="font-semibold">{bedrooms}</span> bd</span>
          )}
          {bathrooms !== null && bathrooms !== undefined && (
            <span><span className="font-semibold">{bathrooms}</span> ba</span>
          )}
          {square_feet !== null && square_feet !== undefined && (
            <span><span className="font-semibold">{square_feet.toLocaleString()}</span> sqft</span>
          )}
        </div>

        {/* Date and DOM */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-200">
          <span>
            {type === 'sold' ? 'Sold' : 'Listed'}: {formatDate(date)}
          </span>
          {days_on_market !== null && days_on_market !== undefined && (
            <span>{days_on_market} DOM</span>
          )}
        </div>

        {/* Match score indicator */}
        <div className="mt-3 pt-3 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">Match Score</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${match_score >= 80 ? 'bg-emerald-500' :
                    match_score >= 60 ? 'bg-yellow-500' :
                      'bg-amber-500'
                    }`}
                  style={{ width: `${Math.min(100, match_score)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-stone-600">{Math.round(match_score)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


