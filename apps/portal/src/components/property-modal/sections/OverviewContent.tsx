import Image from 'next/image'
import { Camera, ChevronLeft, ChevronRight, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react'
import type { PropertyData, AvmData } from '../types'
import { CT_MILL_RATE_FISCAL_YEAR } from '../../../lib/ct-mill-rates'
import { formatDate, formatPrice, getEffectiveTax } from '../utils'

interface StreetViewWidgetProps {
  parcelId: string
  width?: string
  height?: string
  className?: string
}

interface OverviewContentProps {
  property: PropertyData
  hasPhotos: boolean
  imageIndex: number
  pricePerSqft?: number
  displayPrice?: number
  avmData?: AvmData
  isNewListing: boolean
  isPriceReduced: boolean
  descExpanded: boolean
  priceBarRef: React.RefObject<HTMLDivElement>
  StreetViewWidgetComponent: React.ComponentType<StreetViewWidgetProps>
  onOpenGalleryAt: (index: number) => void
  onOpenGallery: () => void
  onOpenVerticalGallery: () => void
  onPrevImage: () => void
  onNextImage: () => void
  onToggleDescription: () => void
}

export function OverviewContent({
  property,
  hasPhotos,
  imageIndex,
  pricePerSqft,
  displayPrice,
  avmData,
  isNewListing,
  isPriceReduced,
  descExpanded,
  priceBarRef,
  StreetViewWidgetComponent,
  onOpenGalleryAt,
  onOpenGallery,
  onOpenVerticalGallery,
  onPrevImage,
  onNextImage,
  onToggleDescription,
}: OverviewContentProps) {
  return (
    <>
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
          <div data-print-photo-mosaic className="relative w-full h-72 sm:h-80 lg:h-[28rem] rounded-2xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-1">
            <button
              onClick={() => onOpenGalleryAt(0)}
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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </button>
            {property.photos.slice(1, 5).map((photo, idx) => (
              <button
                key={idx}
                onClick={() => onOpenGalleryAt(idx + 1)}
                className="relative bg-stone-100 overflow-hidden cursor-pointer group"
              >
                <Image
                  src={photo}
                  alt={`${property.address} photo ${idx + 2}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 1024px) 25vw, 280px"
                  quality={60}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {idx === 3 && property.photos.length > 5 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenVerticalGallery() }}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/30 border border-white/80 text-white text-xs font-medium backdrop-blur-sm hover:bg-black/50 transition-colors z-10"
                  >
                    View all {property.photos.length}
                  </button>
                )}
              </button>
            ))}
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
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none col-span-2" />
          </div>
        ) : (
          <div data-print-photo-mosaic className="relative w-full h-72 sm:h-80 lg:h-[28rem] bg-stone-100 rounded-2xl overflow-hidden">
            <Image
              src={property.photos[imageIndex]}
              alt={`${property.address} photo ${imageIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1152px"
              quality={80}
              priority
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
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
              onClick={onOpenGallery}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium hover:bg-white/30 transition-colors"
            >
              <Camera size={14} />
              {imageIndex + 1} / {property.photos.length}
            </button>
            {property.photos.length > 1 && (
              <>
                <button
                  onClick={onPrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={onNextImage}
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
          <StreetViewWidgetComponent
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
            {property.originalListPrice && property.listPrice &&
              property.listPrice !== property.originalListPrice && (() => {
                const diff = property.listPrice - property.originalListPrice
                const pct = ((diff / property.originalListPrice) * 100).toFixed(1)
                const isReduction = diff < 0
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
                )
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
              onClick={onToggleDescription}
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
    </>
  )
}
