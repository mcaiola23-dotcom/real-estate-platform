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

interface SimpleMapFallbackProps {
  properties: Property[]
  selectedProperty?: Property | null
  onPropertySelect?: (property: Property) => void
  className?: string
}

export default function SimpleMapFallback({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  className = "h-96 w-full" 
}: SimpleMapFallbackProps) {
  return (
    <div className={`map-container relative ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-stone-50 to-green-50 rounded-lg border-2 border-stone-200 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-stone-900 mb-3">Interactive Property Map</h3>
          <p className="text-stone-500 mb-4">
            Showing {properties.length} properties in Fairfield County, CT
          </p>
          
          {/* Property List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {properties.slice(0, 5).map((property) => (
              <div 
                key={property.id}
                className="bg-white p-3 rounded-lg shadow-sm border border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onPropertySelect?.(property)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-stone-900 text-sm">{property.address}</h4>
                    <p className="text-xs text-stone-500">{property.city}, {property.state}</p>
                    <div className="text-xs text-stone-500 mt-1">
                      {property.bedrooms}bd • {property.bathrooms}ba • {property.square_feet.toLocaleString()} sqft
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-900 text-sm">
                      ${property.list_price.toLocaleString()}
                    </div>
                    <div className="text-xs text-stone-500">
                      {property.property_type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {properties.length > 5 && (
              <div className="text-center text-sm text-stone-500 py-2">
                +{properties.length - 5} more properties
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-stone-500">
            Map functionality will be enhanced with real data integration
          </div>
        </div>
      </div>
    </div>
  )
}
