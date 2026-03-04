/**
 * Small AVM badge for property cards and map markers.
 * Shows estimated value with optional confidence indicator.
 */

import React from 'react';

interface AvmBadgeProps {
  estimatedValue: number;
  confidenceScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
}

export const AvmBadge: React.FC<AvmBadgeProps> = ({
  estimatedValue,
  confidenceScore,
  size = 'md',
  showConfidence = false
}) => {
  const formatPrice = (price: number): string => {
    if (price >= 1_000_000) {
      return `$${(price / 1_000_000).toFixed(2)}M`;
    } else if (price >= 1_000) {
      return `$${(price / 1_000).toFixed(0)}K`;
    } else {
      return `$${price.toLocaleString()}`;
    }
  };

  const getConfidenceColor = (score?: number): string => {
    if (!score) return 'text-stone-500';
    if (score >= 0.8) return 'text-emerald-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-amber-600';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <div className={`inline-flex items-center gap-1 bg-stone-50 border border-stone-200 rounded ${sizeClasses[size]}`}>
      <span className="font-semibold text-stone-900">
        Est: {formatPrice(estimatedValue)}
      </span>
      {showConfidence && confidenceScore && (
        <span className={`text-xs ${getConfidenceColor(confidenceScore)}`}>
          ({(confidenceScore * 100).toFixed(0)}%)
        </span>
      )}
    </div>
  );
};

export default AvmBadge;


