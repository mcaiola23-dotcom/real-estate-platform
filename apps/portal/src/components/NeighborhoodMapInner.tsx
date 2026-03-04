'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ParcelFeature {
  type: 'Feature';
  id: string;
  geometry: any;
  properties: {
    parcel_id: string;
    address_full?: string;
    city?: string;
    list_price?: number;
    status?: string;
    lot_size_acres?: number;
    centroid?: [number, number];
    listing_id?: number;
  };
}

interface NeighborhoodMapInnerProps {
  latitude: number;
  longitude: number;
  subjectParcelId: string;
  parcels: ParcelFeature[];
  avmPrices: Record<string, number>;
  onBoundsChange?: (bbox: string, zoom: number) => void;
  onPropertyClick?: (parcelId: string, listingId?: number) => void;
}

function formatShortPrice(price: number | null | undefined): string {
  if (!price) return '';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

/** Handles map events via react-leaflet hooks (guaranteed map access) */
function MapEventHandler({ onBoundsChange }: { onBoundsChange?: (bbox: string, zoom: number) => void }) {
  const map = useMap();

  // After mount: invalidate size then fire initial bounds change for the real viewport
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      // Explicitly fetch parcels for the actual viewport (not the pre-computed bbox)
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        const zoom = map.getZoom();
        onBoundsChange(bbox, zoom);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [map, onBoundsChange]);

  // Attach moveend for dynamic parcel loading on pan/zoom
  useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        const zoom = map.getZoom();
        onBoundsChange(bbox, zoom);
      }
    },
  });

  return null;
}

