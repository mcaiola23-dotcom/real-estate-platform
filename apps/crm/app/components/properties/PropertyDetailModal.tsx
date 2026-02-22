'use client';

import type { Listing } from '@real-estate/types/listings';
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@real-estate/types/listings';

export interface LeadOption {
  id: string;
  label: string;
}

interface PropertyDetailModalProps {
  listing: Listing;
  leadOptions: LeadOption[];
  onClose: () => void;
  onAssignToLead: (listing: Listing, leadId: string) => void;
  onSendToClient: (listing: Listing, leadId: string) => void;
}

function formatFullPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyDetailModal({
  listing,
  leadOptions,
  onClose,
  onAssignToLead,
  onSendToClient,
}: PropertyDetailModalProps) {
  const statusClass =
    listing.status === 'active'
      ? 'crm-property-status--active'
      : listing.status === 'pending'
        ? 'crm-property-status--pending'
        : 'crm-property-status--sold';

  return (
    <div className="crm-modal-backdrop" onClick={onClose}>
      <div className="crm-modal crm-property-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crm-modal__header">
          <div>
            <h2 className="crm-modal__title">{listing.address.street}</h2>
            <p className="crm-modal__subtitle">
              {listing.address.city}, {listing.address.state} {listing.address.zip}
            </p>
          </div>
          <button className="crm-modal__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo */}
        <div className="crm-property-detail__photo-section">
          {listing.photos.length > 0 ? (
            <div
              className="crm-property-detail__hero-photo"
              style={{ backgroundImage: `url(${listing.photos[0]})` }}
            />
          ) : (
            <div className="crm-property-detail__hero-photo crm-property-detail__hero-photo--placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="crm-property-detail__body">
          <div className="crm-property-detail__price-row">
            <span className="crm-property-detail__price">{formatFullPrice(listing.price)}</span>
            <span className={`crm-property-card__status ${statusClass}`}>
              {STATUS_LABELS[listing.status]}
            </span>
          </div>

          <div className="crm-property-detail__stats">
            <div className="crm-property-detail__stat">
              <span className="crm-property-detail__stat-value">{listing.beds}</span>
              <span className="crm-property-detail__stat-label">Beds</span>
            </div>
            <div className="crm-property-detail__stat">
              <span className="crm-property-detail__stat-value">{listing.baths}</span>
              <span className="crm-property-detail__stat-label">Baths</span>
            </div>
            <div className="crm-property-detail__stat">
              <span className="crm-property-detail__stat-value">{listing.sqft.toLocaleString()}</span>
              <span className="crm-property-detail__stat-label">Sqft</span>
            </div>
            {listing.lotAcres && (
              <div className="crm-property-detail__stat">
                <span className="crm-property-detail__stat-value">{listing.lotAcres}</span>
                <span className="crm-property-detail__stat-label">Acres</span>
              </div>
            )}
          </div>

          <div className="crm-property-detail__info-grid">
            <div className="crm-property-detail__info-item">
              <span className="crm-property-detail__info-label">Property Type</span>
              <span className="crm-property-detail__info-value">
                {PROPERTY_TYPE_LABELS[listing.propertyType]}
              </span>
            </div>
            {listing.mlsNumber && (
              <div className="crm-property-detail__info-item">
                <span className="crm-property-detail__info-label">MLS #</span>
                <span className="crm-property-detail__info-value">{listing.mlsNumber}</span>
              </div>
            )}
            {listing.address.neighborhood && (
              <div className="crm-property-detail__info-item">
                <span className="crm-property-detail__info-label">Neighborhood</span>
                <span className="crm-property-detail__info-value">{listing.address.neighborhood}</span>
              </div>
            )}
            <div className="crm-property-detail__info-item">
              <span className="crm-property-detail__info-label">Listed</span>
              <span className="crm-property-detail__info-value">
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(listing.listedAt))}
              </span>
            </div>
          </div>

          {/* CRM Actions */}
          {leadOptions.length > 0 && (
            <div className="crm-property-detail__actions">
              <h3 className="crm-property-detail__actions-title">CRM Actions</h3>
              <div className="crm-property-detail__lead-list">
                {leadOptions.slice(0, 8).map((lead) => (
                  <div key={lead.id} className="crm-property-detail__lead-row">
                    <span className="crm-property-detail__lead-name">
                      {lead.label}
                    </span>
                    <div className="crm-property-detail__lead-actions">
                      <button
                        className="crm-property-detail__lead-btn crm-property-detail__lead-btn--assign"
                        onClick={() => onAssignToLead(listing, lead.id)}
                      >
                        Assign
                      </button>
                      <button
                        className="crm-property-detail__lead-btn crm-property-detail__lead-btn--send"
                        onClick={() => onSendToClient(listing, lead.id)}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {listing.attribution && (
            <div className="crm-property-detail__attribution">
              {listing.attribution.broker && (
                <span>Broker: {listing.attribution.broker}</span>
              )}
              {listing.attribution.office && (
                <span>Office: {listing.attribution.office}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
