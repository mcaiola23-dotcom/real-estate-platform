'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// Import Leaflet map dynamically to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)

export default function TestLeafletPage() {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')

  const tileUrls = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  }

  const attributions = {
    streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Leaflet Map Test</h1>
        <p className="text-stone-500 mb-6">Testing Leaflet with OpenStreetMap tiles (no API token needed)</p>

        {/* Status Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium mr-2">Map Library:</span>
              <span className="text-emerald-600">Leaflet (Open Source)</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Tile Provider:</span>
              <span className="text-emerald-600">
                {mapStyle === 'streets' ? 'OpenStreetMap' : 'Esri World Imagery'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">API Token:</span>
              <span className="text-emerald-600">Not Required ✓</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Map Status:</span>
              <span className={mapLoaded ? 'text-emerald-600' : 'text-amber-600'}>
                {mapLoaded ? '✅ Ready' : '⏳ Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">What You Should See:</h2>
          <ul className="list-disc list-inside space-y-2 text-stone-600">
            <li><strong>Streets View:</strong> Detailed street map with roads, buildings, labels</li>
            <li><strong>Satellite View:</strong> Aerial/satellite imagery</li>
            <li>Zoom controls (+/-) on the left</li>
            <li>Ability to pan by dragging</li>
            <li>Map centered on Fairfield County, CT</li>
          </ul>
          
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded">
            <p className="text-emerald-700 font-medium">✓ Benefits of Leaflet:</p>
            <ul className="list-disc list-inside text-sm text-emerald-700 mt-2">
              <li>Free and open source - no API tokens or costs</li>
              <li>Uses OpenStreetMap community-maintained maps</li>
              <li>Proven performance for property mapping</li>
              <li>Your previous version used this successfully</li>
            </ul>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
          <div className="h-[600px] w-full">
            {typeof window !== 'undefined' && (
              <MapContainer
                center={[41.15, -73.37]} // Fairfield County
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                whenReady={() => setMapLoaded(true)}
              >
                <TileLayer
                  url={tileUrls[mapStyle]}
                  attribution={attributions[mapStyle]}
                />
              </MapContainer>
            )}
          </div>

          {/* Map style controls */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-[1000]">
            <div className="flex space-x-1">
              <button
                onClick={() => setMapStyle('streets')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  mapStyle === 'streets' 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Street
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  mapStyle === 'satellite' 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-stone-800 text-green-400 rounded-lg p-4 font-mono text-sm">
          <p>🔍 <strong>Debug Info:</strong></p>
          <p>Map Library: Leaflet (react-leaflet 4.2.1)</p>
          <p>Tile URL: {tileUrls[mapStyle]}</p>
          <p>Center: 41.15°N, -73.37°W (Fairfield County)</p>
          <p>Status: {mapLoaded ? 'Loaded ✓' : 'Loading...'}</p>
        </div>

        {/* Comparison Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">📊 Mapbox vs Leaflet Comparison:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-yellow-900">Mapbox (Previous Attempt):</p>
              <ul className="list-disc list-inside text-yellow-700 mt-1">
                <li>Requires API token</li>
                <li>Demo token rejected (403 error)</li>
                <li>Paid service after free tier</li>
                <li>More advanced features</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-green-900">Leaflet (Current):</p>
              <ul className="list-disc list-inside text-emerald-700 mt-1">
                <li>No API token needed ✓</li>
                <li>Free and open source ✓</li>
                <li>Proven for property maps ✓</li>
                <li>Your previous version ✓</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





