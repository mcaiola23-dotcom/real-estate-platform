'use client'

import { useState, useRef, useEffect } from 'react'
import { Layers } from 'lucide-react'

interface MapLayersPanelProps {
  layers: {
    neighborhoods: boolean
    schools: boolean
    flood_zones: boolean
    parcels: boolean
    heatmap: boolean
  }
  onLayerToggle: (layer: keyof MapLayersPanelProps['layers']) => void
  className?: string
}

export default function MapLayersPanel({
  layers,
  onLayerToggle,
  className = ''
}: MapLayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const layerOptions = [
    { key: 'neighborhoods' as const, label: 'Neighborhoods' },
    { key: 'schools' as const, label: 'School Districts' },
    { key: 'flood_zones' as const, label: 'Flood Zones' },
    { key: 'parcels' as const, label: 'Parcel Boundaries' },
    { key: 'heatmap' as const, label: 'Price Heatmap' },
  ]

  const activeLayerCount = Object.values(layers).filter(Boolean).length

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border shadow-sm transition-all ${
          isOpen || activeLayerCount > 0
            ? 'bg-stone-900 text-white border-stone-900 shadow-md'
            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 hover:shadow-md'
        }`}
        title="Map Layers"
      >
        <Layers className="h-3.5 w-3.5" />
        <span>Layers</span>
        {activeLayerCount > 0 && (
          <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0 leading-tight ${
            isOpen || activeLayerCount > 0 ? 'bg-white/20' : 'bg-stone-200'
          }`}>
            {activeLayerCount}
          </span>
        )}
      </button>

      {/* Layers Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-stone-200 w-60 z-[35] overflow-hidden">
          {/* Layer Options */}
          <div className="py-1.5">
            {layerOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => onLayerToggle(option.key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-stone-50 transition-colors text-left"
              >
                <span className={`text-sm ${layers[option.key] ? 'font-medium text-stone-900' : 'text-stone-600'}`}>
                  {option.label}
                </span>
                <div
                  className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${
                    layers[option.key] ? 'bg-stone-900' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform ${
                      layers[option.key] ? 'translate-x-[14px]' : ''
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
