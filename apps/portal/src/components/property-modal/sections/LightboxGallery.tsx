import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PropertyData } from '../types'

interface LightboxGalleryProps {
  property: PropertyData
  imageIndex: number
  onClose: () => void
  onPrevImage: () => void
  onNextImage: () => void
  onSelectImage: (index: number) => void
}

export function LightboxGallery({
  property,
  imageIndex,
  onClose,
  onPrevImage,
  onNextImage,
  onSelectImage,
}: LightboxGalleryProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col" data-print-hide>
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white/70 text-sm">
          {imageIndex + 1} / {property.photos.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-16 relative">
        <button
          onClick={onPrevImage}
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
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>

        <button
          onClick={onNextImage}
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
            onClick={() => onSelectImage(idx)}
            className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
              idx === imageIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
            }`}
          >
            <Image src={photo} alt="" fill className="object-cover" sizes="64px" quality={50} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}
