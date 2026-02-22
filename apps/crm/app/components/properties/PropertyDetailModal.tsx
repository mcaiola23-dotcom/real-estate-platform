'use client';

import { useCallback, useEffect, useState } from 'react';
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

/* ─── Lightbox ─── */

function PropertyLightbox({
  photos,
  currentIndex,
  onIndexChange,
  onClose,
}: {
  photos: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        onIndexChange(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
      }
      if (e.key === 'ArrowRight') {
        onIndexChange(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, currentIndex, photos.length, onIndexChange]);

  return (
    <div className="crm-lightbox" onClick={onClose}>
      <button className="crm-lightbox__close" onClick={onClose} aria-label="Close lightbox">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="crm-lightbox__stage" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="crm-lightbox__img"
          src={photos[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
        />
      </div>

      {photos.length > 1 && (
        <>
          <button
            className="crm-lightbox__nav crm-lightbox__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
            }}
            aria-label="Previous photo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="crm-lightbox__nav crm-lightbox__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
            }}
            aria-label="Next photo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div className="crm-lightbox__counter">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}

/* ─── Main Modal ─── */

export function PropertyDetailModal({
  listing,
  leadOptions,
  onClose,
  onAssignToLead,
  onSendToClient,
}: PropertyDetailModalProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const statusClass =
    listing.status === 'active'
      ? 'crm-property-status--active'
      : listing.status === 'pending'
        ? 'crm-property-status--pending'
        : 'crm-property-status--sold';

  const handlePrev = useCallback(() => {
    setPhotoIndex((i) => (i === 0 ? listing.photos.length - 1 : i - 1));
  }, [listing.photos.length]);

  const handleNext = useCallback(() => {
    setPhotoIndex((i) => (i === listing.photos.length - 1 ? 0 : i + 1));
  }, [listing.photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, lightboxOpen]);

  return (
    <>
      {lightboxOpen && (
        <PropertyLightbox
          photos={listing.photos}
          currentIndex={photoIndex}
          onIndexChange={setPhotoIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="crm-modal-backdrop" onClick={onClose}>
        <div className="crm-modal crm-property-detail-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="crm-modal__header">
            <div className="crm-modal__header-left">
              <span className={`crm-property-card__status ${statusClass}`}>
                {STATUS_LABELS[listing.status]}
              </span>
              <div>
                <h2 className="crm-modal__title">{listing.address.street}</h2>
                <p className="crm-modal__subtitle">
                  {listing.address.city}, {listing.address.state} {listing.address.zip}
                </p>
              </div>
            </div>
            <button className="crm-modal__close" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Two-column layout */}
          <div className="crm-property-detail__layout">
            {/* Left: Photo gallery */}
            <div className="crm-property-detail__gallery">
              <div className="crm-property-detail__hero-wrap">
                {listing.photos.length > 0 ? (
                  <div
                    className="crm-property-detail__hero-photo"
                    style={{ backgroundImage: `url(${listing.photos[photoIndex]})` }}
                    onClick={() => setLightboxOpen(true)}
                    role="button"
                    tabIndex={0}
                    aria-label="Open photo lightbox"
                  />
                ) : (
                  <div className="crm-property-detail__hero-photo crm-property-detail__hero-photo--placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                    </svg>
                  </div>
                )}

                {listing.photos.length > 1 && (
                  <>
                    <button
                      className="crm-property-detail__nav crm-property-detail__nav--prev"
                      onClick={handlePrev}
                      aria-label="Previous photo"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      className="crm-property-detail__nav crm-property-detail__nav--next"
                      onClick={handleNext}
                      aria-label="Next photo"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {listing.photos.length > 0 && (
                  <div className="crm-property-detail__photo-counter">
                    {photoIndex + 1} / {listing.photos.length}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {listing.photos.length > 1 && (
                <div className="crm-property-detail__thumbnails">
                  {listing.photos.slice(0, 6).map((photo, index) => (
                    <button
                      key={`thumb-${index}`}
                      className={`crm-property-detail__thumb ${index === photoIndex ? 'crm-property-detail__thumb--active' : ''}`}
                      onClick={() => setPhotoIndex(index)}
                      aria-label={`View photo ${index + 1}`}
                    >
                      <div
                        className="crm-property-detail__thumb-img"
                        style={{ backgroundImage: `url(${photo})` }}
                      />
                      {index === 5 && listing.photos.length > 6 && (
                        <div className="crm-property-detail__thumb-more">
                          +{listing.photos.length - 6}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="crm-property-detail__body">
              <div className="crm-property-detail__price-row">
                <span className="crm-property-detail__price">{formatFullPrice(listing.price)}</span>
              </div>

              <div className="crm-property-detail__stats">
                <div className="crm-property-detail__stat">
                  <svg className="crm-property-detail__stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="crm-property-detail__stat-value">{listing.beds}</span>
                  <span className="crm-property-detail__stat-label">beds</span>
                </div>
                <div className="crm-property-detail__stat">
                  <svg className="crm-property-detail__stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span className="crm-property-detail__stat-value">{listing.baths}</span>
                  <span className="crm-property-detail__stat-label">baths</span>
                </div>
                <div className="crm-property-detail__stat">
                  <svg className="crm-property-detail__stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="crm-property-detail__stat-value">{listing.sqft.toLocaleString()}</span>
                  <span className="crm-property-detail__stat-label">sqft</span>
                </div>
                {listing.lotAcres && (
                  <div className="crm-property-detail__stat">
                    <span className="crm-property-detail__stat-value">{listing.lotAcres}</span>
                    <span className="crm-property-detail__stat-label">acres</span>
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
                    <span className="crm-property-detail__info-value" style={{ textTransform: 'capitalize' }}>
                      {listing.address.neighborhood.replace(/-/g, ' ')}
                    </span>
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
      </div>
    </>
  );
}
