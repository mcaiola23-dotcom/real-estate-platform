'use client'

import { useEffect, useRef, useState } from 'react'

interface Property {
  id: number
  mls_id: string
  address: string
  city: string
  state: string
  zip_code: string
  list_price: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  property_type: string
  latitude?: number
  longitude?: number
}

interface SimpleMapProps {
  properties: Property[]
  selectedProperty?: Property | null
  onPropertySelect?: (property: Property) => void
  className?: string
}

export default function SimpleMap({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  className = "h-96 w-full" 
}: SimpleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (mapContainer.current && !mapLoaded) {
      try {
        // Create a simple map using Leaflet (free alternative)
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
          try {
            const L = (window as any).L
            
            if (!L) {
              console.error('Leaflet not loaded')
              setMapLoaded(true)
              return
            }
            
            // Create map
            const map = L.map(mapContainer.current).setView([41.2, -73.2], 10)
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map)
            
            // Add property markers
            properties.forEach((property) => {
              const lng = property.longitude || -73.2 + (Math.random() - 0.5) * 0.1
              const lat = property.latitude || 41.2 + (Math.random() - 0.5) * 0.1
              
              const marker = L.marker([lat, lng]).addTo(map)
              
              marker.bindPopup(`
                <div class="p-2">
                  <h3 class="font-semibold">${property.address}</h3>
                  <p class="text-sm text-stone-500">${property.city}, ${property.state}</p>
                  <div class="mt-2">
                    <span class="text-lg font-bold text-stone-900">$${property.list_price.toLocaleString()}</span>
                    <div class="text-sm text-stone-500">
                      ${property.bedrooms}bd ${property.bathrooms}ba • ${property.square_feet.toLocaleString()} sqft
                    </div>
                  </div>
                </div>
              `)
              
              if (onPropertySelect) {
                marker.on('click', () => onPropertySelect(property))
              }
            })
            
            setMapLoaded(true)
          } catch (error) {
            console.error('Error creating map:', error)
            setMapLoaded(true)
          }
        }
        script.onerror = () => {
          console.error('Failed to load Leaflet')
          setMapLoaded(true)
        }
        document.head.appendChild(script)
        
        // Add Leaflet CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      } catch (error) {
        console.error('Error setting up map:', error)
        setMapLoaded(true)
      }
    }
  }, [properties, onPropertySelect, mapLoaded])

  return (
    <div className={`map-container relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto mb-2"></div>
            <p className="text-stone-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
