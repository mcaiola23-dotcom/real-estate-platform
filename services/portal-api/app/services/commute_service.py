"""
Commute calculation service using Google Distance Matrix API with caching.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
import requests
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.config import settings


class CommuteService:
    """Service for calculating and caching commute times."""
    
    PRESET_DESTINATIONS = {
        "nyc_grand_central": "Grand Central Terminal, New York, NY",
        "nyc_penn": "Penn Station, New York, NY",
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.api_key = settings.google_server_api_key
    
    def get_commute(
        self,
        parcel_id: str,
        destination_type: str,
        custom_address: Optional[str] = None
    ) -> Optional[Dict]:
        """Get commute time with caching."""
        
        # Check cache first
        cached = self._get_from_cache(parcel_id, destination_type, custom_address)
        if cached:
            return cached
        
        # Get parcel coordinates
        result = self.db.execute(
            text("SELECT ST_Y(centroid) as lat, ST_X(centroid) as lng FROM parcels WHERE parcel_id = :pid"),
            {"pid": parcel_id}
        ).fetchone()
        
        if not result:
            return None
        
        origin = f"{result.lat},{result.lng}"
        
        # Determine destination
        if destination_type in self.PRESET_DESTINATIONS:
            destination = self.PRESET_DESTINATIONS[destination_type]
        elif custom_address:
            destination = custom_address
        else:
            return None
        
        # Call API (if key configured)
        if not self.api_key:
            return {"error": "Google Maps API key not configured"}
        
        commute_data = self._call_distance_matrix(origin, destination)
        
        if commute_data:
            # Cache result
            self._save_to_cache(parcel_id, destination_type, custom_address, commute_data)
        
        return commute_data
    
    def _get_from_cache(
        self,
        parcel_id: str,
        destination_type: str,
        custom_address: Optional[str]
    ) -> Optional[Dict]:
        """Check cache for existing result."""
        
        query = text("""
            SELECT drive_time_min, drive_time_peak_min, transit_time_min, distance_miles
            FROM commute_cache
            WHERE parcel_id = :pid
            AND destination_type = :dtype
            AND (:custom IS NULL OR destination_address = :custom)
            AND expires_at > NOW()
            LIMIT 1
        """)
        
        result = self.db.execute(query, {
            "pid": parcel_id,
            "dtype": destination_type,
            "custom": custom_address
        }).fetchone()
        
        if result:
            return {
                "drive_time_min": result.drive_time_min,
                "drive_time_peak_min": result.drive_time_peak_min,
                "transit_time_min": result.transit_time_min,
                "distance_miles": result.distance_miles,
                "cached": True
            }
        
        return None
    
    def _save_to_cache(
        self,
        parcel_id: str,
        destination_type: str,
        custom_address: Optional[str],
        data: Dict
    ):
        """Save result to cache with 30-day expiration."""
        
        expires_at = datetime.now() + timedelta(days=30)
        
        query = text("""
            INSERT INTO commute_cache (
                parcel_id, destination_type, destination_address,
                drive_time_min, drive_time_peak_min, transit_time_min,
                distance_miles, expires_at
            )
            VALUES (
                :pid, :dtype, :custom,
                :drive, :peak, :transit,
                :distance, :expires
            )
        """)
        
        self.db.execute(query, {
            "pid": parcel_id,
            "dtype": destination_type,
            "custom": custom_address,
            "drive": data.get("drive_time_min"),
            "peak": data.get("drive_time_peak_min"),
            "transit": data.get("transit_time_min"),
            "distance": data.get("distance_miles"),
            "expires": expires_at
        })
        self.db.commit()
    
    def _call_distance_matrix(self, origin: str, destination: str) -> Optional[Dict]:
        """Call Google Distance Matrix API."""
        
        try:
            url = "https://maps.googleapis.com/maps/api/distancematrix/json"
            params = {
                "origins": origin,
                "destinations": destination,
                "key": self.api_key,
                "mode": "driving",
                "units": "imperial"
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data["status"] == "OK" and data["rows"]:
                element = data["rows"][0]["elements"][0]
                
                if element["status"] == "OK":
                    return {
                        "drive_time_min": element["duration"]["value"] // 60,
                        "distance_miles": round(element["distance"]["value"] * 0.000621371, 2),
                        "cached": False
                    }
            
            return None
            
        except Exception as e:
            print(f"[ERROR] Distance Matrix API call failed: {e}")
            return None




