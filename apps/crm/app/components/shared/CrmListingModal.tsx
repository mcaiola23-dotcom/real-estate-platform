'use client';

import { useState } from 'react';
import type { Listing } from '@real-estate/types/listings';
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@real-estate/types/listings';
import { SlideOverModal } from './SlideOverModal';

interface CrmListingModalProps {
  listing: Listing | null;
  onClose: () => void;
  leadName?: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function CrmListingModal({ listing, onClose, leadName }: CrmListingModalProps) {
  const [activePhoto, setActivePhoto] = useState(0);

  if (!listing) return null;

  const photos = listing.photos ?? [];
  const fullAddress = `${listing.address.street}, ${listing.address.city}, ${listing.address.state} ${listing.address.zip}`;
  const propertyTypeLabel = PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType;
  const statusLabel = STATUS_LABELS[listing.status] ?? listing.status;

  return (
    <SlideOverModal
      open
      onClose={onClose}
      title={listing.address.street}
      subtitle={`${listing.address.city}, ${listing.address.state} ${listing.address.zip}`}
    >
      {leadName && (
        <div className="crm-listing-modal-context">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Viewing for {leadName}
        </div>
      )}

      {/* Photo Gallery */}
      <div className="crm-listing-gallery">
        {photos.length > 0 ? (
          <>
            <img
              className="crm-listing-gallery__main"
              src={photos[activePhoto] ?? photos[0]}
              alt={`${listing.address.street} — photo ${activePhoto + 1}`}
            />
            {photos.length > 1 && (
              <div className="crm-listing-gallery__thumbs">
                {photos.map((photo, i) => (
                  <img
                    key={i}
                    className={`crm-listing-gallery__thumb ${i === activePhoto ? 'is-active' : ''}`}
                    src={photo}
                    alt={`Thumbnail ${i + 1}`}
                    onClick={() => setActivePhoto(i)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="crm-listing-gallery__empty">No photos available</div>
        )}
      </div>

      {/* Price + Address */}
      <div className="crm-listing-price">{currencyFormatter.format(listing.price)}</div>
      <p className="crm-listing-address">{fullAddress}</p>

      {/* Status badge */}
      <div className="crm-chip-row" style={{ marginTop: '0.4rem' }}>
        <span className={`crm-status-badge crm-status-${listing.status === 'active' ? 'new' : listing.status === 'pending' ? 'nurturing' : 'won'}`}>
          {statusLabel}
        </span>
        <span className="crm-chip">{propertyTypeLabel}</span>
      </div>

      {/* Details grid */}
      <div className="crm-listing-details-grid">
        <div className="crm-listing-detail-item">
          <span className="crm-modal-label">Beds</span>
          <strong>{listing.beds}</strong>
        </div>
        <div className="crm-listing-detail-item">
          <span className="crm-modal-label">Baths</span>
          <strong>{listing.baths}</strong>
        </div>
        <div className="crm-listing-detail-item">
          <span className="crm-modal-label">Sqft</span>
          <strong>{listing.sqft.toLocaleString()}</strong>
        </div>
        {listing.lotAcres != null && (
          <div className="crm-listing-detail-item">
            <span className="crm-modal-label">Lot Size</span>
            <strong>{listing.lotAcres} acres</strong>
          </div>
        )}
        {listing.mlsNumber && (
          <div className="crm-listing-detail-item">
            <span className="crm-modal-label">MLS #</span>
            <strong>{listing.mlsNumber}</strong>
          </div>
        )}
        <div className="crm-listing-detail-item">
          <span className="crm-modal-label">Listed</span>
          <strong>{new Date(listing.listedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
        </div>
      </div>

      {/* CRM Actions */}
      <div className="crm-listing-actions">
        <button type="button" className="crm-btn-secondary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add to Suggested
        </button>
        <button type="button" className="crm-btn-secondary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 6.5h12M5.5 3V1.5M10.5 3V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Schedule Showing
        </button>
        <button type="button" className="crm-btn-secondary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 12l-2 2V4.5A1.5 1.5 0 013.5 3h9A1.5 1.5 0 0114 4.5v6a1.5 1.5 0 01-1.5 1.5H6l-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Share with Lead
        </button>
      </div>
    </SlideOverModal>
  );
}
