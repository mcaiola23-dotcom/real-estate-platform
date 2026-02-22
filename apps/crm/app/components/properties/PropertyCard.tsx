'use client';

import { memo } from 'react';
import type { Listing } from '@real-estate/types/listings';
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@real-estate/types/listings';

interface PropertyCardProps {
  listing: Listing;
  onViewDetail: (listing: Listing) => void;
  onAssignToLead?: (listing: Listing) => void;
}

function formatListingPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export const PropertyCard = memo(function PropertyCard({ listing, onViewDetail, onAssignToLead }: PropertyCardProps) {
  const statusClass =
    listing.status === 'active'
      ? 'crm-property-status--active'
      : listing.status === 'pending'
        ? 'crm-property-status--pending'
        : 'crm-property-status--sold';

  return (
    <div className="crm-property-card" onClick={() => onViewDetail(listing)}>
      <div className="crm-property-card__image">
        {listing.photos.length > 0 ? (
          <div
            className="crm-property-card__photo"
            style={{ backgroundImage: `url(${listing.photos[0]})` }}
          />
        ) : (
          <div className="crm-property-card__photo crm-property-card__photo--placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
          </div>
        )}
        <span className={`crm-property-card__status ${statusClass}`}>
          {STATUS_LABELS[listing.status]}
        </span>
      </div>

      <div className="crm-property-card__body">
        <div className="crm-property-card__price">{formatListingPrice(listing.price)}</div>
        <div className="crm-property-card__address">
          {listing.address.street}
        </div>
        <div className="crm-property-card__location">
          {listing.address.city}, {listing.address.state} {listing.address.zip}
        </div>

        <div className="crm-property-card__stats">
          <span>{listing.beds} bd</span>
          <span className="crm-property-card__dot" />
          <span>{listing.baths} ba</span>
          <span className="crm-property-card__dot" />
          <span>{listing.sqft.toLocaleString()} sqft</span>
          {listing.lotAcres && (
            <>
              <span className="crm-property-card__dot" />
              <span>{listing.lotAcres} ac</span>
            </>
          )}
        </div>

        <div className="crm-property-card__meta">
          <span className="crm-property-card__type">{PROPERTY_TYPE_LABELS[listing.propertyType]}</span>
          {listing.mlsNumber && (
            <span className="crm-property-card__mls">{listing.mlsNumber}</span>
          )}
        </div>

        {onAssignToLead && (
          <button
            className="crm-property-card__action"
            onClick={(e) => {
              e.stopPropagation();
              onAssignToLead(listing);
            }}
          >
            Assign to Lead
          </button>
        )}
      </div>
    </div>
  );
});
