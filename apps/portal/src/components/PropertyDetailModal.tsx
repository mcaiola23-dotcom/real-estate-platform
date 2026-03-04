'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Home, DollarSign, MapPin, Camera, ClipboardList, ExternalLink, Share2, TrendingDown, TrendingUp, Check, Printer, BarChart3 } from 'lucide-react';
import FavoriteButton from './common/FavoriteButton';
import { CT_MILL_RATE_FISCAL_YEAR } from '../lib/ct-mill-rates';
import { logPerf, logPerfDuration, perfDurationMs, perfNow } from '../lib/perf';
import { useComparison } from './comparison/ComparisonContext';
import { usePropertyModalData } from './property-modal/usePropertyModalData';
import type { PropertyData } from './property-modal/types';
import { MarketValuationContent, preloadMarketValuationSection } from './property-modal/sections/MarketValuationContent';
import { NeighborhoodContent, preloadNeighborhoodSections } from './property-modal/sections/NeighborhoodContent';

type SectionId = 'overview' | 'details' | 'market' | 'neighborhood';

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

// ────────────────────────────────────────────────────────
// Status badge config
// ────────────────────────────────────────────────────────
function statusBadge(status: PropertyData['status']) {
  switch (status) {
    case 'Active':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Sold':
      return 'bg-stone-800 text-white border-stone-700';
    case 'Off-Market':
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────
function formatPrice(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getEffectiveTax(property: PropertyData): number {
  return property.taxAnnualAmount || property.estimatedTaxAnnual || 0;
}

function featureTags(features: string | undefined): string[] {
  if (!features) return [];
  return features
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}

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
                  {/* Print-only: single hero image (the mosaic/interactive gallery is hidden in print) */}
                  {hasPhotos && (
                    <div data-print-hero className="hidden rounded-2xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={property.photos[0]}
                        alt={`${property.address}`}
                        className="w-full max-h-[400px] object-cover rounded-2xl"
                      />
                    </div>
                  )}

                  {/* Hero: Photo Mosaic or StreetView */}
                  {hasPhotos ? (
                    property.photos.length >= 5 ? (
                      /* Mosaic: 1 large + 4 small */
                      <div data-print-photo-mosaic className="relative w-full h-72 sm:h-80 lg:h-[28rem] rounded-2xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-1">
                        <button
                          onClick={() => { setImageIndex(0); setGalleryOpen(true); }}
                          className="relative col-span-2 row-span-2 bg-stone-100 overflow-hidden cursor-pointer group"
                        >
                          <Image
                            src={property.photos[0]}
                            alt={`${property.address} photo 1`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 1024px) 60vw, 600px"
                            quality={80}
                            priority
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </button>
                        {property.photos.slice(1, 5).map((photo, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setImageIndex(idx + 1); setGalleryOpen(true); }}
                            className="relative bg-stone-100 overflow-hidden cursor-pointer group"
                          >
                            <Image
                              src={photo}
                              alt={`${property.address} photo ${idx + 2}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 1024px) 25vw, 280px"
                              quality={60}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {/* "View all" button on last tile */}
                            {idx === 3 && property.photos.length > 5 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setVerticalGalleryOpen(true); }}
                                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/30 border border-white/80 text-white text-xs font-medium backdrop-blur-sm hover:bg-black/50 transition-colors z-10"
                              >
                                View all {property.photos.length}
                              </button>
                            )}
                          </button>
                        ))}
                        {/* Activity badges */}
                        {(isNewListing || isPriceReduced) && (
                          <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none col-span-2">
                            {isNewListing && (
                              <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-xs font-semibold shadow-md">
                                New Listing
                              </span>
                            )}
                            {isPriceReduced && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-md">
                                Price Reduced
                              </span>
                            )}
                          </div>
                        )}
                        {/* Vignette on main photo */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none col-span-2" />
                      </div>
                    ) : (
                      /* Single photo or 2-4 photos: standard hero */
                      <div data-print-photo-mosaic className="relative w-full h-72 sm:h-80 lg:h-[28rem] bg-stone-100 rounded-2xl overflow-hidden">
                        <Image
                          src={property.photos[imageIndex]}
                          alt={`${property.address} photo ${imageIndex + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 1152px"
                          quality={80}
                          priority
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {/* Activity badges */}
                        {(isNewListing || isPriceReduced) && (
                          <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none">
                            {isNewListing && (
                              <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-xs font-semibold shadow-md">
                                New Listing
                              </span>
                            )}
                            {isPriceReduced && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-md">
                                Price Reduced
                              </span>
                            )}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        <button
                          onClick={() => setGalleryOpen(true)}
                          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium hover:bg-white/30 transition-colors"
                        >
                          <Camera size={14} />
                          {imageIndex + 1} / {property.photos.length}
                        </button>
                        {property.photos.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    <div data-print-photo-mosaic className="relative w-full h-72 sm:h-80 lg:h-[28rem] bg-stone-100 rounded-2xl overflow-hidden">
                      <StreetViewWidget
                        parcelId={property.parcelId}
                        width="100%"
                        height="100%"
                        className="w-full h-full"
                      />
                      {!property.hasListing && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-500/80 text-white text-xs font-medium backdrop-blur-sm z-10">
                          Currently Off-Market
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price + Key Stats Row */}
                  <div ref={priceBarRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                    {/* Left: Price + context pills */}
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                      {displayPrice ? (
                        <div className="font-serif text-4xl font-semibold text-stone-900">
                          ${formatPrice(displayPrice)}
                        </div>
                      ) : avmData ? (
                        <div>
                          <div className="font-serif text-4xl font-semibold text-stone-900">
                            ${formatPrice(avmData.estimated_value)}
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">DoorTag&trade; Estimate</p>
                        </div>
                      ) : (
                        <div className="font-serif text-2xl text-stone-400">Price unavailable</div>
                      )}
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {/* Price change indicator */}
                        {property.originalListPrice && property.listPrice &&
                          property.listPrice !== property.originalListPrice && (() => {
                            const diff = property.listPrice - property.originalListPrice;
                            const pct = ((diff / property.originalListPrice) * 100).toFixed(1);
                            const isReduction = diff < 0;
                            return (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                  isReduction
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                                title={`Price ${isReduction ? 'reduced' : 'increased'} from $${formatPrice(property.originalListPrice)}`}
                              >
                                {isReduction ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                ${formatPrice(Math.abs(diff))} ({Math.abs(Number(pct))}%)
                              </span>
                            );
                          })()}
                        {pricePerSqft && (
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                            ${pricePerSqft}/sqft
                          </span>
                        )}
                        {property.daysOnMarket != null && (
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                            {property.daysOnMarket} DOM
                          </span>
                        )}
                        {property.listDate && !property.soldPrice && (
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                            Listed {formatDate(property.listDate)}
                          </span>
                        )}
                        {property.soldPrice && property.soldDate && (
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-white text-xs font-medium">
                            Sold ${formatPrice(property.soldPrice)} &middot; {formatDate(property.soldDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Key stats */}
                    <div className="flex items-center gap-4 sm:gap-5 text-stone-700 flex-shrink-0">
                      {property.bedrooms != null && (
                        <>
                          <div className="text-center">
                            <div className="font-serif text-xl sm:text-2xl font-semibold">{property.bedrooms}</div>
                            <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wide">Beds</div>
                          </div>
                          <div className="w-px h-8 bg-stone-200" />
                        </>
                      )}
                      {(property.bathrooms != null || property.bathsFull != null) && (
                        <>
                          <div className="text-center">
                            <div className="font-serif text-xl sm:text-2xl font-semibold">
                              {property.bathsFull != null
                                ? `${property.bathsFull}${property.bathsHalf ? `/${property.bathsHalf}` : ''}`
                                : property.bathrooms}
                            </div>
                            <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wide">
                              {property.bathsHalf ? 'Full/Half' : 'Baths'}
                            </div>
                          </div>
                          <div className="w-px h-8 bg-stone-200" />
                        </>
                      )}
                      {property.squareFeet != null && (
                        <div className="text-center">
                          <div className="font-serif text-xl sm:text-2xl font-semibold">
                            {property.squareFeet.toLocaleString()}
                          </div>
                          <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wide">Sq Ft</div>
                        </div>
                      )}
                      {property.lotSizeAcres != null && (
                        <>
                          <div className="w-px h-8 bg-stone-200" />
                          <div className="text-center">
                            <div className="font-serif text-xl sm:text-2xl font-semibold">
                              {property.lotSizeAcres}
                            </div>
                            <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wide">Acres</div>
                          </div>
                        </>
                      )}
                      {property.yearBuilt && (
                        <>
                          <div className="w-px h-8 bg-stone-200" />
                          <div className="text-center">
                            <div className="font-serif text-xl sm:text-2xl font-semibold">{property.yearBuilt}</div>
                            <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wide">Built</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.propertyType && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-xs text-stone-400">Property Type</p>
                        <p className="text-sm font-medium text-stone-900">{property.propertyType}</p>
                      </div>
                    )}
                    {property.style && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-xs text-stone-400">Style</p>
                        <p className="text-sm font-medium text-stone-900">{property.style}</p>
                      </div>
                    )}
                    {property.subdivision && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-xs text-stone-400">Neighborhood</p>
                        <p className="text-sm font-medium text-stone-900">{property.subdivision}</p>
                      </div>
                    )}
                    {property.stories != null && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-xs text-stone-400">Stories</p>
                        <p className="text-sm font-medium text-stone-900">{property.stories}</p>
                      </div>
                    )}
                    {property.garageSpaces != null && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-xs text-stone-400">Garage</p>
                        <p className="text-sm font-medium text-stone-900">
                          {property.garageSpaces} {property.garageSpaces === 1 ? 'space' : 'spaces'}
                        </p>
                      </div>
                    )}
                    {getEffectiveTax(property) > 0 && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-xs text-stone-400">Annual Taxes</p>
                        <p className="text-sm font-medium text-stone-900">
                          ${getEffectiveTax(property).toLocaleString()}
                          {property.taxSource === 'mill-rate' && (
                            <span className="text-xs text-stone-400 font-normal ml-1">(Est.)</span>
                          )}
                        </p>
                        {property.taxSource === 'mill-rate' && (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Based on FY {CT_MILL_RATE_FISCAL_YEAR} mill rate
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {property.publicRemarks && (
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">
                        Description
                      </h3>
                      <p
                        className={`text-sm text-stone-600 leading-relaxed ${
                          !descExpanded && property.publicRemarks.length > 400
                            ? 'line-clamp-4'
                            : ''
                        }`}
                      >
                        {property.publicRemarks}
                      </p>
                      {property.publicRemarks.length > 400 && (
                        <button
                          onClick={() => setDescExpanded(!descExpanded)}
                          className="text-teal-700 text-sm font-medium mt-1 hover:underline"
                        >
                          {descExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Agent card (listing only) */}
                  {property.agent && (
                    <div className="bg-stone-50 rounded-xl p-4 border-l-4 border-teal-600 border-y border-r border-stone-100">
                      <p className="text-xs text-stone-400 mb-1">Listing Agent</p>
                      <p className="text-sm font-semibold text-stone-900">
                        {property.agent.name}
                      </p>
                      {property.office && (
                        <p className="text-xs text-stone-500">{property.office.name}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-stone-600">
                        {property.agent.email && <span>{property.agent.email}</span>}
                        {property.agent.phone && <span>{property.agent.phone}</span>}
                      </div>
                    </div>
                  )}

                  {/* Virtual tour link */}
                  {property.virtualTourUrl && (
                    <a
                      href={property.virtualTourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-700 hover:bg-teal-100 transition-colors text-sm font-medium"
                    >
                      <ExternalLink size={16} />
                      View Virtual Tour
                    </a>
                  )}

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
                    <>
                      {/* Construction & Systems */}
                      {(property.construction ||
                        property.heating ||
                        property.cooling ||
                        property.flooring ||
                        property.roof ||
                        property.foundation ||
                        property.water ||
                        property.pool) && (
                        <div>
                          <h3 className="text-sm font-semibold text-stone-700 mb-3">
                            Construction & Systems
                          </h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {property.construction && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Construction</p>
                                <p className="text-sm font-medium text-stone-900">{property.construction}</p>
                              </div>
                            )}
                            {property.heating && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Heating</p>
                                <p className="text-sm font-medium text-stone-900">{property.heating}</p>
                              </div>
                            )}
                            {property.cooling && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Cooling</p>
                                <p className="text-sm font-medium text-stone-900">{property.cooling}</p>
                              </div>
                            )}
                            {property.flooring && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Flooring</p>
                                <p className="text-sm font-medium text-stone-900">{property.flooring}</p>
                              </div>
                            )}
                            {property.roof && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Roof</p>
                                <p className="text-sm font-medium text-stone-900">{property.roof}</p>
                              </div>
                            )}
                            {property.foundation && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Foundation</p>
                                <p className="text-sm font-medium text-stone-900">{property.foundation}</p>
                              </div>
                            )}
                            {property.water && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Water</p>
                                <p className="text-sm font-medium text-stone-900">{property.water}</p>
                              </div>
                            )}
                            {property.pool && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Pool</p>
                                <p className="text-sm font-medium text-stone-900">{property.pool}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Feature tags */}
                      {(property.interiorFeatures || property.exteriorFeatures) && (
                        <div className="space-y-3">
                          {property.interiorFeatures && (
                            <div>
                              <h3 className="text-sm font-semibold text-stone-700 mb-2">
                                Interior Features
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {featureTags(property.interiorFeatures).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {property.exteriorFeatures && (
                            <div>
                              <h3 className="text-sm font-semibold text-stone-700 mb-2">
                                Exterior Features
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {featureTags(property.exteriorFeatures).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional details */}
                      {(property.totalRooms != null ||
                        property.condition ||
                        property.effectiveArea != null ||
                        property.zoning ||
                        property.landUse ||
                        property.parkingDescription ||
                        property.fireplaces != null ||
                        property.view) && (
                        <div>
                          <h3 className="text-sm font-semibold text-stone-700 mb-3">
                            Additional Details
                          </h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {property.totalRooms != null && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Total Rooms</p>
                                <p className="text-sm font-medium text-stone-900">
                                  {property.totalRooms}
                                </p>
                              </div>
                            )}
                            {property.condition && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Condition</p>
                                <p className="text-sm font-medium text-stone-900">
                                  {property.condition}
                                </p>
                              </div>
                            )}
                            {property.effectiveArea != null && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Effective Area</p>
                                <p className="text-sm font-medium text-stone-900">
                                  {property.effectiveArea.toLocaleString()} sqft
                                </p>
                              </div>
                            )}
                            {property.zoning && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Zoning</p>
                                <p className="text-sm font-medium text-stone-900">{property.zoning}</p>
                              </div>
                            )}
                            {property.landUse && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Land Use</p>
                                <p className="text-sm font-medium text-stone-900">{property.landUse}</p>
                              </div>
                            )}
                            {property.parkingDescription && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Parking</p>
                                <p className="text-sm font-medium text-stone-900">
                                  {property.parkingDescription}
                                </p>
                              </div>
                            )}
                            {property.fireplaces != null && property.fireplaces > 0 && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">Fireplaces</p>
                                <p className="text-sm font-medium text-stone-900">
                                  {property.fireplaces}
                                </p>
                              </div>
                            )}
                            {property.view && (
                              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                <p className="text-xs text-stone-400">View</p>
                                <p className="text-sm font-medium text-stone-900">{property.view}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assessment & Appraisal — side by side */}
                      {(property.assessmentLand != null ||
                        property.assessmentBuilding != null ||
                        property.appraisedLand != null ||
                        property.appraisedBuilding != null) && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {(property.assessmentLand != null || property.assessmentBuilding != null) && (
                            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                                Assessment
                              </h3>
                              <div className="space-y-2">
                                {property.assessmentLand != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Land</span>
                                    <span className="font-medium text-stone-900">
                                      ${property.assessmentLand.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {property.assessmentBuilding != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Building</span>
                                    <span className="font-medium text-stone-900">
                                      ${property.assessmentBuilding.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {property.assessmentTotal != null && (
                                  <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                                    <span className="font-semibold text-stone-900">Total</span>
                                    <span className="font-bold text-stone-900">
                                      ${property.assessmentTotal.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {(property.appraisedLand != null || property.appraisedBuilding != null) && (
                            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                                Appraisal
                              </h3>
                              <div className="space-y-2">
                                {property.appraisedLand != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Land</span>
                                    <span className="font-medium text-stone-900">
                                      ${property.appraisedLand.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {property.appraisedBuilding != null && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Building</span>
                                    <span className="font-medium text-stone-900">
                                      ${property.appraisedBuilding.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {property.appraisedTotal != null && (
                                  <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                                    <span className="font-semibold text-stone-900">Total</span>
                                    <span className="font-bold text-stone-900">
                                      ${property.appraisedTotal.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sale history timeline */}
                      {(property.lastSalePrice != null || property.priorSalePrice != null) && (
                        <div>
                          <h3 className="text-sm font-semibold text-stone-700 mb-3">Sale History</h3>
                          <div className="space-y-2">
                            {property.lastSalePrice != null && property.lastSalePrice > 0 && (
                              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex justify-between items-center">
                                <div>
                                  <p className="text-xs text-stone-500">Last Sale</p>
                                  <p className="text-sm font-semibold text-stone-900">
                                    ${property.lastSalePrice.toLocaleString()}
                                  </p>
                                </div>
                                {property.lastSaleDate && (
                                  <span className="text-xs text-stone-400">
                                    {formatDate(property.lastSaleDate)}
                                  </span>
                                )}
                              </div>
                            )}
                            {property.priorSalePrice != null && property.priorSalePrice > 0 && (
                              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex justify-between items-center">
                                <div>
                                  <p className="text-xs text-stone-500">Prior Sale</p>
                                  <p className="text-sm font-semibold text-stone-900">
                                    ${property.priorSalePrice.toLocaleString()}
                                  </p>
                                </div>
                                {property.priorSaleDate && (
                                  <span className="text-xs text-stone-400">
                                    {formatDate(property.priorSaleDate)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* HOA */}
                      {property.hoaFee != null && property.hoaFee > 0 && (
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                          <h3 className="text-sm font-semibold text-stone-700 mb-2">HOA</h3>
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Fee</span>
                            <span className="font-medium text-stone-900">
                              ${property.hoaFee.toLocaleString()}
                              {property.hoaFrequency ? ` / ${property.hoaFrequency}` : ''}
                            </span>
                          </div>
                          {property.hoaName && (
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-stone-500">Association</span>
                              <span className="font-medium text-stone-900">{property.hoaName}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Parcel ID */}
                      <div className="text-xs text-stone-400 pt-2 border-t border-stone-100">
                        Parcel ID: {property.parcelId}
                      </div>

                      {/* Neighborhood satellite map */}
                      {property.latitude && property.longitude && (
                        <div data-print-hide>
                          <NeighborhoodMap
                            latitude={property.latitude}
                            longitude={property.longitude}
                            parcelId={property.parcelId}
                            address={property.address}
                            neighborhood={property.subdivision}
                            onPropertyClick={onPropertyClick}
                          />
                        </div>
                      )}
                    </>
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

      {/* ── Full-screen Image Gallery ── */}
      {/* ── Vertical Photo Gallery ── */}
      {verticalGalleryOpen && property && hasPhotos && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col" data-print-hide>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 flex-shrink-0">
            <button
              onClick={() => setVerticalGalleryOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ChevronLeft size={18} />
              Back to listing
            </button>
            <div className="text-right min-w-0">
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${statusBadge(property.status)}`}>
                  {property.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-900 truncate">{property.address}</p>
              <p className="text-xs text-stone-500">{property.city}, {property.state} {property.zipCode}</p>
            </div>
          </div>
          {/* Scrollable photo list */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-6 space-y-4">
            {property.photos.map((photo, idx) => (
              <div key={idx} className="relative w-full max-w-4xl mx-auto">
                <Image
                  src={photo}
                  alt={`${property.address} photo ${idx + 1}`}
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-xl object-cover"
                  sizes="(max-width: 1024px) 100vw, 900px"
                  quality={80}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Full-screen Image Gallery ── */}
      {galleryOpen && property && hasPhotos && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col" data-print-hide>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-white/70 text-sm">
              {imageIndex + 1} / {property.photos.length}
            </span>
            <button
              onClick={() => setGalleryOpen(false)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-16 relative">
            <button
              onClick={prevImage}
              className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="relative w-full max-w-5xl h-[70vh]">
              <Image
                src={property.photos[imageIndex]}
                alt={`Photo ${imageIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={85}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            <button
              onClick={nextImage}
              className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 px-6 py-4 overflow-x-auto justify-center">
            {property.photos.slice(0, 20).map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  idx === imageIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <Image src={photo} alt="" fill className="object-cover" sizes="64px" quality={50} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
