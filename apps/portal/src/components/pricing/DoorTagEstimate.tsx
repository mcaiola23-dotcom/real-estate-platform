'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Home, TrendingUp, Calendar } from 'lucide-react';

interface DoorTagEstimateProps {
  avmData: {
    estimated_value: number;
    confidence_score: number;
    low_estimate: number;
    high_estimate: number;
    valuation_date: string;
    feature_importance?: string[];
  } | null;
  listPrice?: number | null;
  propertyData?: {
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    city?: string;
  };
  loading?: boolean;
}

export default function DoorTagEstimate({
  avmData,
  listPrice,
  propertyData,
  loading = false,
}: DoorTagEstimateProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getConfidenceBadge = (score: number) => {
    if (score > 0.8) {
      return { label: 'High Confidence', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    } else if (score >= 0.6) {
      return { label: 'Moderate Confidence', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'Low Confidence', color: 'bg-stone-100 text-stone-600 border-stone-200' };
  };

  const getMarketAnalysis = () => {
    if (!avmData || !listPrice) return null;
    const difference = listPrice - avmData.estimated_value;
    const percentDiff = (difference / avmData.estimated_value) * 100;
    return { listPrice, doortagEstimate: avmData.estimated_value, difference, percentDiff };
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700" />
        </div>
      </div>
    );
  }

  if (!avmData) {
    return (
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center gap-3 mb-2">
          <Home className="w-5 h-5 text-stone-400" />
          <h3 className="font-serif text-lg font-semibold text-stone-500">DoorTag&trade;</h3>
        </div>
        <p className="text-sm text-stone-500 mt-2">
          Valuation estimate not available for this property yet.
        </p>
      </div>
    );
  }

  const confidenceBadge = getConfidenceBadge(avmData.confidence_score);
  const marketAnalysis = getMarketAnalysis();

  return (
    <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-stone-900 p-2 rounded-lg">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-stone-900">DoorTag&trade;</h3>
            <p className="text-xs text-stone-500">AI-Powered Valuation</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceBadge.color}`}
        >
          {confidenceBadge.label}
        </span>
      </div>

      {/* Main Estimate */}
      <div className="mb-4">
        <div className="font-serif text-4xl font-semibold text-stone-900 mb-1">
          ${avmData.estimated_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Calendar className="w-4 h-4" />
          <span>Estimate as of {formatDate(avmData.valuation_date)}</span>
        </div>
      </div>

      {/* Confidence Range */}
      <div className="bg-white rounded-xl p-3 mb-4 border border-stone-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 font-medium">Estimated Range</span>
          <span className="text-stone-900 font-semibold">
            {formatPrice(avmData.low_estimate)} &ndash; {formatPrice(avmData.high_estimate)}
          </span>
        </div>
      </div>

      {/* Market Value Analysis */}
      {marketAnalysis && (
        <div className="bg-white rounded-xl p-3 mb-4 border border-stone-100">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">List Price</span>
              <span className="font-semibold text-stone-900">
                ${marketAnalysis.listPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">DoorTag&trade; Estimate</span>
              <span className="font-semibold text-stone-900">
                ${marketAnalysis.doortagEstimate.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200">
              <span className="text-stone-500">Difference</span>
              <span
                className={`font-bold ${
                  marketAnalysis.percentDiff > 0 ? 'text-stone-900' : 'text-teal-700'
                }`}
              >
                {marketAnalysis.percentDiff > 0 ? '+' : ''}
                {marketAnalysis.percentDiff.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* How We Estimated This */}
      <div className="border-t border-stone-200 pt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left hover:bg-stone-100 rounded-lg p-2 transition-colors"
        >
          <span className="text-sm font-semibold text-stone-700">How we estimated this</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          )}
        </button>

        {showDetails && (
          <div className="mt-2 text-sm text-stone-600 bg-white rounded-xl p-3 border border-stone-100 space-y-2">
            {avmData.feature_importance && avmData.feature_importance.length > 0 ? (
              <>
                <p className="font-medium mb-2">Based on key factors:</p>
                <ul className="space-y-1">
                  {avmData.feature_importance.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-stone-500 mt-3 italic">
                  Combined with recent comparable sales and local market trends in{' '}
                  {propertyData?.city || 'the area'}.
                </p>
              </>
            ) : (
              <p>
                Based on {propertyData?.bedrooms || 'N/A'} beds,{' '}
                {propertyData?.bathrooms || 'N/A'} baths,
                {propertyData?.square_feet
                  ? ` ${propertyData.square_feet.toLocaleString()} sqft`
                  : ''}{' '}
                in {propertyData?.city || 'this area'}, and recent comparable sales.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
