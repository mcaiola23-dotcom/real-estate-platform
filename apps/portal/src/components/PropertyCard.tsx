'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { HomeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { IdxAttribution } from './common/IdxAttribution'
import FavoriteButton from './common/FavoriteButton'

interface PropertyCardProps {
  parcelId: string
  listingId?: number | null
  address: string
  city: string
  state: string
  zipCode?: string | null
  status?: string | null
  listPrice?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  squareFeet?: number | null
  propertyType?: string | null
  thumbnailUrl?: string | null
  isSelected?: boolean
  onClick?: () => void
  onMouseEnter?: () => void
  className?: string
}

const STATUS_STYLES = {
  Active: {
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  Pending: {
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  Contingent: {
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  Sold: {
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    dotColor: 'bg-rose-500',
  },
  'Off-Market': {
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-600',
    dotColor: 'bg-stone-400',
  },
}

const DEFAULT_STATUS_STYLE = STATUS_STYLES['Off-Market']

function PropertyImagePlaceholder({ propertyType }: { propertyType?: string | null }) {
  return (
    <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center">
      <HomeIcon className="w-8 h-8 text-stone-300" />
      <span className="text-xs text-stone-400 mt-1">{propertyType || 'Property'}</span>
    </div>
  )
}

function PropertyCard({
  parcelId,
  listingId,
  address,
  city,
  state,
  zipCode,
  status,
  listPrice,
  bedrooms,
  bathrooms,
  squareFeet,
  propertyType,
  thumbnailUrl,
  isSelected = false,
  onClick,
  onMouseEnter,
  className = '',
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false)

  const normalizedStatus = status || 'Off-Market'
  const styles = STATUS_STYLES[normalizedStatus as keyof typeof STATUS_STYLES] || DEFAULT_STATUS_STYLE

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`
    }
    return `$${price.toLocaleString()}`
  }

  const hasImage = thumbnailUrl && !imageError

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        relative group rounded-2xl border border-stone-200 bg-white overflow-hidden
        shadow-sm hover:shadow-md transition-shadow cursor-pointer
        ${isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : ''}
        ${className}
      `}
    >
      {/* Image */}
      <div className="relative h-36">
        {hasImage ? (
          <Image
            src={thumbnailUrl!}
            alt={address}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 260px"
            onError={() => setImageError(true)}
          />
        ) : (
          <PropertyImagePlaceholder propertyType={propertyType} />
        )}
        <span className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full font-medium ${styles.badgeBg} ${styles.badgeText}`}>
          {normalizedStatus}
        </span>
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton
            listingId={listingId ?? undefined}
            parcelId={parcelId}
            size="sm"
            className="bg-white/90 hover:bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {listPrice && (
          <div className="text-lg font-semibold text-stone-900">
            {formatPrice(listPrice)}
          </div>
        )}
        <div className="text-sm text-stone-600 leading-tight truncate">
          {address}
        </div>
        <div className="text-xs text-stone-500 mt-0.5">
          {city}, {state} {zipCode || ''}
        </div>
        <div className="mt-3 flex gap-3 text-xs text-stone-500">
          {bedrooms !== null && bedrooms !== undefined && <span>{bedrooms} bd</span>}
          {bathrooms !== null && bathrooms !== undefined && <span>{bathrooms} ba</span>}
          {squareFeet !== null && squareFeet !== undefined && <span>{squareFeet.toLocaleString()} sqft</span>}
        </div>
        {listingId && (
          <div className="mt-2 pt-2 border-t border-stone-100">
            <IdxAttribution compact className="text-[0.6rem]" />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(PropertyCard)

// Compact variant for search results panel
export function PropertyCardCompact({
  address,
  city,
  state,
  status,
  listPrice,
  bedrooms,
  bathrooms,
  squareFeet,
  thumbnailUrl,
  propertyType,
  isSelected = false,
  onClick,
}: Omit<PropertyCardProps, 'className' | 'zipCode' | 'parcelId' | 'listingId'>) {
  const [imageError, setImageError] = useState(false)
  const normalizedStatus = status || 'Off-Market'
  const styles = STATUS_STYLES[normalizedStatus as keyof typeof STATUS_STYLES] || DEFAULT_STATUS_STYLE

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`
    }
    return `$${price.toLocaleString()}`
  }

  const hasImage = thumbnailUrl && !imageError

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl overflow-hidden
        border border-stone-200
        hover:shadow-md transition-all duration-150 cursor-pointer
        ${isSelected ? 'bg-stone-50 ring-2 ring-stone-400' : ''}
      `}
    >
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div className="w-24 min-h-[80px] flex-shrink-0 bg-stone-100 relative overflow-hidden">
          {hasImage ? (
            <Image
              src={thumbnailUrl!}
              alt={address}
              fill
              className="object-cover"
              sizes="96px"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
              <HomeIcon className="w-6 h-6 text-stone-300" />
            </div>
          )}
          <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${styles.dotColor} border border-white shadow-sm z-10`} />
        </div>

        {/* Details */}
        <div className="flex-1 p-2 min-w-0">
          <h4 className="font-medium text-stone-900 text-sm truncate">{address}</h4>
          <p className="text-xs text-stone-500 truncate">{city}, {state}</p>

          {listPrice && (
            <div className="mt-1 text-sm font-semibold text-stone-900">
              {formatPrice(listPrice)}
            </div>
          )}

          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              {bedrooms !== null && bedrooms !== undefined && (
                <span>{bedrooms} bd</span>
              )}
              {bathrooms !== null && bathrooms !== undefined && (
                <span>{bathrooms} ba</span>
              )}
              {squareFeet !== null && squareFeet !== undefined && (
                <span>{(squareFeet / 1000).toFixed(1)}K sqft</span>
              )}
            </div>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
              {normalizedStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
