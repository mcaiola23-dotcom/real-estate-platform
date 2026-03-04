"""
Google Street View Static API Integration

Provides Street View images for properties with cost-conscious caching:
- Only checks availability when user views a property (on-demand)
- Caches availability status in database to avoid repeat API calls
- Generates image URLs dynamically (no API cost)
"""

import math
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from ..core.config import settings

class StreetViewService:
    """Service for Google Street View Static API integration."""
    
    def __init__(self):
        self.api_key = settings.google_server_api_key or ""
        self.enabled = settings.google_street_view_enabled
        
        if not self.api_key:
            print(
                "[StreetViewService] WARNING: Google server key is not configured "
                "(set GOOGLE_MAPS_SERVER_API_KEY or GOOGLE_MAPS_API_KEY)."
            )
        
        if not self.enabled:
            print("[StreetViewService] Street View is DISABLED")
    
    def is_available(self) -> bool:
        """Check if Street View service is available."""
        return self.enabled and bool(self.api_key)
    
    @staticmethod
    def _calculate_bearing(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> float:
        """Calculate compass bearing in degrees from one point to another."""
        lat1 = math.radians(from_lat)
        lat2 = math.radians(to_lat)
        diff_lng = math.radians(to_lng - from_lng)

        x = math.sin(diff_lng) * math.cos(lat2)
        y = (math.cos(lat1) * math.sin(lat2)
             - math.sin(lat1) * math.cos(lat2) * math.cos(diff_lng))

        return (math.degrees(math.atan2(x, y)) + 360) % 360

    def check_availability(
        self,
        latitude: float,
        longitude: float,
        address: Optional[str] = None,
        timeout: int = 5
    ) -> Dict[str, Any]:
        """
        Check if Street View is available at a specific location.

        This makes 1 API call to Google ($0.007 per call).
        Result should be cached in database to avoid repeat calls.

        Args:
            latitude: Property latitude
            longitude: Property longitude
            address: Full property address (more accurate than coordinates)
            timeout: Request timeout in seconds

        Returns:
            Dictionary with availability, heading, and location info
        """
        if not self.is_available():
            return {
                "available": False,
                "status": "SERVICE_UNAVAILABLE"
            }

        metadata_url = "https://maps.googleapis.com/maps/api/streetview/metadata"

        # Prefer address over coordinates for better accuracy
        location_param = address if address else f"{latitude},{longitude}"

        params = {
            "location": location_param,
            "key": self.api_key,
            "radius": "50"  # Search within 50 meters
        }

        try:
            response = requests.get(metadata_url, params=params, timeout=timeout)
            data = response.json()

            status = data.get("status")
            is_available = status == "OK"

            if is_available:
                # Get the actual panorama location
                pano_location = data.get("location", {})
                pano_lat = pano_location.get("lat", latitude)
                pano_lng = pano_location.get("lng", longitude)

                # Calculate bearing from panorama position to property
                heading = self._calculate_bearing(pano_lat, pano_lng, latitude, longitude)

                print(f"[StreetViewService] AVAILABLE at {location_param} (heading: {heading:.1f} deg)")

                return {
                    "available": True,
                    "status": status,
                    "heading": heading,
                    "pano_lat": pano_lat,
                    "pano_lng": pano_lng,
                    "pano_id": data.get("pano_id")
                }
            else:
                print(f"[StreetViewService] NOT AVAILABLE at {location_param} (status: {data.get('status')})")
                return {
                    "available": False,
                    "status": status or "UNKNOWN"
                }

        except Exception as e:
            print(f"[StreetViewService] Error checking availability: {e}")
            return {
                "available": False,
                "status": "REQUEST_ERROR"
            }
    
    def get_image_url(
        self,
        latitude: float,
        longitude: float,
        address: Optional[str] = None,
        pano_id: Optional[str] = None,
        heading: Optional[float] = None,
        width: int = 600,
        height: int = 400,
        pitch: int = -10,
        fov: int = 90
    ) -> str:
        """
        Generate Google Street View Static API image URL.
        
        This is FREE - no API call is made, just URL generation.
        The browser will load the image directly from Google.
        
        Args:
            latitude: Property latitude
            longitude: Property longitude
            address: Full property address (more accurate)
            heading: Camera heading in degrees (0-360, from metadata)
            width: Image width in pixels
            height: Image height in pixels
            pitch: Camera pitch (-90 to 90, negative is down)
            fov: Field of view (10-120 degrees)
            
        Returns:
            Street View image URL
        """
        if not self.api_key:
            return ""
        
        base_url = "https://maps.googleapis.com/maps/api/streetview"
        
        params = {
            "size": f"{width}x{height}",
            "pitch": str(pitch),
            "fov": str(fov),
            "key": self.api_key
        }

        # Use pano_id for stable image only when we also have a heading to
        # point the camera at the property.  Without a heading, fall back to
        # location-based lookup — Google will auto-orient toward the address.
        if pano_id and heading is not None:
            params["pano"] = pano_id
            params["heading"] = str(round(heading, 1))
        else:
            location_param = address if address else f"{latitude},{longitude}"
            params["location"] = location_param
            # Don't pass heading — let Google auto-calculate toward the address
        
        # Build query string (URL encode values)
        from urllib.parse import urlencode
        query_string = urlencode(params)
        return f"{base_url}?{query_string}"
    
    def get_thumbnail_url(
        self,
        latitude: float,
        longitude: float,
        address: Optional[str] = None,
        pano_id: Optional[str] = None,
        heading: Optional[float] = None
    ) -> str:
        """Get a smaller thumbnail version of the Street View image."""
        return self.get_image_url(
            latitude=latitude,
            longitude=longitude,
            address=address,
            pano_id=pano_id,
            heading=heading,
            width=300,
            height=200,
        )


# Global instance
street_view_service = StreetViewService()
