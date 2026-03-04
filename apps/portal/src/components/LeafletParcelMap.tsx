'use client'

import { memo, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import type { Polygon, MultiPolygon, FeatureCollection } from 'geojson'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import OverlayLayer from './OverlayLayer'

const API_BASE = '/api/portal';
const MAX_BOUNDARY_FEATURES_Z15_16 = 300
const MAX_BOUNDARY_FEATURES_Z17 = 600
const MAX_BOUNDARY_FEATURES_Z18 = 900
const MAX_MARKERS_Z10_14 = 300
const MAX_MARKERS_Z15_PLUS = 600
const debugLog = (..._args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(..._args)
  }
}

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Format price to shorthand (e.g., $1.3M, $750K)
const formatShortPrice = (price: number | null | undefined): string => {
  if (!price) return ''
  if (price >= 1000000) {
    const millions = price / 1000000
    return millions >= 10 ? `$${Math.round(millions)}M` : `$${millions.toFixed(1)}M`
  }
  if (price >= 1000) {
    const thousands = price / 1000
    return `$${Math.round(thousands)}K`
  }
  return `$${price}`
}

// Status color configuration
const STATUS_COLORS = {
  'Active': { bg: '#10b981', border: '#059669', text: '#ffffff' },      // Green
  'Pending': { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },     // Orange
  'Contingent': { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },  // Orange (treat as Pending)
  'Sold': { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },        // Gray
  'Off-Market': { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },  // Gray
}

// Create price bubble marker with status-based colors
const createPriceMarker = (
  price: number | null | undefined,
  status: string,
  isSearchResult: boolean = true,
  isSelected: boolean = false,
  isHovered: boolean = false
) => {
  const priceText = formatShortPrice(price)
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Off-Market']
  const opacity = isSearchResult ? 1.0 : 0.6

  // Calculate dynamic width based on price text length
  const textLength = priceText.length
  const width = Math.max(45, textLength * 8 + 12)
  const height = 22

  // Enhanced styling for selected/hovered states
  const scale = isSelected ? 1.15 : isHovered ? 1.1 : 1
  const zIndex = isSelected ? 1000 : isHovered ? 900 : 1
  const shadow = isSelected || isHovered
    ? '0 4px 12px rgba(0,0,0,0.4)'
    : '0 2px 6px rgba(0,0,0,0.3)'

  return L.divIcon({
    html: `
      <div class="price-marker-container" style="
        transform: scale(${scale});
        transform-origin: center bottom;
        z-index: ${zIndex};
        transition: transform 0.15s ease-out;
      ">
        <div style="
          background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%);
          color: ${colors.text};
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: ${shadow};
          border: 2px solid ${isSelected ? '#ffffff' : colors.border};
          opacity: ${opacity};
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: ${width}px;
          height: ${height}px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.3px;
          cursor: pointer;
        ">${priceText || '•'}</div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${colors.border};
        "></div>
      </div>
    `,
    className: 'price-marker',
    iconSize: [width, height + 6],
    iconAnchor: [width / 2, height + 6],
    popupAnchor: [0, -height - 6]
  })
}

