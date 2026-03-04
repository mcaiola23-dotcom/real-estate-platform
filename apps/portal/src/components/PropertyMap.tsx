'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

interface Property {
  id: number
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

interface PropertyMapProps {
  properties: Property[]
  selectedProperty?: Property | null
  onPropertySelect?: (property: Property) => void
  className?: string
}

export default function PropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
  className = "h-96 w-full"
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Add property markers to map - Defined BEFORE useEffect to avoid dependency issues
  const addPropertyMarkers = useCallback(() => {
    if (!map.current || !mapLoaded) return
    const currentMap = map.current

    // Clear existing markers
    const markers = document.querySelectorAll('.map-marker')
    markers.forEach(marker => marker.remove())

    properties.forEach((property) => {
      // Use geocoded coordinates or default to Fairfield County
      const lng = property.longitude || -73.2 + (Math.random() - 0.5) * 0.1
      const lat = property.latitude || 41.2 + (Math.random() - 0.5) * 0.1

      // Create marker element
      const markerEl = document.createElement('div')
      markerEl.className = 'map-marker'
      markerEl.innerHTML = `
        <div class="w-8 h-8 bg-stone-900 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
          <span class="text-white text-xs font-bold">$${Math.round(property.list_price / 1000)}k</span>
        </div>
      `

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-stone-900">${property.address}</h3>
          <p class="text-sm text-stone-500">${property.city}, ${property.state} ${property.zip_code}</p>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-lg font-bold text-stone-900">$${property.list_price.toLocaleString()}</span>
            <span class="text-sm text-stone-500">${property.bedrooms}bd ${property.bathrooms}ba</span>
          </div>
          <div class="mt-2 text-sm text-stone-500">
            ${property.square_feet.toLocaleString()} sqft • ${property.property_type}
          </div>
        </div>
      `)

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(currentMap)

      // Add click handler
      markerEl.addEventListener('click', () => {
        if (onPropertySelect) {
          onPropertySelect(property)
        }
      })
    })

    // Fit map to show all properties
    if (properties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      properties.forEach(property => {
        const lng = property.longitude || -73.2 + (Math.random() - 0.5) * 0.1
        const lat = property.latitude || 41.2 + (Math.random() - 0.5) * 0.1
        bounds.extend([lng, lat])
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [mapLoaded, onPropertySelect, properties])

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'your_mapbox_public_token_here'

      // Check if token is valid (basic check)
      if (!mapboxgl.accessToken || mapboxgl.accessToken === 'your_mapbox_public_token_here') {
        console.warn('Mapbox token might be invalid or default. Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local')
        // We continue anyway as it might work for public styles or we want to show the error in console
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-73.2, 41.2], // Fairfield County, CT
        zoom: 10,
        attributionControl: false
      })

      map.current.on('load', () => {
        setMapLoaded(true)
        addPropertyMarkers()
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [addPropertyMarkers])

  // Update markers when properties change
  useEffect(() => {
    if (mapLoaded) {
      addPropertyMarkers()
    }
  }, [properties, mapLoaded, addPropertyMarkers])

  // Center map on selected property
  useEffect(() => {
    if (map.current && selectedProperty) {
      const lng = selectedProperty.longitude || -73.2
      const lat = selectedProperty.latitude || 41.2
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1000
      })
    }
  }, [selectedProperty])

  return (
    <div className={`map-container ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  )
}
