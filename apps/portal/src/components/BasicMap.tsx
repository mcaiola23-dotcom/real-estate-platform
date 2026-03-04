'use client'

interface Property {
  id: number
  mls_id: string
  address: string
  city: string
  state: string
  zip_code: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  list_price: number
  property_type: string
  description: string
  year_built: number
  garage_spaces: number
  estimated_value?: number
  latitude?: number
  longitude?: number
}

interface BasicMapProps {
  properties: Property[]
  selectedProperty?: Property | null
  onPropertySelect?: (property: Property) => void
  className?: string
}

export default function BasicMap({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  className = "h-96 w-full" 
}: BasicMapProps) {
  return (
    <div className={`map-container relative ${className}`}>
      <div className="w-full h-full bg-stone-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Interactive Map</h3>
          <p className="text-stone-500 mb-4">Map functionality will be enhanced with real data integration</p>
          <div className="text-sm text-stone-500">
            Showing {properties.length} properties in Fairfield County, CT
          </div>
        </div>
      </div>
    </div>
  )
}
