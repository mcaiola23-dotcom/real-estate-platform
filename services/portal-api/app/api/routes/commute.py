"""
Commute calculation endpoints using Google Distance Matrix API.

ON-DEMAND ONLY: Commute times are calculated when user views a property.
Results are cached for 30 days to minimize API costs.
"""

from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import requests
from urllib.parse import unquote

from ...db import get_db
from ...models.parcel import Parcel
from ...models.listing import Listing
from ...models.commute import CommuteCache
from ...models.school import School
from ...core.config import settings
from geoalchemy2.functions import ST_Distance, ST_DWithin
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/properties", tags=["commute"])


# Request/Response Models
class CommuteRequest(BaseModel):
    """Request to calculate commute time."""
    destination: str  # "nyc_grand_central", "nyc_penn", "nearest_train", or custom address


class CommuteResponse(BaseModel):
    """Commute calculation response."""
    destination: str
    destination_address: str
    drive_time_min: Optional[int]
    drive_time_peak_min: Optional[int]
    distance_miles: Optional[float]
    cached: bool
    nearest_station_name: Optional[str] = None
    estimated_train_time_min: Optional[int] = None  # Train time to Grand Central


# Preset destinations
PRESET_DESTINATIONS = {
    "nyc_grand_central": {
        "name": "NYC Grand Central",
        "address": "Grand Central Terminal, New York, NY 10017"
    }
}

# Metro-North train times to Grand Central (in minutes)
# Based on average express/local train schedules
TRAIN_TIMES_TO_GCT = {
    "Stamford": 45,
    "Greenwich": 50,
    "Darien": 55,
    "New Canaan": 65,
    "Norwalk": 65,
    "Westport": 75,
    "Fairfield": 80,
    "Bridgeport": 85,
    "Wilton": 70,
    "Cos Cob": 53,
    "Riverside": 48,
    "Old Greenwich": 52,
    "Rowayton": 62,
    "South Norwalk": 67,
}


def get_parcel_from_identifier(db: Session, identifier: str) -> Optional[Parcel]:
    """
    Get parcel from either listing_id or parcel_id.
    Handles both active listings and off-market properties.
    """
    normalized_identifier = unquote(identifier).strip()
    if not normalized_identifier:
        return None

    # Try as listing_id (integer)
    try:
        listing_id = int(normalized_identifier)
        listing = db.query(Listing).filter(Listing.listing_id == listing_id).first()
        if listing and listing.parcel_id:
            parcel = db.query(Parcel).filter(Parcel.parcel_id == listing.parcel_id).first()
            if parcel:
                return parcel
    except ValueError:
        pass
    
    # Try as parcel_id (string)
    parcel = db.query(Parcel).filter(Parcel.parcel_id == normalized_identifier).first()
    if parcel:
        return parcel

    # Fallback to raw identifier to preserve compatibility with existing callers.
    if normalized_identifier != identifier:
        parcel = db.query(Parcel).filter(Parcel.parcel_id == identifier).first()
    if parcel:
        return parcel
    
    return None


def find_nearest_train_station(db: Session, parcel: Parcel) -> Optional[Dict[str, Any]]:
    """
    Find nearest Metro-North or Amtrak train station to a parcel.
    Returns station info with name and address.
    """
    if not parcel.geometry:
        return None
    
    # For now, use schools table as a proxy for train stations
    # TODO: Replace with actual train_stations table when available
    # Query nearby locations (within 30 miles) and find the closest
    try:
        # This is a placeholder - in production you'd query a train_stations table
        # For now, return a hardcoded result based on Fairfield County locations
        # Most common stations: Stamford, Greenwich, Norwalk, Darien, New Canaan
        
        # Estimate based on city (rough approximation)
        city_stations = {
            "Stamford": ("Stamford Train Station", "27 Station Plaza, Stamford, CT 06902"),
            "Greenwich": ("Greenwich Train Station", "5 Railroad Avenue, Greenwich, CT 06830"),
            "Norwalk": ("Norwalk Train Station", "13 North Main Street, Norwalk, CT 06854"),
            "Darien": ("Darien Train Station", "1 Noroton Avenue, Darien, CT 06820"),
            "New Canaan": ("New Canaan Train Station", "78 Elm Street, New Canaan, CT 06840"),
            "Westport": ("Westport Train Station", "3 Sherwood Place, Westport, CT 06880"),
            "Fairfield": ("Fairfield Train Station", "611 Unquowa Road, Fairfield, CT 06824"),
            "Bridgeport": ("Bridgeport Train Station", "525 Water Street, Bridgeport, CT 06604"),
        }
        
        # Try to find station by city
        for city_name, (station_name, station_address) in city_stations.items():
            if parcel.city and city_name.lower() in parcel.city.lower():
                train_time = TRAIN_TIMES_TO_GCT.get(city_name, None)
                return {
                    "name": station_name,
                    "address": station_address,
                    "train_time_to_gct": train_time
                }
        
        # Default to Stamford (central hub)
        return {
            "name": "Stamford Train Station",
            "address": "27 Station Plaza, Stamford, CT 06902",
            "train_time_to_gct": TRAIN_TIMES_TO_GCT.get("Stamford", 45)
        }
        
    except Exception as e:
        print(f"[ERROR] Could not find nearest train station: {e}")
        return None


