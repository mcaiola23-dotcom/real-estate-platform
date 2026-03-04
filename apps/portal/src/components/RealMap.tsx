'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const FAIRFIELD_CENTER: [number, number] = [41.2, -73.2]
const DEFAULT_ZOOM = 10

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

interface RealMapProps {
  properties: Property[]
  selectedProperty?: Property | null
  onPropertySelect?: (property: Property) => void
  className?: string
}

export default function RealMap({
  properties,
  selectedProperty,
  onPropertySelect,
  className = "h-96 w-full"
}: RealMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  const addPropertyMarkers = useCallback((L: any) => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Add markers for each property
    properties.forEach((property) => {
      // Generate coordinates if not provided (for demo purposes)
      const lat = property.latitude || FAIRFIELD_CENTER[0] + (Math.random() - 0.5) * 0.1
      const lng = property.longitude || FAIRFIELD_CENTER[1] + (Math.random() - 0.5) * 0.1

      // Create custom icon
      const propertyIcon = L.divIcon({
        className: 'property-marker',
        html: `
          <div class="bg-stone-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white">
            ${property.list_price > 1000000 ? 'L' : property.list_price > 500000 ? 'M' : 'S'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      // Create marker
      const marker = L.marker([lat, lng], { icon: propertyIcon })
        .addTo(mapRef.current)

      // Create popup content
      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-stone-900 text-sm mb-1">${property.address}</h3>
          <p class="text-xs text-stone-500 mb-2">${property.city}, ${property.state} ${property.zip_code}</p>
          <div class="text-lg font-bold text-stone-900 mb-2">
            $${property.list_price.toLocaleString()}
          </div>
          <div class="text-xs text-stone-500 space-y-1">
            <div>${property.bedrooms} bed • ${property.bathrooms} bath</div>
            <div>${property.square_feet.toLocaleString()} sqft</div>
            <div>Built ${property.year_built}</div>
            <div class="text-stone-900 font-medium">${property.property_type}</div>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)

      // Add click handler
      if (onPropertySelect) {
        marker.on('click', () => {
          onPropertySelect(property)
        })
      }

      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      mapRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [properties, onPropertySelect])

  useEffect(() => {
    if (mapContainer.current && !mapLoaded) {
      // Load Leaflet dynamically
      const loadLeaflet = () => {
        return new Promise((resolve, reject) => {
          // Check if Leaflet is already loaded
          if (typeof window !== 'undefined' && (window as any).L) {
            resolve((window as any).L)
            return
          }

          // Load Leaflet CSS
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
          link.crossOrigin = ''
          document.head.appendChild(link)

          // Load Leaflet JS
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
          script.crossOrigin = ''
          script.onload = () => resolve((window as any).L)
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      loadLeaflet()
        .then((L: any) => {
          // Wait for DOM to be ready
          setTimeout(() => {
            if (!mapContainer.current) return

            try {
              // Create map with proper error handling
              mapRef.current = L.map(mapContainer.current, {
                center: FAIRFIELD_CENTER,
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
                attributionControl: true
              })

              // Add OpenStreetMap tiles
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
              }).addTo(mapRef.current)

              // Add property markers
              addPropertyMarkers(L)

              setMapLoaded(true)
            } catch (error) {
              console.error('Error creating map:', error)
              showErrorState()
            }
          }, 100) // Small delay to ensure DOM is ready
        })
        .catch((error) => {
          console.error('Failed to load Leaflet:', error)
          showErrorState()
        })
    }
  }, [mapLoaded, addPropertyMarkers])

  const showErrorState = () => {
    if (mapContainer.current) {
      mapContainer.current.innerHTML = `
        <div class="w-full h-full bg-stone-100 rounded-lg flex items-center justify-center">
          <div class="text-center p-8">
            <div class="text-4xl mb-4">🗺️</div>
            <h3 class="text-lg font-semibold text-stone-900 mb-2">Map Loading...</h3>
            <p class="text-stone-500">Failed to load map. Please refresh the page.</p>
          </div>
        </div>
      `
    }
    setMapLoaded(true)
  }

  // Update markers when properties change
  useEffect(() => {
    if (mapLoaded && mapRef.current && typeof window !== 'undefined' && (window as any).L) {
      addPropertyMarkers((window as any).L)
    }
  }, [properties, onPropertySelect, addPropertyMarkers, mapLoaded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className={`map-container relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto mb-2"></div>
            <p className="text-stone-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