function createSubjectMarkerIcon(): L.DivIcon {
  // Distinctive house-pin marker with pulsing ring
  return L.divIcon({
    html: `
      <div style="position: relative; width: 44px; height: 52px;">
        <div style="
          position: absolute; top: 50%; left: 50%; width: 52px; height: 52px;
          transform: translate(-50%, -50%);
          border-radius: 50%; background: rgba(14,165,233,0.2);
          animation: subjectPulse 2s ease-in-out infinite;
        "></div>
        <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: relative; z-index: 2; filter: drop-shadow(0 3px 8px rgba(0,0,0,0.4));">
          <path d="M22 0C10 0 0 10 0 22c0 16.5 22 30 22 30s22-13.5 22-30C44 10 34 0 22 0z" fill="#0ea5e9"/>
          <path d="M22 2C11.1 2 2 11.1 2 22c0 14.8 20 27.5 20 27.5s20-12.7 20-27.5C42 11.1 32.9 2 22 2z" fill="#0284c7"/>
          <circle cx="22" cy="20" r="14" fill="#0ea5e9"/>
          <path d="M22 11l-9 7.5v9.5h6v-5h6v5h6v-9.5L22 11z" fill="white"/>
        </svg>
      </div>
      <style>
        @keyframes subjectPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      </style>
    `,
    className: 'subject-property-marker',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
}

function createPriceBubble(
  price: number | null | undefined,
  status: string | undefined,
): L.DivIcon {
  const priceText = formatShortPrice(price);
  if (!priceText) {
    return L.divIcon({ html: '', className: 'empty-marker', iconSize: [0, 0] });
  }

  const bg = status === 'Active'
    ? '#16a34a'
    : status === 'Pending'
      ? '#ea580c'
      : status === 'Sold'
        ? '#78716c'
        : '#1c1917';

  const width = Math.max(45, priceText.length * 8 + 16);
  const height = 22;
  const shadow = '0 2px 6px rgba(0,0,0,0.25)';

  return L.divIcon({
    html: `
      <div style="z-index: 1;">
        <div style="
          background: ${bg}; color: #ffffff;
          padding: 3px 8px; border-radius: 12px;
          font-size: 11px; font-weight: 600; white-space: nowrap;
          box-shadow: ${shadow};
          border: 2px solid ${bg};
          display: flex; align-items: center; justify-content: center;
          min-width: ${width}px; height: ${height}px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.3px; cursor: pointer;
        ">${priceText}</div>
        <div style="
          position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 5px solid transparent; border-right: 5px solid transparent;
          border-top: 5px solid ${bg};
        "></div>
      </div>
    `,
    className: 'neighborhood-price-marker',
    iconSize: [width, height + 5],
    iconAnchor: [width / 2, height + 5],
    popupAnchor: [0, -height - 5],
  });
}

export default function NeighborhoodMapInner({
  latitude,
  longitude,
  subjectParcelId,
  parcels,
  avmPrices,
  onBoundsChange,
  onPropertyClick,
}: NeighborhoodMapInnerProps) {
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);
  const mapContainerKeyRef = useRef(`neighborhood-map-${Math.random().toString(36).slice(2)}`);

  const center: [number, number] = [latitude, longitude];

  // Build GeoJSON FeatureCollection for parcel boundaries
  const geoJsonData = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: parcels.filter((f) => f.geometry),
    };
  }, [parcels]);

  // Build markers for parcels with prices — always include the subject property
  const markers = useMemo(() => {
    type MarkerData = {
      parcelId: string;
      position: [number, number];
      price: number | null;
      status: string | undefined;
      isSubject: boolean;
      address: string | undefined;
      city: string | undefined;
      listingId: number | undefined;
    };

    let hasSubjectMarker = false;
    const result: MarkerData[] = [];

    for (const feature of parcels) {
      const props = feature.properties;
      const isSubject = props.parcel_id === subjectParcelId;
      const price = props.list_price || avmPrices[props.parcel_id] || null;
      if (!price && !isSubject) continue;

      const centroid = props.centroid;
      if (!centroid && !isSubject) continue;

      const position: [number, number] = centroid
        ? [centroid[1], centroid[0]]
        : [latitude, longitude];

      if (isSubject) hasSubjectMarker = true;

      result.push({
        parcelId: props.parcel_id,
        position,
        price,
        status: props.status,
        isSubject,
        address: props.address_full,
        city: props.city,
        listingId: props.listing_id,
      });
    }

    // Always ensure the subject property has a marker, even if not in API response
    if (!hasSubjectMarker) {
      result.push({
        parcelId: subjectParcelId || 'subject',
        position: [latitude, longitude],
        price: avmPrices[subjectParcelId] || null,
        status: undefined,
        isSubject: true,
        address: undefined,
        city: undefined,
        listingId: undefined,
      });
    }

    return result;
  }, [parcels, avmPrices, subjectParcelId, latitude, longitude]);

  // Parcel polygon style
  const getStyle = (feature: any) => {
    const isSubject = feature?.properties?.parcel_id === subjectParcelId;
    const isSelected = feature?.properties?.parcel_id === selectedParcel;

    if (isSubject) {
      return {
        fillColor: '#0ea5e9',
        fillOpacity: 0.2,
        color: '#0284c7',
        weight: 3,
      };
    }
    if (isSelected) {
      return {
        fillColor: '#f59e0b',
        fillOpacity: 0.25,
        color: '#d97706',
        weight: 2,
      };
    }
    return {
      fillColor: '#f5f5f4',
      fillOpacity: 0.08,
      color: '#ffffff',
      weight: 1.5,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on('click', () => {
      setSelectedParcel(feature.properties?.parcel_id || null);
    });
  };

  return (
    <MapContainer
      key={mapContainerKeyRef.current}
      center={center}
      zoom={18}
      maxZoom={19}
      minZoom={15}
      style={{ height: '100%', width: '100%', minHeight: '350px' }}
      className="aspect-[4/3] max-h-[500px]"
      scrollWheelZoom={false}
      zoomControl={true}
    >
      {/* Map event handler for dynamic loading and size fixes */}
      <MapEventHandler onBoundsChange={onBoundsChange} />

      {/* Satellite base layer */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="&copy; Esri"
        maxZoom={19}
      />
      {/* Street labels overlay */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
        opacity={0.35}
        maxZoom={19}
      />

      {/* Parcel boundaries */}
      {geoJsonData.features.length > 0 && (
        <GeoJSON
          key={`parcels-${parcels.length}-${selectedParcel}`}
          data={geoJsonData as any}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      )}

      {/* Price markers */}
      {markers.map((m) => (
        <Marker
          key={m.parcelId}
          position={m.position}
          icon={m.isSubject ? createSubjectMarkerIcon() : createPriceBubble(m.price, m.status)}
          zIndexOffset={m.isSubject ? 1000 : 0}
        >
          <Popup>
            <div className="text-xs min-w-[160px]">
              <p className="font-semibold text-stone-900">{m.address || 'Unknown Address'}</p>
              {m.city && <p className="text-stone-500">{m.city}</p>}
              {m.price != null && m.price > 0 && (
                <p className="font-bold text-stone-900 mt-1">
                  {formatShortPrice(m.price)}
                  {m.status && <span className="ml-1 text-stone-400">({m.status})</span>}
                  {!m.status && <span className="ml-1 text-stone-400">(Est.)</span>}
                </p>
              )}
              {m.isSubject ? (
                <p className="text-sky-600 font-medium mt-1.5">This Property</p>
              ) : onPropertyClick ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPropertyClick(m.parcelId, m.listingId);
                  }}
                  className="mt-2 w-full px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  View Property
                </button>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
