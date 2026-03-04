/**
 * Main AVM estimate display for property detail modals.
 * Shows estimated value with confidence range and score.
 */

import React from 'react';

interface AvmEstimateDisplayProps {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  confidenceScore: number;
  valuationDate: string;
  modelVersion?: string;
}

export const AvmEstimateDisplay: React.FC<AvmEstimateDisplayProps> = ({
  estimatedValue,
  lowEstimate,
  highEstimate,
  confidenceScore,
  valuationDate,
  modelVersion
}) => {
  const formatPrice = (price: number): string => {
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getConfidenceLabel = (score: number): string => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Lower Confidence';
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 0.6) return 'text-amber-600 bg-yellow-50 border-yellow-200';
    return 'text-amber-600 bg-orange-50 border-orange-200';
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-900">
          Estimated Market Value
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidenceScore)}`}>
          {getConfidenceLabel(confidenceScore)}
        </div>
      </div>

      {/* Main Estimate */}
      <div className="text-center py-6 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg mb-4">
        <div className="text-4xl font-bold text-stone-900 mb-2">
          {formatPrice(estimatedValue)}
        </div>
        <div className="text-sm text-stone-500">
          Estimated as of {formatDate(valuationDate)}
        </div>
      </div>

      {/* Confidence Range */}
      <div className="border-t border-stone-200 pt-4">
        <div className="text-sm text-stone-600 mb-3 font-medium">
          Estimated Value Range
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="text-center flex-1">
            <div className="text-xs text-stone-500 mb-1">Low Estimate</div>
            <div className="text-lg font-semibold text-stone-600">
              {formatPrice(lowEstimate)}
            </div>
          </div>
          
          <div className="flex-shrink-0 px-4">
            <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 12">
              <line x1="0" y1="12" x2="24" y2="12" strokeWidth="2" />
              <line x1="0" y1="8" x2="0" y2="16" strokeWidth="2" />
              <line x1="24" y1="8" x2="24" y2="16" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="text-center flex-1">
            <div className="text-xs text-stone-500 mb-1">High Estimate</div>
            <div className="text-lg font-semibold text-stone-600">
              {formatPrice(highEstimate)}
            </div>
          </div>
        </div>
        
        {/* Visual Range Bar */}
        <div className="relative h-2 bg-stone-200 rounded-full mt-4">
          <div 
            className="absolute h-full bg-gradient-to-r from-stone-400 to-stone-700 rounded-full"
            style={{ left: '10%', right: '10%' }}
          />
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-stone-800 rounded-full border-2 border-white"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Confidence Score: {(confidenceScore * 100).toFixed(0)}%</span>
          {modelVersion && <span>Model: {modelVersion}</span>}
        </div>
        <div className="mt-2 text-xs text-stone-400">
          * This estimate is based on recent sales, property characteristics, and location data. 
          Actual sale prices may vary.
        </div>
      </div>
    </div>
  );
};

export default AvmEstimateDisplay;


