import dynamic from 'next/dynamic'
import type { PropertyData } from '../types'

function SectionLoadingState({ className = 'h-64' }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700" />
    </div>
  )
}

const SchoolsSection = dynamic(() => import('../../SchoolsSection'), {
  loading: () => <SectionLoadingState className="h-48" />,
})
const NeighborhoodSection = dynamic(() => import('../../NeighborhoodSection'), {
  loading: () => <SectionLoadingState className="h-48" />,
})
const CommuteSection = dynamic(() => import('../../CommuteSection'), {
  loading: () => <SectionLoadingState className="h-48" />,
})

export function preloadNeighborhoodSections() {
  ;(SchoolsSection as any).preload?.()
  ;(NeighborhoodSection as any).preload?.()
  ;(CommuteSection as any).preload?.()
}

interface NeighborhoodContentProps {
  property: PropertyData
}

export function NeighborhoodContent({ property }: NeighborhoodContentProps) {
  return (
    <>
      <SchoolsSection
        listingId={property.listingId}
        parcelId={property.parcelId}
      />
      <div className="border-t border-stone-200 pt-8">
        <NeighborhoodSection
          parcelId={property.parcelId}
          city={property.city}
          state={property.state}
          neighborhood={property.subdivision}
        />
      </div>
      <div className="border-t border-stone-200 pt-8">
        <CommuteSection
          listingId={property.listingId}
          parcelId={property.parcelId}
        />
      </div>
    </>
  )
}