// Legacy circular marker for context (non-search result) parcels without price
const createDotMarker = (status: string) => {
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Off-Market']
  const size = 12

  return L.divIcon({
    html: `
      <div style="
        background-color: ${colors.bg};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        opacity: 0.5;
      "></div>
    `,
    className: 'dot-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

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
  thumbnail_url?: string | null  // Listing photo thumbnail
  isSearchResult?: boolean // Flag to distinguish search results from context parcels
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

interface LeafletParcelMapProps {
  parcels: ParcelData[]
  selectedParcel?: ParcelData | null
  onParcelSelect?: (parcel: ParcelData) => void
  onPinProperty?: (parcel: ParcelData) => void
  pinnedParcelIds?: Set<string>
  onViewportChange?: (bounds: [number, number, number, number], zoom: number) => void
  showOwnership?: boolean
  className?: string
  minZoomForParcels?: number
  mapRef?: React.MutableRefObject<any> // Expose map instance to parent
  showNeighborhoods?: boolean // Toggle neighborhood boundary overlays
  schools?: boolean
  flood_zones?: boolean
  selectedCities?: string[] // Filter neighborhoods by selected cities
  onFilterChange?: (type: string, value: any) => void
}

// Component to render neighborhood boundaries
function NeighborhoodLayer({
  showNeighborhoods,
  schools,
  flood_zones,
  selectedCities,
  onFilterChange // New prop
}: {
  showNeighborhoods: boolean
  schools?: boolean
  flood_zones?: boolean
  selectedCities?: string[]
  onFilterChange?: (type: string, value: any) => void
}) {
  const map = useMap()
  const [neighborhoodsGeoJSON, setNeighborhoodsGeoJSON] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!showNeighborhoods) {
      setNeighborhoodsGeoJSON(null)
      return
    }

    const fetchNeighborhoods = async () => {
      setLoading(true)
      try {
        const cityParam = selectedCities && selectedCities.length > 0
          ? `?city=${encodeURIComponent(selectedCities[0])}`
          : ''
        const url = `${API_BASE}/api/neighborhoods/boundaries${cityParam}`
        debugLog('🗺️ Fetching neighborhood boundaries from:', url)
        debugLog('🗺️ Selected cities:', selectedCities)
        const response = await fetch(url)
        debugLog('🗺️ Boundaries response status:', response.status)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Boundaries error:', errorText)
          throw new Error(`Failed to fetch boundaries: ${response.status}`)
        }
        const data = await response.json()
        setNeighborhoodsGeoJSON(data)
      } catch (error) {
        console.error('Error fetching neighborhood boundaries:', error)
        setNeighborhoodsGeoJSON(null)
      } finally {
        setLoading(false)
      }
    }

    fetchNeighborhoods()
  }, [showNeighborhoods, selectedCities])

  if (!showNeighborhoods || !neighborhoodsGeoJSON || !neighborhoodsGeoJSON.features || neighborhoodsGeoJSON.features.length === 0) {
    return null
  }

  return (
    <GeoJSON
      key={JSON.stringify(selectedCities)} // Force re-render when cities change
      data={neighborhoodsGeoJSON}
      style={{
        fillColor: '#2563eb',
        fillOpacity: 0, // Transparent fill, only borders
        color: '#2563eb', // Blue to match School Districts style
        weight: 2, // Thinner border for cleaner look
        opacity: 0.9,
        // No dashArray for solid line
      }}
      onEachFeature={(feature, layer) => {
        if (feature.properties) {
          const props = feature.properties;
          layer.bindTooltip(
            `<div style="font-size: 12px; font-weight: 600; text-align: center;">${props.name}</div>
             <div style="font-size: 10px; text-align: center; margin-bottom: 4px;">${props.city}</div>
             <div style="display: flex; gap: 8px; justify-content: center; font-size: 10px; margin-top: 4px; border-top: 1px solid #ddd; pt-1;">
               <div style="color: #10b981; font-weight: 600;">${props.active_count || 0} Active</div>
               <div style="color: #f59e0b; font-weight: 600;">${props.pending_count || 0} Pending</div>
               <div style="color: #6b7280; font-weight: 600;">${props.sold_count || 0} Sold</div>
             </div>
             <div style="font-size: 9px; text-align: center; margin-top: 4px; color: #666; font-style: italic;">Click to filter map</div>`,
            {
              permanent: false,
              direction: 'center',
              className: 'neighborhood-tooltip',
              opacity: 0.95
            }
          )

          // Click Handler
          layer.on('click', () => {
            debugLog('🏘️ Neighborhood Clicked:', props.name, props.id)
            if (onFilterChange) {
              onFilterChange('neighborhood', props.id)
            }
          })
        }
      }}
    />
  )
}

