'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Home, DollarSign, MapPin, ClipboardList, Share2, Check, Printer, BarChart3 } from 'lucide-react';
import FavoriteButton from './common/FavoriteButton';
import { logPerf, logPerfDuration, perfDurationMs, perfNow } from '../lib/perf';
import { useComparison } from './comparison/ComparisonContext';
import { usePropertyModalData } from './property-modal/usePropertyModalData';
import type { PropertyData } from './property-modal/types';
import { formatPrice, getEffectiveTax, statusBadge, type SectionId } from './property-modal/utils';
import { MarketValuationContent, preloadMarketValuationSection } from './property-modal/sections/MarketValuationContent';
import { NeighborhoodContent, preloadNeighborhoodSections } from './property-modal/sections/NeighborhoodContent';
import { OverviewContent } from './property-modal/sections/OverviewContent';
import { PropertyDetailsContent } from './property-modal/sections/PropertyDetailsContent';
import { VerticalPhotoGallery } from './property-modal/sections/VerticalPhotoGallery';
import { LightboxGallery } from './property-modal/sections/LightboxGallery';

// ────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────
interface PropertyDetailModalProps {
  listingId?: number;
  parcelId?: string;
  isOpen: boolean;
  onClose: () => void;
  onPropertyClick?: (parcelId: string, listingId?: number) => void;
  searchResults?: number[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

function SectionLoadingState({ className = 'h-64' }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700" />
    </div>
  );
}

const StreetViewWidget = dynamic(
  () => import('./StreetViewWidget').then((mod) => mod.StreetViewWidget),
  {
    ssr: false,
    loading: () => <SectionLoadingState className="h-full min-h-[18rem]" />,
  }
);
const NeighborhoodMap = dynamic(() => import('./NeighborhoodMap'), {
  ssr: false,
  loading: () => <SectionLoadingState className="h-72" />,
});

// ════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════
export default function PropertyDetailModal({
  listingId,
  parcelId,
  isOpen,
  onClose,
  onPropertyClick,
  searchResults,
  currentIndex,
  onNavigate,
}: PropertyDetailModalProps) {
  const { property, loading, error, avmData, avmLoading } = usePropertyModalData({
    listingId,
    parcelId,
    isOpen,
  });

  // Image gallery
  const [imageIndex, setImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [verticalGalleryOpen, setVerticalGalleryOpen] = useState(false);

  // Description expand
  const [descExpanded, setDescExpanded] = useState(false);

  // Sticky header
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const priceBarRef = useRef<HTMLDivElement>(null);

  // Share dropdown
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Comparison
  const comparison = useComparison();

  // Section nav
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [loadedSections, setLoadedSections] = useState<Set<SectionId>>(
    new Set<SectionId>(['overview'])
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    overview: null,
    details: null,
    market: null,
    neighborhood: null,
  });
  const modalPerfRef = useRef<{
    startedAt: number;
    source: 'listing' | 'parcel';
    listingId?: number;
    parcelId?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setImageIndex(0);
    setDescExpanded(false);
    setActiveSection('overview');
    setLoadedSections(new Set<SectionId>(['overview']));
    setShowStickyHeader(false);
    setShareOpen(false);
    setShareCopied(false);
  }, [isOpen, listingId, parcelId]);

  useEffect(() => {
    if (!isOpen) {
      modalPerfRef.current = null;
      return;
    }

    const source: 'listing' | 'parcel' = listingId ? 'listing' : 'parcel';
    modalPerfRef.current = {
      startedAt: perfNow(),
      source,
      listingId,
      parcelId,
    };
    logPerf('properties.modal.open_start', {
      source,
      listingId: listingId ?? null,
      parcelId: parcelId ?? null,
    });
  }, [isOpen, listingId, parcelId]);

  useEffect(() => {
    if (!isOpen || loading || !property) return;
    if (!modalPerfRef.current) return;

    const metric = modalPerfRef.current;
    logPerfDuration('properties.modal.open_to_content', perfDurationMs(metric.startedAt), {
      source: metric.source,
      listingId: metric.listingId ?? null,
      parcelId: metric.parcelId ?? null,
      status: property.status,
      hasListing: property.hasListing,
      photoCount: property.photos.length,
    });
    modalPerfRef.current = null;
  }, [isOpen, loading, property]);

