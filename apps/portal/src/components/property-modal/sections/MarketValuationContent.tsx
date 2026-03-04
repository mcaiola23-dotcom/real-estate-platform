import dynamic from 'next/dynamic'
import type { AvmData, PropertyData } from '../types'

function SectionLoadingState({ className = 'h-64' }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-700" />
    </div>
  )
}

const AVMHistoryChart = dynamic(() => import('../../avm/AVMHistoryChart'), {
  loading: () => <SectionLoadingState className="h-64" />,
})
const DoorTagEstimate = dynamic(() => import('../../pricing/DoorTagEstimate'), {
  loading: () => <SectionLoadingState className="h-52" />,
})
const CompsSection = dynamic(() => import('../../pricing/CompsSection'), {
  loading: () => <SectionLoadingState className="h-64" />,
})
const MortgageCalculator = dynamic(() => import('../../pricing/MortgageCalculator'), {
  loading: () => <SectionLoadingState className="h-72" />,
})
const TransactionHistory = dynamic(() => import('../../pricing/TransactionHistory'), {
  loading: () => <SectionLoadingState className="h-56" />,
})
const MarketStatsSection = dynamic(() => import('../../MarketStatsSection'), {
  loading: () => <SectionLoadingState className="h-56" />,
})

export function preloadMarketValuationSection() {
  ;(DoorTagEstimate as any).preload?.()
  ;(MarketStatsSection as any).preload?.()
  ;(CompsSection as any).preload?.()
  ;(AVMHistoryChart as any).preload?.()
  ;(MortgageCalculator as any).preload?.()
  ;(TransactionHistory as any).preload?.()
}

interface MarketValuationContentProps {
  property: PropertyData
  avmData: AvmData | null
  avmLoading: boolean
  propertyIdForApi: string
  effectiveTax: number
  onPropertyClick?: (parcelId: string, listingId?: number) => void
}

export function MarketValuationContent({
  property,
  avmData,
  avmLoading,
  propertyIdForApi,
  effectiveTax,
  onPropertyClick,
}: MarketValuationContentProps) {
  return (
    <>
      <DoorTagEstimate
        avmData={avmData}
        listPrice={property.listPrice ?? null}
        propertyData={{
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          square_feet: property.squareFeet,
          city: property.city,
        }}
        loading={avmLoading}
      />

      <MarketStatsSection
        town={property.city}
        neighborhood={property.subdivision}
      />

      <div>
        <h3 className="font-serif text-xl font-semibold text-stone-900 mb-4">
          Comparable Properties
        </h3>
        <CompsSection
          propertyId={propertyIdForApi}
          onPropertyClick={(id) => {
            if (onPropertyClick && typeof id === 'string') {
              onPropertyClick(id)
            }
          }}
        />
      </div>

      <div>
        <h3 className="font-serif text-xl font-semibold text-stone-900 mb-4">
          Value History
        </h3>
        {propertyIdForApi && (
          <AVMHistoryChart
            parcelId={propertyIdForApi}
            months={24}
            className="shadow-sm"
          />
        )}
      </div>

      <div>
        <h3 className="font-serif text-xl font-semibold text-stone-900 mb-4">
          Financing Calculator
        </h3>
        <MortgageCalculator
          defaultHomePrice={
            property.listPrice ||
            avmData?.estimated_value ||
            500000
          }
          propertyTaxAnnual={effectiveTax}
          taxSource={property.taxSource}
          hoaMonthly={
            property.hoaFee && property.hoaFrequency?.toLowerCase() === 'monthly'
              ? property.hoaFee
              : 0
          }
        />
      </div>

      <div>
        <h3 className="font-serif text-xl font-semibold text-stone-900 mb-4">
          Transaction History
        </h3>
        <TransactionHistory propertyId={propertyIdForApi} listingId={property.listingId} />
      </div>
    </>
  )
}