def call_google_distance_matrix(
    origin_address: str,
    destination_address: str
) -> Dict[str, Any]:
    """
    Call Google Distance Matrix API to calculate commute times.
    
    Returns:
        {
            "drive_time_min": int,
            "drive_time_peak_min": int,
            "distance_miles": float
        }
    """
    google_api_key = settings.google_server_api_key
    if not google_api_key:
        print("[WARNING] Google Maps API key not configured")
        return {
            "ok": False,
            "error_code": "MISSING_API_KEY",
            "error_message": (
                "GOOGLE_MAPS_SERVER_API_KEY is not configured "
                "(legacy fallback: GOOGLE_MAPS_API_KEY)."
            ),
        }
    
    try:
        # Regular driving time
        url_drive = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params_drive = {
            "origins": origin_address,
            "destinations": destination_address,
            "mode": "driving",
            "units": "imperial",
            "key": google_api_key
        }
        
        response_drive = requests.get(url_drive, params=params_drive, timeout=10)
        response_drive.raise_for_status()
        data_drive = response_drive.json()
        
        api_status = data_drive.get("status")
        if api_status != "OK":
            print(f"[ERROR] Google API error: {api_status} ({data_drive.get('error_message')})")
            return {
                "ok": False,
                "error_code": api_status or "UNKNOWN",
                "error_message": data_drive.get("error_message"),
            }
        
        rows_drive = data_drive.get("rows", [])
        if not rows_drive or not rows_drive[0].get("elements"):
            print("[ERROR] No route found")
            return {
                "ok": False,
                "error_code": "NO_RESULTS",
                "error_message": "No route rows returned by Google Distance Matrix.",
            }
        
        element_drive = rows_drive[0]["elements"][0]
        element_status = element_drive.get("status")
        if element_status != "OK":
            print(f"[ERROR] Route status: {element_status}")
            return {
                "ok": False,
                "error_code": element_status or "UNKNOWN_ROUTE_STATUS",
                "error_message": "Google returned a non-OK route element status.",
            }
        
        # Extract driving time and distance
        drive_time_sec = element_drive.get("duration", {}).get("value", 0)
        distance_meters = element_drive.get("distance", {}).get("value", 0)
        
        drive_time_min = round(drive_time_sec / 60)
        distance_miles = round(distance_meters * 0.000621371, 1)
        
        # Peak time driving (with traffic)
        params_peak = params_drive.copy()
        params_peak["departure_time"] = "now"
        params_peak["traffic_model"] = "pessimistic"
        
        response_peak = requests.get(url_drive, params=params_peak, timeout=10)
        response_peak.raise_for_status()
        data_peak = response_peak.json()
        
        drive_time_peak_min = drive_time_min  # Default to regular time
        if data_peak.get("status") == "OK":
            rows_peak = data_peak.get("rows", [])
            if rows_peak and rows_peak[0].get("elements"):
                element_peak = rows_peak[0]["elements"][0]
                if element_peak.get("status") == "OK":
                    duration_traffic = element_peak.get("duration_in_traffic", {}).get("value")
                    if duration_traffic:
                        drive_time_peak_min = round(duration_traffic / 60)
        else:
            print(
                "[WARNING] Google peak-time request returned non-OK status: "
                f"{data_peak.get('status')} ({data_peak.get('error_message')})"
            )

        return {
            "ok": True,
            "drive_time_min": drive_time_min,
            "drive_time_peak_min": drive_time_peak_min,
            "distance_miles": distance_miles,
        }

    except requests.RequestException as e:
        print(f"[ERROR] Google Distance Matrix HTTP request failed: {e}")
        return {
            "ok": False,
            "error_code": "REQUEST_EXCEPTION",
            "error_message": str(e),
        }
    except Exception as e:
        print(f"[ERROR] Google Distance Matrix API call failed: {e}")
        return {
            "ok": False,
            "error_code": "UNEXPECTED_ERROR",
            "error_message": str(e),
        }


