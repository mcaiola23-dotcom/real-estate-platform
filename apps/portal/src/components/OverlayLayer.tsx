'use client'

import { useEffect, useState } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import { Layer } from 'leaflet'

interface OverlayLayerProps {
    layerId: string
    isVisible: boolean
    style?: any
    onFilterChange?: (type: string, value: any) => void
}

const API_BASE = '/api/portal';
const debugLog = (..._args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(..._args)
    }
}

export default function OverlayLayer({ layerId, isVisible, onFilterChange }: OverlayLayerProps) {
    const map = useMap()
    const [geoData, setGeoData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [style, setStyle] = useState<any>(null)

    useEffect(() => {
        if (!isVisible) {
            setGeoData(null)
            return
        }

        const fetchLayer = async () => {
            setLoading(true)
            try {
                const bounds = map.getBounds()
                const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
                const zoom = Math.round(map.getZoom())

                const response = await fetch(
                    `${API_BASE}/api/map/overlays/${layerId}?bbox=${bbox}&zoom=${zoom}&limit=1000`
                )

                if (!response.ok) throw new Error('Failed to fetch overlay')

                const data = await response.json()
                setGeoData(data)

                // Set style from metadata if available
                if (data.metadata?.style) {
                    setStyle(data.metadata.style)
                }
            } catch (err) {
                console.error(`Error loading layer ${layerId}:`, err)
            } finally {
                setLoading(false)
            }
        }

        fetchLayer()

        // Refresh on move end?
        const onMoveEnd = () => {
            if (isVisible) fetchLayer()
        }

        map.on('moveend', onMoveEnd)
        return () => {
            map.off('moveend', onMoveEnd)
        }
    }, [layerId, isVisible, map])

    if (!isVisible || !geoData) return null

    const getStyle = (feature: any) => {
        if (!style) return { color: '#3388ff', weight: 1, fillOpacity: 0.1 }

        // Base style
        const baseStyle = {
            color: style.color || '#3388ff',
            weight: style.weight || 1,
            opacity: style.opacity || 0.6,
            fillColor: style.fillColor || style.color || '#3388ff',
            fillOpacity: style.fillOpacity || 0.1
        }

        // Apply rules if present (e.g. for flood zones)
        if (style.rules && Array.isArray(style.rules)) {
            for (const rule of style.rules) {
                if (feature.properties && feature.properties[rule.prop] === rule.val) {
                    return { ...baseStyle, ...rule.style }
                }
            }
        }

        return baseStyle
    }

    const onEachFeature = (feature: any, layer: Layer) => {
        if (feature.properties) {
            const props = feature.properties
            const isSchool = layerId === 'schools'

            // Custom Tooltip for Schools (with Stats)
            if (isSchool && props.active_count !== undefined) {
                const content = `
                  <div style="font-size: 12px; font-weight: 600; text-align: center;">${props.NAME || props.TOWN}</div>
                  <div style="font-size: 10px; text-align: center; margin-bottom: 4px;">School District / Town</div>
                  <div style="display: flex; gap: 8px; justify-content: center; font-size: 10px; margin-top: 4px; border-top: 1px solid #ddd; pt-1;">
                    <div style="color: #10b981; font-weight: 600;">${props.active_count || 0} Active</div>
                    <div style="color: #f59e0b; font-weight: 600;">${props.pending_count || 0} Pending</div>
                    <div style="color: #6b7280; font-weight: 600;">${props.sold_count || 0} Sold</div>
                  </div>
                  <div style="font-size: 9px; text-align: center; margin-top: 4px; color: #666; font-style: italic;">Click to filter map</div>
                `
                layer.bindTooltip(content, {
                    permanent: false,
                    direction: 'center',
                    className: 'neighborhood-tooltip', // Reuse neighborhood style
                    opacity: 0.95
                })
            } else {
                // Default Popup for others/Flood
                const entries = Object.entries(props)
                    .filter(([key]) => !['geom', 'geometry', 'wkb_geometry', 'active_count', 'pending_count', 'sold_count'].includes(key))

                const content = `
                <div class="p-2 min-w-[150px]">
                  <h4 class="font-bold text-sm border-b pb-1 mb-1">${layerId === 'schools' ? 'School District' : 'Flood Zone'}</h4>
                  <div class="text-xs space-y-1">
                    ${entries.map(([key, val]) => `
                      <div class="grid grid-cols-2 gap-2">
                        <span class="text-stone-500 capitalize">${key.replace(/_/g, ' ')}:</span>
                        <span class="font-medium text-stone-900">${val}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `
                layer.bindPopup(content)
            }

            // Events
            layer.on({
                mouseover: (e: any) => {
                    const l = e.target
                    l.setStyle({ weight: 3, fillOpacity: 0.5 })
                    l.bringToFront()
                },
                mouseout: (e: any) => {
                    const s = getStyle(feature)
                    e.target.setStyle(s)
                },
                click: (e: any) => {
                    if (isSchool && onFilterChange) {
                        // Use injected town_name if available (from backend), else fallback
                        const town = props.town_name || props.TOWN || props.NAME || props.town
                        if (town) {
                            debugLog('🏫 School District Clicked:', town)
                            onFilterChange('city', town)
                        }
                    }
                }
            })
        }
    }

    return (
        <GeoJSON
            key={`${layerId}-${geoData.features.length}`}
            data={geoData}
            style={getStyle}
            onEachFeature={onEachFeature}
        />
    )
}
