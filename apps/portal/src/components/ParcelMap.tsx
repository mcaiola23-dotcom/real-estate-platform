'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Polygon, MultiPolygon } from 'geojson'

export interface ParcelData {
  parcel_id: string
  address: string
  city: string
  state: string
  zip_code?: string
  coordinates: { lat: number; lng: number }
  boundary: Polygon | MultiPolygon
  list_price?: number | null
  listing_status?: string | null
  highlight?: boolean
  property_type?: string | null
  lot_size_acres?: number | null
  updated_at?: string | null
  property_details?: {
    square_feet?: number | null
    bedrooms?: number | null
    bathrooms?: number | null
    acreage?: number | null
    year_built?: number | null
    property_type?: string | null
  }
  ownership?: {
    owner_name?: string
    owner_address?: string
    ownership_type?: string
  }
  market_data?: {
    estimated_value?: number | null
    last_sale_price?: number | null
    last_sale_date?: string | null
    price_per_sqft?: number | null
  }
  zoning?: {
    zone?: string | null
    use_restrictions?: string[]
  }
}

interface ParcelMapProps {
  parcels: ParcelData[]
  selectedParcel?: ParcelData | null
  onParcelSelect?: (parcel: ParcelData) => void
  showOwnership?: boolean
  className?: string
}

export default function ParcelMap({
  parcels,
  selectedParcel,
  onParcelSelect,
  showOwnership = false,
  className = "h-96 w-full"
}: ParcelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets')
  const [showZoning, setShowZoning] = useState(false)
  const [showFloodZones, setShowFloodZones] = useState(false)

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      // Use Mapbox token - fallback to public token if not set
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'your_mapbox_public_token_here'

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // This provides the base map tiles
        center: [-73.37, 41.15], // Centered on Fairfield County, CT
        zoom: 10,
        attributionControl: true
      })

      map.current.on('load', () => {
        console.log('Map loaded successfully')
        setMapLoaded(true)
        addMapControls()
      })

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e)
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add map controls
  const addMapControls = () => {
    if (!map.current) return

    // Navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

    // Fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left')

    // Geolocate control
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-left')
  }

  // Add parcel boundaries to map
  const addParcelBoundaries = useCallback(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing sources and layers
    if (map.current.getSource('parcels')) {
      map.current.removeLayer('parcel-boundaries')
      map.current.removeLayer('parcel-fills')
      map.current.removeSource('parcels')
    }

    // Create GeoJSON data
    const geojson = {
      type: 'FeatureCollection',
      features: parcels.map(parcel => ({
        type: 'Feature',
        properties: {
          parcel_id: parcel.parcel_id,
          address: parcel.address,
          city: parcel.city,
          state: parcel.state,
          zip_code: parcel.zip_code,
          list_price: parcel.list_price ?? null,
          listing_status: parcel.listing_status ?? null,
          highlight: parcel.highlight ?? false,
          property_type: parcel.property_type ?? parcel.property_details?.property_type ?? null,
          lot_size_acres: parcel.lot_size_acres ?? parcel.property_details?.acreage ?? null,
          updated_at: parcel.updated_at ?? null,
          ownership: showOwnership ? parcel.ownership ?? null : null
        },
        geometry: parcel.boundary
      }))
    }

    // Add parcel data source
    map.current.addSource('parcels', {
      type: 'geojson',
      data: geojson as any
    })

    // Add parcel fill layer
    map.current.addLayer({
      id: 'parcel-fills',
      type: 'fill',
      source: 'parcels',
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#ec4899',
          ['==', ['get', 'highlight'], true],
          '#fb923c',
          ['get', 'list_price'],
          [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'list_price'], 0],
            0, '#e2e8f0',
            500000, '#c7d2fe',
            750000, '#a5b4fc',
            1000000, '#818cf8',
            1500000, '#6366f1',
            2000000, '#4f46e5',
            3000000, '#4338ca',
            '#312e81'
          ],
          '#f5f5f5'
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          0.85,
          ['==', ['get', 'highlight'], true],
          0.7,
          0.45
        ]
      }
    })

    // Add parcel boundary layer
    map.current.addLayer({
      id: 'parcel-boundaries',
      type: 'line',
      source: 'parcels',
      paint: {
        'line-color': '#666',
        'line-width': 1,
        'line-opacity': 0.8
      }
    })

    map.current.on('click', 'parcel-fills', (e) => {
      if (onParcelSelect && e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        if (properties && properties.parcel_id) {
          const parcel = parcels.find(p => p.parcel_id === properties.parcel_id)
          if (parcel) {
            onParcelSelect(parcel)
          }
        }
      }
    })

    // Change cursor on hover
    map.current.on('mouseenter', 'parcel-fills', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer'
      }
    })

    map.current.on('mouseleave', 'parcel-fills', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = ''
      }
    })

    // Fit map to show all parcels
    if (parcels.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      parcels.forEach(parcel => {
        bounds.extend([parcel.coordinates.lng, parcel.coordinates.lat])
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [mapLoaded, parcels, showOwnership, onParcelSelect])

  // Update map style
  const changeMapStyle = (style: 'streets' | 'satellite' | 'terrain') => {
    if (map.current) {
      setMapStyle(style)
      map.current.setStyle(`mapbox://styles/mapbox/${style}-v12`)

      // Re-add parcel data after style change
      map.current.once('styledata', () => {
        addParcelBoundaries()
      })
    }
  }

  // Center map on selected parcel
  useEffect(() => {
    if (!map.current || !selectedParcel) return

    map.current.flyTo({
      center: [selectedParcel.coordinates.lng, selectedParcel.coordinates.lat],
      zoom: 16,
      duration: 750
    })
  }, [selectedParcel])

  // Update parcels when data changes
  useEffect(() => {
    if (mapLoaded) {
      addParcelBoundaries()
    }
  }, [parcels, mapLoaded, showOwnership, addParcelBoundaries])

  // Update feature-state for selection/highlight sync
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    parcels.forEach(parcel => {
      map.current?.setFeatureState(
        { source: 'parcels', id: parcel.parcel_id },
        { selected: selectedParcel?.parcel_id === parcel.parcel_id }
      )
    })
  }, [parcels, selectedParcel, mapLoaded])

  return (
    <div className={`map-container relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <div className="flex space-x-1">
          <button
            onClick={() => changeMapStyle('streets')}
            className={`px-3 py-1 text-xs rounded ${mapStyle === 'streets' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            Street
          </button>
          <button
            onClick={() => changeMapStyle('satellite')}
            className={`px-3 py-1 text-xs rounded ${mapStyle === 'satellite' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            Satellite
          </button>
          <button
            onClick={() => changeMapStyle('terrain')}
            className={`px-3 py-1 text-xs rounded ${mapStyle === 'terrain' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            Terrain
          </button>
        </div>

        <div className="border-t pt-2 space-y-1">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showZoning}
              onChange={(e) => setShowZoning(e.target.checked)}
              className="mr-2"
            />
            Zoning
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showFloodZones}
              onChange={(e) => setShowFloodZones(e.target.checked)}
              className="mr-2"
            />
            Flood Zones
          </label>
        </div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  )
}
