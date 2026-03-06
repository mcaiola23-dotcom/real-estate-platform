import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import type { PropertyData } from '../types'
import { statusBadge } from '../utils'

interface VerticalPhotoGalleryProps {
  property: PropertyData
  onClose: () => void
}

export function VerticalPhotoGallery({ property, onClose }: VerticalPhotoGalleryProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col" data-print-hide>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 flex-shrink-0">
        <button
          onClick={onClose}
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
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