@router.post("/{property_id:path}/calculate-commute", response_model=CommuteResponse)
async def calculate_commute(
    property_id: str = Path(..., description="Listing ID or Parcel ID (may contain slashes)"),
    request: CommuteRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Calculate commute time to a destination (ON-DEMAND ONLY).
    
    This endpoint:
    1. Checks cache first (30-day expiration)
    2. If not cached, calls Google Distance Matrix API
    3. Caches result for future requests
    4. Returns commute times (driving, peak, transit) and distance
    
    Works for both:
    - Active listings (listing_id from listings table)
    - Off-market properties (parcel_id from parcels table)
    
    Destination types:
    - "nyc_grand_central": Grand Central Terminal
    - "nyc_penn": Penn Station
    - "nearest_train": Closest Metro-North/Amtrak station
    - Custom address: Any valid address
    
    Cost: ~$0.005 per API call (only on cache miss)
    """
    if not settings.google_server_api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google server API key is not configured on portal-api "
                "(GOOGLE_MAPS_SERVER_API_KEY or legacy GOOGLE_MAPS_API_KEY)."
            )
        )

    # Get parcel (works for both listing_id and parcel_id)
    parcel = get_parcel_from_identifier(db, property_id)
    
    if not parcel:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Determine destination
    destination_input = request.destination
    destination_type = destination_input
    destination_address = None
    destination_display = None
    nearest_station_name = None
    estimated_train_time = None
    
    # Handle preset destinations
    if destination_input in PRESET_DESTINATIONS:
        preset = PRESET_DESTINATIONS[destination_input]
        destination_address = preset["address"]
        destination_display = preset["name"]
    elif destination_input == "nearest_train":
        station_info = find_nearest_train_station(db, parcel)
        if station_info:
            destination_address = station_info["address"]
            destination_display = station_info["name"]
            nearest_station_name = station_info["name"]
            estimated_train_time = station_info.get("train_time_to_gct")
        else:
            raise HTTPException(status_code=400, detail="Could not find nearest train station")
    else:
        # Custom address
        destination_type = "custom"
        destination_address = destination_input
        destination_display = destination_input
    
    # Check cache first
    cache_entry = db.query(CommuteCache).filter(
        CommuteCache.parcel_id == parcel.parcel_id,
        CommuteCache.destination_type == destination_type,
        CommuteCache.destination_address == destination_address,
        CommuteCache.expires_at > datetime.utcnow()
    ).first()
    
    if cache_entry:
        # Return cached result
        return CommuteResponse(
            destination=destination_display,
            destination_address=destination_address,
            drive_time_min=cache_entry.drive_time_min,
            drive_time_peak_min=cache_entry.drive_time_peak_min,
            distance_miles=cache_entry.distance_miles,
            cached=True,
            nearest_station_name=nearest_station_name,
            estimated_train_time_min=estimated_train_time
        )
    
    # Not cached - call Google API
    # Build complete address with city, state, zip for accurate geocoding
    if parcel.address_full:
        # Combine street address with city/state/zip
        origin_address = f"{parcel.address_full}, {parcel.city}, {parcel.state}"
        if parcel.zip_code:
            origin_address += f" {parcel.zip_code}"
    elif parcel.city:
        # Fallback to city/zip if street address not available
        origin_address = f"{parcel.city}, {parcel.state}"
        if parcel.zip_code:
            origin_address += f" {parcel.zip_code}"
    else:
        raise HTTPException(status_code=400, detail="Property address not available")
    
    print(f"[COMMUTE] Calculating: {origin_address} -> {destination_address}")
    
    result = call_google_distance_matrix(origin_address, destination_address)

    if not result.get("ok"):
        error_code = result.get("error_code")
        error_message = result.get("error_message")
        detail = "Unable to calculate commute time. Please try again later."

        if error_code in {"REQUEST_DENIED", "OVER_DAILY_LIMIT", "OVER_QUERY_LIMIT"}:
            detail = (
                f"Google Distance Matrix error: {error_code}."
                + (f" {error_message}" if error_message else "")
            )
        elif error_code == "MISSING_API_KEY":
            detail = (
                "Google server API key is not configured on portal-api "
                "(GOOGLE_MAPS_SERVER_API_KEY or legacy GOOGLE_MAPS_API_KEY)."
            )
        elif error_code in {"REQUEST_EXCEPTION", "UNEXPECTED_ERROR"} and error_message:
            detail = f"Google Distance Matrix request failed: {error_message}"

        raise HTTPException(status_code=503, detail=detail)
    
    # Cache the result (30-day expiration)
    new_cache = CommuteCache(
        parcel_id=parcel.parcel_id,
        destination_type=destination_type,
        destination_address=destination_address,
        drive_time_min=result["drive_time_min"],
        drive_time_peak_min=result["drive_time_peak_min"],
        transit_time_min=None,  # No longer calculating transit times
        distance_miles=result["distance_miles"],
        computed_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    
    db.add(new_cache)
    db.commit()
    
    print(f"[COMMUTE] Cached result for parcel {parcel.parcel_id}")
    
    return CommuteResponse(
        destination=destination_display,
        destination_address=destination_address,
        drive_time_min=result["drive_time_min"],
        drive_time_peak_min=result["drive_time_peak_min"],
        distance_miles=result["distance_miles"],
        cached=False,
        nearest_station_name=nearest_station_name,
        estimated_train_time_min=estimated_train_time
    )
