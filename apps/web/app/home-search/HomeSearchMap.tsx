"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useMemo, useRef, useState, useEffect } from "react";
import type { Listing, ListingBounds } from "../lib/data/providers/listings.types";
import { formatListingPrice } from "../lib/data/providers/listings.provider";

const markerStyle =
  "display:inline-flex;align-items:center;justify-content:center;" +
  "background:#111827;color:#ffffff;padding:4px 10px;border-radius:999px;" +
  "font-size:12px;font-weight:600;box-shadow:0 8px 18px rgba(0,0,0,0.2);" +
  "cursor:pointer;" +
  "border:1px solid rgba(255,255,255,0.2);";

function getMarkerIcon(price: number) {
  return L.divIcon({
    className: "listing-price-marker",
    html: `<div style="${markerStyle}">${formatListingPrice(price)}</div>`,
  });
}

function MapEvents({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: ListingBounds) => void;
}) {
  const hasInitialized = useRef(false);
  const map = useMapEvents({
    moveend: () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        return;
      }
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    zoomend: () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        return;
      }
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });

  return null;
}

function ListingMarker({
  listing,
  position,
  icon,
  onSelect,
}: {
  listing: Listing;
  position: [number, number];
  icon: L.DivIcon;
  onSelect: (listing: Listing) => void;
}) {
  const map = useMap();
  const [direction, setDirection] = useState<"top" | "bottom" | "left" | "right">("top");
  const [offset, setOffset] = useState<[number, number]>([0, -15]);

  // Smart direction calculation based on position within map container
  const calculateDirection = () => {
    if (!map) return;

    const containerSize = map.getSize();
    const point = map.latLngToContainerPoint(position);

    // Card dimensions (approximate: w-64 = 256px, total height ~200px)
    const cardWidth = 256;
    const cardHeight = 200;

    // Calculate available space in each direction
    const spaceTop = point.y;
    const spaceBottom = containerSize.y - point.y;
    const spaceLeft = point.x;
    const spaceRight = containerSize.x - point.x;

    // Determine best direction based on available space
    // Priority: top > bottom > right > left
    let newDirection: "top" | "bottom" | "left" | "right" = "top";
    let newOffset: [number, number] = [0, -15];

    if (spaceTop >= cardHeight + 20) {
      // Enough space above
      newDirection = "top";
      newOffset = [0, -15];
    } else if (spaceBottom >= cardHeight + 20) {
      // Enough space below
      newDirection = "bottom";
      newOffset = [0, 15];
    } else if (spaceRight >= cardWidth + 20) {
      // Try right side
      newDirection = "right";
      newOffset = [15, 0];
    } else if (spaceLeft >= cardWidth + 20) {
      // Try left side
      newDirection = "left";
      newOffset = [-15, 0];
    } else {
      // Default to bottom if nothing fits well (least likely to overlap with navigation)
      newDirection = "bottom";
      newOffset = [0, 15];
    }

    if (newDirection !== direction) {
      setDirection(newDirection);
      setOffset(newOffset);
    }
  };

  // Calculate direction on mount and whenever map changes
  useEffect(() => {
    calculateDirection();
  }, [map, position]);

  // Also recalculate on map events
  useMapEvents({
    move: calculateDirection,
    moveend: calculateDirection,
    zoom: calculateDirection,
    zoomend: calculateDirection,
    viewreset: calculateDirection,
  });

  // Check for touch device to disable tooltip
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: none)');
    setIsTouch(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(listing),
        mouseover: calculateDirection,
      }}
    >
      {!isTouch && (
        <Tooltip
          key={`${direction}-${offset[0]}-${offset[1]}`}
          direction={direction}
          offset={offset}
          opacity={1}
          className="!bg-transparent !border-0 !shadow-none !p-0"
        >
          <div className="w-64 bg-stone-900 rounded-lg overflow-hidden border border-stone-700 shadow-2xl">
            {/* Image */}
            <div
              className="h-32 w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${listing.photos[0] || "/placeholder.jpg"})`,
              }}
            />

            {/* Content */}
            <div className="p-3">
              <div className="text-lg font-serif text-white mb-0.5">
                {formatListingPrice(listing.price)}
              </div>
              <div className="text-xs text-stone-300 truncate font-medium mb-2">
                {listing.address.street}, {listing.address.city}
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-400 border-t border-stone-800 pt-2">
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium">{listing.beds}</span> bd
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium">{listing.baths}</span> ba
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium">
                    {listing.sqft.toLocaleString()}
                  </span>{" "}
                  sqft
                </div>
              </div>
            </div>
          </div>
        </Tooltip>
      )}
    </Marker>
  );
}

export default function HomeSearchMap({
  listings,
  center,
  onBoundsChange,
  onSelectListing,
}: {
  listings: Listing[];
  center: [number, number];
  onBoundsChange: (bounds: ListingBounds) => void;
  onSelectListing: (listing: Listing) => void;
}) {
  const markers = useMemo(
    () =>
      listings
        .filter((listing) => listing.lat !== undefined && listing.lng !== undefined)
        .map((listing) => ({
          id: listing.id,
          listing,
          position: [listing.lat!, listing.lng!] as [number, number],
          icon: getMarkerIcon(listing.price),
        })),
    [listings]
  );

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onBoundsChange={onBoundsChange} />
      {markers.map((marker) => (
        <ListingMarker
          key={marker.id}
          listing={marker.listing}
          position={marker.position}
          icon={marker.icon}
          onSelect={onSelectListing}
        />
      ))}
    </MapContainer>
  );
}
