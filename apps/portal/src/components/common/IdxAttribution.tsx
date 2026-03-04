import React from 'react';

interface IdxAttributionProps {
  className?: string;
  compact?: boolean;
}

export const IdxAttribution: React.FC<IdxAttributionProps> = ({ className = '', compact = false }) => {
  return (
    <div className={`text-stone-500 text-xs ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span>Listing data provided courtesy of SmartMLS, Inc.</span>
        {!compact && (
          <span className="hidden sm:inline">
            Information deemed reliable but not guaranteed.
          </span>
        )}
      </div>
      <div className="mt-0.5 opacity-75" style={{ fontSize: '0.65rem' }}>
        © {new Date().getFullYear()} SmartMLS, Inc. All rights reserved.
      </div>
    </div>
  );
};