  // ── Keyboard / body lock ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (verticalGalleryOpen) {
          setVerticalGalleryOpen(false);
        } else if (galleryOpen) {
          setGalleryOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, galleryOpen, verticalGalleryOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const preloadTimer = window.setTimeout(() => {
      (NeighborhoodMap as any).preload?.();
      preloadMarketValuationSection();
      preloadNeighborhoodSections();
    }, 1200);

    return () => window.clearTimeout(preloadTimer);
  }, [isOpen]);

  // ── Section observer ──────────────────────────────
  const scrollToSection = useCallback((sectionId: SectionId) => {
    setLoadedSections((prev) => {
      if (prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });

    const el = sectionRefs.current[sectionId];
    if (el && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const offset = elTop - containerTop + scrollContainerRef.current.scrollTop - 60;
      scrollContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sid = entry.target.getAttribute('data-section') as SectionId;
          if (!sid) continue;
          if (entry.isIntersecting) {
            setLoadedSections((prev) => {
              if (prev.has(sid)) return prev;
              const next = new Set(prev);
              next.add(sid);
              return next;
            });
          }
        }

        const container = scrollContainerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const threshold = containerRect.top + containerRect.height * 0.4;
        const ids: SectionId[] = ['overview', 'details', 'market', 'neighborhood'];
        let active: SectionId = 'overview';
        for (const id of ids) {
          const el = sectionRefs.current[id];
          if (el && el.getBoundingClientRect().top <= threshold) active = id;
        }
        setActiveSection(active);
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px 0px 200px 0px',
        threshold: 0,
      }
    );

    const ids: SectionId[] = ['overview', 'details', 'market', 'neighborhood'];
    for (const id of ids) {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [isOpen, property, loading]);

  // ── Sticky header observer ───────────────────────
  useEffect(() => {
    if (!isOpen || !priceBarRef.current || !scrollContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { root: scrollContainerRef.current, threshold: 0 }
    );
    observer.observe(priceBarRef.current);
    return () => observer.disconnect();
  }, [isOpen, property, loading]);

  // ── Share handler ──────────────────────────────────
  const handleShare = useCallback(async (method: 'copy' | 'email' | 'sms') => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/property/${property?.parcelId || ''}`
      : '';
    const title = property ? `${property.address}, ${property.city}` : 'Property';
    const text = property
      ? `Check out this property: ${property.address}, ${property.city} ${property.state}`
      : 'Check out this property';

    switch (method) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        } catch { /* clipboard API not available */ }
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`);
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(`${text} ${url}`)}`);
        break;
    }
    setShareOpen(false);
  }, [property]);

  // ── Image nav ─────────────────────────────────────
  const prevImage = () =>
    setImageIndex((i) => (property ? (i - 1 + property.photos.length) % property.photos.length : 0));
  const nextImage = () =>
    setImageIndex((i) => (property ? (i + 1) % property.photos.length : 0));

  // ── Derived ───────────────────────────────────────
  const propertyIdForApi = property?.parcelId || parcelId || '';
  const hasPhotos = (property?.photos.length ?? 0) > 0;
  const displayPrice = property?.listPrice ?? property?.soldPrice;
  const pricePerSqft =
    displayPrice && property?.squareFeet
      ? Math.round(displayPrice / property.squareFeet)
      : undefined;

  const inComparison = property ? comparison.has(property.parcelId) : false;

  // Activity badges (frontend-derived; backend analytics will enhance later)
  const isNewListing = (() => {
    if (!property?.listDate || property.status !== 'Active') return false;
    const listed = new Date(property.listDate);
    const daysAgo = (Date.now() - listed.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  })();
  const isPriceReduced =
    property?.originalListPrice != null &&
    property?.listPrice != null &&
    property.listPrice < property.originalListPrice;

  const handleToggleCompare = useCallback(() => {
    if (!property) return;
    if (inComparison) {
      comparison.remove(property.parcelId);
    } else {
      comparison.add({
        parcelId: property.parcelId,
        listingId: property.listingId,
        address: property.address,
        city: property.city,
        state: property.state,
        status: property.status,
        listPrice: property.listPrice,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.squareFeet,
        lotSizeAcres: property.lotSizeAcres,
        yearBuilt: property.yearBuilt,
        propertyType: property.propertyType,
        photo: property.photos[0],
        taxAnnualAmount: property.taxAnnualAmount,
        estimatedTaxAnnual: property.estimatedTaxAnnual,
        hoaFee: property.hoaFee,
        hoaFrequency: property.hoaFrequency,
        avmEstimate: avmData?.estimated_value,
        avmConfidence: avmData?.confidence_score,
        schoolElementary: property.schoolElementary,
        schoolMiddle: property.schoolMiddle,
        schoolHigh: property.schoolHigh,
        daysOnMarket: property.daysOnMarket,
        pool: property.pool,
        garageSpaces: property.garageSpaces,
        style: property.style,
      });
    }
  }, [property, inComparison, comparison, avmData]);

  if (!isOpen) return null;

  // ── Section definitions ───────────────────────────
  const sections = [
    { id: 'overview' as SectionId, label: 'Overview', icon: Home },
    { id: 'details' as SectionId, label: 'Property Details', icon: ClipboardList },
    { id: 'market' as SectionId, label: 'Market & Valuation', icon: DollarSign },
    { id: 'neighborhood' as SectionId, label: 'Neighborhood', icon: MapPin },
  ];

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(20,16,12,0.46)' }}
        onClick={onClose}
      />

      {/* ── Modal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl border border-stone-200 w-full max-w-6xl h-[90vh] flex flex-col pointer-events-auto animate-modal-rise"
          style={{ boxShadow: '0 24px 60px rgba(24,18,13,0.22)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-stone-200 rounded-t-2xl">
            <div className="flex items-center gap-3 min-w-0">
              {property ? (
                <>
                  <span
                    className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
                      property.status
                    )}`}
                  >
                    {property.status}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-serif font-semibold text-stone-900 truncate">
                      {property.address}
                    </h2>
                    <p className="text-xs text-stone-500 truncate">
                      {property.city}, {property.state} {property.zipCode || ''}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-sm text-stone-400">Property Details</span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {/* Search nav arrows */}
              {searchResults && searchResults.length > 1 && onNavigate && (
                <div className="flex items-center gap-1 mr-2" data-print-hide>
                  <button
                    onClick={() => onNavigate('prev')}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-30"
                    title="Previous"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-stone-500 tabular-nums">
                    {(currentIndex ?? 0) + 1} / {searchResults.length}
                  </span>
                  <button
                    onClick={() => onNavigate('next')}
                    disabled={currentIndex === (searchResults.length - 1)}
                    className="p-1.5 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-30"
                    title="Next"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {propertyIdForApi && (
                <FavoriteButton
                  parcelId={propertyIdForApi}
                  listingId={property?.listingId}
                  size="lg"
                />
              )}

              {/* Compare */}
              {property && (
                <button
                  onClick={handleToggleCompare}
                  className={`p-2 rounded-full transition-colors ${
                    inComparison
                      ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                      : 'hover:bg-stone-100 text-stone-500'
                  }`}
                  title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
                  data-print-hide
                >
                  <BarChart3 size={18} />
                </button>
              )}

              {/* Share */}
              <div className="relative" data-print-hide>
                <button
                  onClick={() => setShareOpen(!shareOpen)}
                  className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                  title="Share"
                >
                  <Share2 size={18} />
                </button>
                {shareOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden z-30">
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      {shareCopied ? <Check size={14} className="text-teal-600" /> : <Share2 size={14} />}
                      {shareCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                    >
                      Email
                    </button>
                    <button
                      onClick={() => handleShare('sms')}
                      className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                    >
                      Text Message
                    </button>
                  </div>
                )}
              </div>

              {/* Print */}
              <button
                onClick={() => window.print()}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                title="Print"
                data-print-hide
              >
                <Printer size={18} />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                title="Close"
                data-print-hide
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ── Loading / Error ── */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-stone-300 border-t-stone-900" />
                <p className="mt-4 text-stone-500 text-sm">Loading property details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={onClose} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          ) : property ? (
            <>
              {/* ── Section Nav ── */}
              <div className="sticky top-0 bg-white z-10 border-b border-stone-200" data-print-hide>
                <div className="flex overflow-x-auto">
                  {sections.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                          activeSection === s.id
                            ? 'border-teal-700 text-teal-700'
                            : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{s.label}</span>
                        <span className="sm:hidden">{s.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Scrollable Content ── */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative property-modal-print">
                {/* Print-only header */}
                <div className="hidden print-header">
                  <div>
                    <span className="text-lg font-serif font-bold text-stone-900">DoorTag</span>
                    <span className="text-xs text-stone-500 ml-2">Property Report</span>
                  </div>
                  <div className="text-right text-xs text-stone-500">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* Sticky header on scroll */}
                {showStickyHeader && property && (
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-2 flex items-center justify-between gap-4" data-print-hide>
                    {/* Left: Price */}
                    <div className="flex-shrink-0">
                      {displayPrice ? (
                        <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                          ${formatPrice(displayPrice)}
                        </span>
                      ) : avmData ? (
                        <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                          ${formatPrice(avmData.estimated_value)}
                        </span>
                      ) : null}
                    </div>
                    {/* Center: Address + stats */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {property.address}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        {property.bedrooms && <span>{property.bedrooms} bd</span>}
                        {property.bathrooms && <span>{property.bathrooms} ba</span>}
                        {property.squareFeet && <span>{property.squareFeet.toLocaleString()} sf</span>}
                      </div>
                    </div>
                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {propertyIdForApi && (
                        <FavoriteButton
                          parcelId={propertyIdForApi}
                          listingId={property.listingId}
                          size="sm"
                        />
                      )}
                      <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                        title="Share"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                        title="Print"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {/* ═══ SECTION 1: OVERVIEW ═══ */}
                <div
                  ref={(el) => { sectionRefs.current.overview = el; }}
                  data-section="overview"
                  className="p-6 space-y-6"
                >
                  <OverviewContent
                    property={property}
                    hasPhotos={hasPhotos}
                    imageIndex={imageIndex}
                    pricePerSqft={pricePerSqft}
                    displayPrice={displayPrice}
                    avmData={avmData ?? undefined}
                    isNewListing={isNewListing}
                    isPriceReduced={isPriceReduced}
                    descExpanded={descExpanded}
                    priceBarRef={priceBarRef}
                    StreetViewWidgetComponent={StreetViewWidget as any}
                    onOpenGalleryAt={(index) => {
                      setImageIndex(index);
                      setGalleryOpen(true);
                    }}
                    onOpenGallery={() => setGalleryOpen(true)}
                    onOpenVerticalGallery={() => setVerticalGalleryOpen(true)}
                    onPrevImage={prevImage}
                    onNextImage={nextImage}
                    onToggleDescription={() => setDescExpanded((prev) => !prev)}
                  />
                </div>

                {/* ═══ SECTION 2: PROPERTY DETAILS ═══ */}
                <div
                  ref={(el) => { sectionRefs.current.details = el; }}
                  data-section="details"
                  className="p-6 border-t-2 border-stone-200 space-y-6"
                >
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    Property Details
                  </h2>

                  {loadedSections.has('details') ? (
                    <PropertyDetailsContent
                      property={property}
                      NeighborhoodMapComponent={NeighborhoodMap as any}
                      onPropertyClick={onPropertyClick}
                    />
                  ) : (
                    <SectionLoadingState />
                  )}
                </div>

                {/* ═══ SECTION 3: MARKET & VALUATION ═══ */}
                <div
                  ref={(el) => { sectionRefs.current.market = el; }}
                  data-section="market"
                  className="p-6 border-t-2 border-stone-200 space-y-8"
                >
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    Market & Valuation
                  </h2>

                  {loadedSections.has('market') ? (
                    <MarketValuationContent
                      property={property}
                      avmData={avmData}
                      avmLoading={avmLoading}
                      propertyIdForApi={propertyIdForApi}
                      effectiveTax={getEffectiveTax(property)}
                      onPropertyClick={onPropertyClick}
                    />
                  ) : (
                    <SectionLoadingState />
                  )}
                </div>

                {/* ═══ SECTION 4: NEIGHBORHOOD ═══ */}
                <div
                  ref={(el) => { sectionRefs.current.neighborhood = el; }}
                  data-section="neighborhood"
                  className="p-6 border-t-2 border-stone-200 space-y-8"
                >
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    {property.subdivision ? `Neighborhood: ${property.subdivision}` : 'Neighborhood'}
                  </h2>

                  {loadedSections.has('neighborhood') ? (
                    <NeighborhoodContent property={property} />
                  ) : (
                    <SectionLoadingState />
                  )}
                </div>

                {/* Print-only footer */}
                <div className="hidden print-footer">
                  <p>Generated by DoorTag &mdash; doortag.com</p>
                  <p>Data deemed reliable but not guaranteed. For informational purposes only.</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {verticalGalleryOpen && property && hasPhotos && (
        <VerticalPhotoGallery
          property={property}
          onClose={() => setVerticalGalleryOpen(false)}
        />
      )}

      {galleryOpen && property && hasPhotos && (
        <LightboxGallery
          property={property}
          imageIndex={imageIndex}
          onClose={() => setGalleryOpen(false)}
          onPrevImage={prevImage}
          onNextImage={nextImage}
          onSelectImage={setImageIndex}
        />
      )}
    </>
  );
}