// Component to preserve map instance and prevent reinitialization
function MapPreserver({
  mapInstanceRef,
  externalMapRef
}: {
  mapInstanceRef: React.MutableRefObject<any>
  externalMapRef?: React.MutableRefObject<any>
}) {
  const map = useMap()

  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = map
      debugLog('🗺️ Map instance captured, zoom:', map.getZoom())
    }
    // Also set external ref if provided (for parent components)
    if (externalMapRef && !externalMapRef.current) {
      externalMapRef.current = map
    }

    return () => {
      if (externalMapRef?.current === map) {
        externalMapRef.current = null
      }
      if (mapInstanceRef.current === map) {
        mapInstanceRef.current = null
      }
    }
  }, [map, mapInstanceRef, externalMapRef])

  return null
}

// Component to handle map centering when selection changes
function MapController({ selectedParcel }: { selectedParcel?: ParcelData | null }) {
  const map = useMap()
  const lastSelectedIdRef = useRef<string | null>(null)
  const isZoomingRef = useRef(false)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    // Track zoom start/end to prevent auto-pan during zoom
    const onZoomStart = () => { isZoomingRef.current = true }
    const onZoomEnd = () => {
      // Longer delay to prevent pan immediately after zoom
      // This gives the user time to pan manually after zooming
      setTimeout(() => { isZoomingRef.current = false }, 1500)
    }

    // Track drag/pan to prevent auto-pan during manual navigation
    const onDragStart = () => { isDraggingRef.current = true }
    const onDragEnd = () => {
      // Delay to prevent auto-pan immediately after manual drag
      setTimeout(() => { isDraggingRef.current = false }, 1000)
    }

    map.on('zoomstart', onZoomStart)
    map.on('zoomend', onZoomEnd)
    map.on('dragstart', onDragStart)
    map.on('dragend', onDragEnd)

    return () => {
      map.off('zoomstart', onZoomStart)
      map.off('zoomend', onZoomEnd)
      map.off('dragstart', onDragStart)
      map.off('dragend', onDragEnd)
    }
  }, [map])

  useEffect(() => {
    // Only pan if it's a new selection (not a re-render of the same selection)
    // Use ref instead of state to avoid triggering re-renders
    if (selectedParcel && selectedParcel.parcel_id !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = selectedParcel.parcel_id

      // Don't pan during zoom or drag operations
      if (isZoomingRef.current || isDraggingRef.current) {
        return
      }

      // Check if parcel is already in view
      const bounds = map.getBounds()
      const parcelLatLng = L.latLng(selectedParcel.coordinates.lat, selectedParcel.coordinates.lng)

      // Only pan if parcel is not currently visible and we're zoomed in enough
      const currentZoom = map.getZoom()
      if (!bounds.contains(parcelLatLng) && currentZoom >= 13) {
        map.panTo(parcelLatLng, { animate: true, duration: 0.3 })
      }
    }
  }, [selectedParcel, map])

  return null
}

