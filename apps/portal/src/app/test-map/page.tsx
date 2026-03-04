'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

export default function TestMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [tokenStatus, setTokenStatus] = useState<string>('Checking...')

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Get token from environment
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    if (!token) {
      setTokenStatus('ERROR: No token found')
      setMapError('Mapbox token not found in environment variables')
      return
    }

    setTokenStatus(`Token found: ${token.substring(0, 20)}...`)
    mapboxgl.accessToken = token

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-73.37, 41.15], // Fairfield County
        zoom: 10,
        attributionControl: true
      })

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully')
        setMapLoaded(true)
        setMapError(null)
      })

      map.current.on('error', (e) => {
        console.error('❌ Mapbox error:', e)
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`)
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

    } catch (error) {
      console.error('❌ Failed to initialize map:', error)
      setMapError(`Initialization error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mapbox Configuration Test</h1>
        <p className="text-stone-500 mb-6">This page tests if Mapbox is configured correctly</p>

        {/* Status Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium mr-2">Token Status:</span>
              <span className={tokenStatus.includes('ERROR') ? 'text-red-600' : 'text-emerald-600'}>
                {tokenStatus}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Map Status:</span>
              <span className={mapLoaded ? 'text-emerald-600' : mapError ? 'text-red-600' : 'text-amber-600'}>
                {mapLoaded ? '✅ Loaded' : mapError ? '❌ Error' : '⏳ Loading...'}
              </span>
            </div>
            {mapError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm"><strong>Error:</strong> {mapError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">What You Should See:</h2>
          <ul className="list-disc list-inside space-y-2 text-stone-600">
            <li>A map showing Fairfield County, Connecticut</li>
            <li>Street names, buildings, and landmarks visible</li>
            <li>Ability to zoom in/out using controls</li>
            <li>Ability to pan by dragging</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">If You Only See Gray/Blank:</h3>
          <ul className="list-disc list-inside space-y-1 text-stone-600 text-sm">
            <li>Check the browser console (F12) for errors</li>
            <li>Verify Mapbox token is valid</li>
            <li>Check Network tab for 401/403 errors to api.mapbox.com</li>
          </ul>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            ref={mapContainer} 
            className="w-full h-[600px]"
            style={{ minHeight: '600px' }}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-stone-800 text-green-400 rounded-lg p-4 font-mono text-sm">
          <p>🔍 <strong>Debug Info:</strong></p>
          <p>Mapbox GL version: {mapboxgl.version}</p>
          <p>Window origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
          <p>API Base: /api/portal</p>
        </div>
      </div>
    </div>
  )
}