// Component to track zoom and viewport changes
function ZoomHandler({
  onViewportChange,
  minZoomForParcels
}: {
  onViewportChange?: (bounds: [number, number, number, number], zoom: number) => void
  minZoomForParcels: number
}) {
  const map = useMap()
  const [currentZoom, setCurrentZoom] = useState(map.getZoom())
  const [showZoomNotice, setShowZoomNotice] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleViewportChange = useCallback(() => {
    try {
      const zoom = map.getZoom()
      const bounds = map.getBounds()
      const boundsArray: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ]

      setCurrentZoom(zoom)

      // Always notify parent of zoom changes - let parent decide what to do based on zoom level
      if (onViewportChange) {
        onViewportChange(boundsArray, zoom)
      }
    } catch (error) {
      console.error('Error handling viewport change:', error)
    }
  }, [map, onViewportChange])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const debouncedHandler = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleViewportChange, 500) // 500ms debounce on pan
    }

    map.on('moveend', debouncedHandler)
    map.on('zoomend', handleViewportChange) // Immediate on zoom

    // Note: We don't call handleViewportChange() immediately here anymore
    // because it was causing cascading updates. The map will trigger it naturally.

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      map.off('moveend', debouncedHandler)
      map.off('zoomend', handleViewportChange)
    }
  }, [map, handleViewportChange])

  // Auto-fade zoom notice after 4 seconds, re-show on zoom change
  useEffect(() => {
    if (currentZoom < minZoomForParcels) {
      setShowZoomNotice(true)
      setFadeOut(false)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setShowZoomNotice(false), 500) // 500ms for fade animation
      }, 4000)
    } else {
      setShowZoomNotice(false)
      setFadeOut(false)
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [currentZoom, minZoomForParcels])

  // Show message if zoom is too low (with auto-fade)
  if (currentZoom < minZoomForParcels && showZoomNotice) {
    return (
      <div
        className="leaflet-control leaflet-bar"
        style={{
          position: 'absolute',
          top: '80px',
          right: '10px',
          zIndex: 800,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: '8px 12px',
          maxWidth: '180px',
          border: '1px solid #e7e5e4',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <div className="text-xs text-stone-600">
          <div className="font-medium">Zoom in to see parcels</div>
        </div>
      </div>
    )
  }

  return null
}

function LeafletParcelMapComponent({
  parcels,
  selectedParcel,
  onParcelSelect,
  onPinProperty,
  pinnedParcelIds = new Set(),
  onViewportChange,
  showOwnership = false,
  className = 'h-96 w-full',
  minZoomForParcels = 15, // Default: zoom level 15 to see parcels (shows ~50-100 parcels)
  mapRef, // External ref for parent to access map instance
  showNeighborhoods = false,
  schools = false,
  flood_zones = false,
  selectedCities = [],
  onFilterChange
}: LeafletParcelMapProps) {
  const [mapReady, setMapReady] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'hybrid'>('streets')
  const [currentZoom, setCurrentZoom] = useState(9)
  const [geojsonKey, setGeojsonKey] = useState(0)
  const mapInstanceRef = useRef<any>(null) // Track map instance to prevent reinitialization
  const mapContainerKeyRef = useRef(`fairfield-county-map-${Math.random().toString(36).slice(2)}`)

  // Memoize the viewport change handler to prevent ZoomHandler re-initialization
  // This is critical - without memoization, a new function is created on every render,
  // causing ZoomHandler's useEffect to re-run and trigger map resets
  const handleZoomChange = useCallback((bounds: [number, number, number, number], zoom: number) => {
    setCurrentZoom(zoom)
    if (onViewportChange) {
      onViewportChange(bounds, zoom)
    }
  }, [onViewportChange])

  // Only update GeoJSON key if parcels actually changed (not just re-renders)
  const parcelsRef = useRef<ParcelData[]>(parcels)
  const lastParcelIdsRef = useRef<string>('')

  useEffect(() => {
    // Create a hash of parcel IDs to detect actual changes
    const currentParcelIds = parcels.map(p => p.parcel_id).sort().join(',')

    if (currentParcelIds !== lastParcelIdsRef.current) {
      lastParcelIdsRef.current = currentParcelIds
      parcelsRef.current = parcels
      setGeojsonKey(prev => prev + 1)
    }
  }, [parcels])

  const boundaryParcels = useMemo(() => {
    const hasBoundaryGeometry = parcels.filter((parcel) => {
      const geometry = parcel.boundary as any
      return Boolean(geometry && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0)
    })
    const maxFeatures = currentZoom >= 18
      ? MAX_BOUNDARY_FEATURES_Z18
      : currentZoom >= 17
        ? MAX_BOUNDARY_FEATURES_Z17
        : MAX_BOUNDARY_FEATURES_Z15_16
    if (hasBoundaryGeometry.length <= maxFeatures) {
      return hasBoundaryGeometry
    }
    return hasBoundaryGeometry.slice(0, maxFeatures)
  }, [parcels, currentZoom])

  // Convert parcels to GeoJSON FeatureCollection
  const geojsonData = useMemo<FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaryParcels.map(parcel => ({
      type: 'Feature',
      id: parcel.parcel_id,
      properties: {
        parcel_id: parcel.parcel_id,
        address: parcel.address,
        city: parcel.city,
        state: parcel.state,
        zip_code: parcel.zip_code,
        list_price: parcel.list_price,
        listing_status: parcel.listing_status,
        highlight: parcel.highlight,
        property_type: parcel.property_type,
        lot_size_acres: parcel.lot_size_acres
      },
      geometry: parcel.boundary
    }))
  }), [boundaryParcels])

  const markerParcels = useMemo(() => {
    const allMarkers = parcels.filter(p => p.listing_status || p.isSearchResult)
    const maxMarkers = currentZoom >= 15 ? MAX_MARKERS_Z15_PLUS : MAX_MARKERS_Z10_14
    if (allMarkers.length <= maxMarkers) {
      return allMarkers
    }
    return allMarkers.slice(0, maxMarkers)
  }, [parcels, currentZoom])

  const parcelsById = useMemo(() => new Map(parcels.map((parcel) => [parcel.parcel_id, parcel])), [parcels])
  const priceMarkerIconCacheRef = useRef<Map<string, L.DivIcon>>(new Map())
  const dotMarkerIconCacheRef = useRef<Map<string, L.DivIcon>>(new Map())

  const getPriceMarkerIcon = useCallback((
    price: number | null | undefined,
    status: string,
    isSearchResult: boolean,
    isSelected: boolean
  ) => {
    const cacheKey = `${price ?? 'na'}|${status}|${isSearchResult ? 1 : 0}|${isSelected ? 1 : 0}`
    const iconCache = priceMarkerIconCacheRef.current
    const cachedIcon = iconCache.get(cacheKey)
    if (cachedIcon) {
      return cachedIcon
    }

    const icon = createPriceMarker(price, status, isSearchResult, isSelected, false)
    if (iconCache.size > 4000) {
      iconCache.clear()
    }
    iconCache.set(cacheKey, icon)
    return icon
  }, [])

  const getDotMarkerIcon = useCallback((status: string) => {
    const cacheKey = status || 'Off-Market'
    const iconCache = dotMarkerIconCacheRef.current
    const cachedIcon = iconCache.get(cacheKey)
    if (cachedIcon) {
      return cachedIcon
    }

    const icon = createDotMarker(status)
    iconCache.set(cacheKey, icon)
    return icon
  }, [])

  // Style function for parcel polygons
  const getParcelStyle = (feature: any) => {
    const isHighlighted = feature?.properties?.highlight
    const isSelected = selectedParcel?.parcel_id === feature?.properties?.parcel_id
    const listPrice = feature?.properties?.list_price

    if (isSelected) {
      return {
        fillColor: '#ec4899', // Pink for selected
        fillOpacity: 0.7,
        color: '#be185d',
        weight: 3
      }
    }

    if (isHighlighted) {
      return {
        fillColor: '#fb923c', // Orange for highlighted
        fillOpacity: 0.6,
        color: '#ea580c',
        weight: 2
      }
    }

    // Color by list price
    if (listPrice) {
      const colors = [
        { max: 500000, color: '#c7d2fe' },
        { max: 750000, color: '#a5b4fc' },
        { max: 1000000, color: '#818cf8' },
        { max: 1500000, color: '#6366f1' },
        { max: 2000000, color: '#4f46e5' },
        { max: 3000000, color: '#4338ca' },
        { max: Infinity, color: '#312e81' }
      ]

      const colorEntry = colors.find(c => listPrice <= c.max)
      return {
        fillColor: colorEntry?.color || '#e2e8f0',
        fillOpacity: 0.5,
        color: '#666',
        weight: 1
      }
    }

    // Default style (no listing)
    return {
      fillColor: '#f5f5f5',
      fillOpacity: 0.3,
      color: '#999',
      weight: 1
    }
  }

  // Handle parcel click
  const onEachFeature = useCallback((feature: any, layer: any) => {
    const parcelId = feature.properties.parcel_id
    const props = feature.properties
    const isPinned = pinnedParcelIds.has(parcelId)

    layer.on({
      click: (e: any) => {
        // Notify parent component of selection (opens modal)
        if (onParcelSelect) {
          const parcel = parcelsById.get(parcelId)
          if (parcel) {
            onParcelSelect(parcel)
          }
        }
      }
    })

    // Bind popup with property info and pin button
    const pinIcon = isPinned ? '📌' : '📍'
    const pinText = isPinned ? 'Pinned' : 'Pin'

    const popupContent = `
      <div style="min-width: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <strong style="flex: 1;">${props.address}</strong>
          <button 
            onclick="document.dispatchEvent(new CustomEvent('togglePin', { detail: '${parcelId}' }))"
            style="background: ${isPinned ? '#3b82f6' : '#6b7280'}; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 8px; white-space: nowrap;"
            title="${isPinned ? 'Remove from pinned' : 'Add to pinned panel'}"
          >
            ${pinIcon} ${pinText}
          </button>
        </div>
        <div style="color: #666;">
          ${props.city}, ${props.state} ${props.zip_code || ''}<br/>
          ${props.list_price ? `<strong>Price:</strong> $${props.list_price.toLocaleString()}` : 'Not Listed'}<br/>
          ${props.property_type ? `<strong>Type:</strong> ${props.property_type}<br/>` : ''}
          ${props.lot_size_acres ? `<strong>Lot:</strong> ${props.lot_size_acres.toFixed(2)} acres` : ''}
        </div>
        ${isPinned ? '<div style="margin-top: 8px; padding: 4px 8px; background: #dbeafe; border-radius: 4px; font-size: 11px; color: #1e40af;">📌 Added to pinned panel</div>' : ''}
        <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">Click parcel to view details</div>
      </div>
    `

    layer.bindPopup(popupContent, {
      closeButton: true,
      autoClose: true,
      closeOnClick: false
    })
  }, [onParcelSelect, parcelsById, pinnedParcelIds])

  // Listen for pin toggle events from popup buttons
  useEffect(() => {
    const handlePinToggle = (e: any) => {
      const parcelId = e.detail
      const parcel = parcelsById.get(parcelId)
      if (parcel && onPinProperty) {
        onPinProperty(parcel)
      }
    }

    document.addEventListener('togglePin', handlePinToggle)
    return () => {
      document.removeEventListener('togglePin', handlePinToggle)
    }
  }, [onPinProperty, parcelsById])

  // Tile layer URLs
  const tileUrls = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    hybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' // Base layer for hybrid
  }

  const attributions = {
    streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping',
    hybrid: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping'
  }

  // Memoize initial map props to prevent recreation
  const initialCenter = useMemo(() => [41.15, -73.37] as [number, number], [])
  const initialZoom = useMemo(() => 9, [])

  return (
    <div className={`map-container relative ${className}`}>
      <MapContainer
        key={mapContainerKeyRef.current}
        center={initialCenter} // Fairfield County, CT
        zoom={initialZoom} // Start zoomed out to show Fairfield County outline
        maxZoom={18} // Allow zooming up to level 18 for detailed property views
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        preferCanvas={true}
        zoomAnimation={true}
      >
        {/* Base map tiles */}
        <TileLayer
          url={tileUrls[mapStyle]}
          attribution={attributions[mapStyle]}
          maxZoom={18}
          maxNativeZoom={18}
        />

        {/* Hybrid mode: Add labels overlay on top of satellite */}
        {mapStyle === 'hybrid' && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            opacity={0.3}
            maxZoom={18}
            maxNativeZoom={18}
          />
        )}

        {/* Neighborhood Overlay */}
        <NeighborhoodLayer
          showNeighborhoods={showNeighborhoods}
          selectedCities={selectedCities}
          onFilterChange={onFilterChange}
        />

        {/* Generic Overlays */}
        <OverlayLayer layerId="schools" isVisible={!!schools} onFilterChange={onFilterChange} />
        <OverlayLayer layerId="flood_zones" isVisible={!!flood_zones} onFilterChange={onFilterChange} />

        {/* Parcel boundaries - only show at appropriate zoom */}
        {parcels.length > 0 && currentZoom >= minZoomForParcels && (
          <GeoJSON
            key={`parcels-geojson-${geojsonKey}`}
            data={geojsonData}
            style={getParcelStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Price bubble markers - show price with status-based colors */}
        {markerParcels.map(parcel => {
            const status = parcel.listing_status || 'Off-Market'
            const isSearchResult = parcel.isSearchResult !== false
            const isSelected = selectedParcel?.parcel_id === parcel.parcel_id
            const price = parcel.list_price || parcel.market_data?.estimated_value

            // Use price bubble for search results with price, dot marker for others
            const usesPriceBubble = isSearchResult && price

            return (
              <Marker
                key={`marker-${isSearchResult ? 'search' : 'context'}-${parcel.parcel_id}`}
                position={[parcel.coordinates.lat, parcel.coordinates.lng]}
                icon={usesPriceBubble
                  ? getPriceMarkerIcon(price, status, isSearchResult, isSelected)
                  : getDotMarkerIcon(status)
                }
                zIndexOffset={isSelected ? 1000 : isSearchResult ? 100 : 0}
                eventHandlers={{
                  click: () => {
                    if (onParcelSelect) {
                      onParcelSelect(parcel)
                    }
                  },
                  mouseover: (e) => {
                    // Scale up marker on hover
                    const container = e.target.getElement()?.querySelector('.price-marker-container')
                    if (container) {
                      (container as HTMLElement).style.transform = 'scale(1.1)'
                    }
                  },
                  mouseout: (e) => {
                    // Reset scale on mouse leave
                    const container = e.target.getElement()?.querySelector('.price-marker-container')
                    if (container && !isSelected) {
                      (container as HTMLElement).style.transform = 'scale(1)'
                    }
                  }
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <div className="font-bold text-stone-900">{parcel.address}</div>
                    <div className="text-stone-500 text-xs">{parcel.city}, {parcel.state}</div>
                    {parcel.list_price && (
                      <div className="text-lg font-bold text-stone-900 mt-2">
                        ${parcel.list_price.toLocaleString()}
                      </div>
                    )}
                    {parcel.market_data?.estimated_value && !parcel.list_price && (
                      <div className="text-stone-900 font-semibold mt-2">
                        Est. ${parcel.market_data.estimated_value.toLocaleString()}
                      </div>
                    )}
                    {/* Property details */}
                    {parcel.property_details && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                        {parcel.property_details.bedrooms && (
                          <span>{parcel.property_details.bedrooms} bd</span>
                        )}
                        {parcel.property_details.bathrooms && (
                          <span>{parcel.property_details.bathrooms} ba</span>
                        )}
                        {parcel.property_details.square_feet && (
                          <span>{parcel.property_details.square_feet.toLocaleString()} sqft</span>
                        )}
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: status === 'Active' ? '#10b981' :
                            status === 'Pending' || status === 'Contingent' ? '#f59e0b' :
                              '#6b7280'
                        }}
                      ></span>
                      <span className="text-xs font-medium text-stone-500">{status}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {/* Map instance preserver - prevents reinitialization */}
        <MapPreserver mapInstanceRef={mapInstanceRef} externalMapRef={mapRef} />

        {/* Zoom handler - tracks zoom and shows message */}
        <ZoomHandler
          onViewportChange={handleZoomChange}
          minZoomForParcels={minZoomForParcels}
        />

        {/* Map controller for selection */}
        <MapController selectedParcel={selectedParcel} />
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-[30]">
        <div className="flex space-x-1">
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-3 py-1 text-xs rounded transition-colors ${mapStyle === 'streets'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapStyle('hybrid')}
            className={`px-3 py-1 text-xs rounded transition-colors ${mapStyle === 'hybrid'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
          >
            Hybrid
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1 text-xs rounded transition-colors ${mapStyle === 'satellite'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 z-[35]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto"></div>
            <p className="mt-4 text-stone-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

const LeafletParcelMap = memo(LeafletParcelMapComponent)
LeafletParcelMap.displayName = 'LeafletParcelMap'

export default LeafletParcelMap
