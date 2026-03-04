"""
Google Places API proxy endpoints.
Keeps API key secure on backend while providing autocomplete functionality to frontend.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import requests
from ...core.config import settings

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/autocomplete")
async def places_autocomplete(
    input: str = Query(..., min_length=2, description="Search query for address"),
    types: str = Query("address", description="Types of results (address, geocode, establishment)"),
    components: str = Query("country:us", description="Component restrictions")
):
    """
    Proxy for Google Places Autocomplete API.
    Keeps API key secure on backend.
    
    Returns address suggestions as user types.
    """
    places_api_key = settings.google_places_proxy_api_key
    if not places_api_key:
        raise HTTPException(
            status_code=503, 
            detail=(
                "Google Places API key not configured "
                "(GOOGLE_PLACES_API_KEY or legacy GOOGLE_MAPS_API_KEY)."
            )
        )
    
    try:
        # Call Google Places Autocomplete API
        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        params = {
            "input": input,
            "types": types,
            "components": components,
            "key": places_api_key
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            print(f"[Places API] Error: {data.get('status')} - {data.get('error_message', '')}")
            raise HTTPException(
                status_code=503,
                detail=f"Google Places API error: {data.get('status')}"
            )
        
        # Transform predictions to simpler format
        predictions = []
        for prediction in data.get("predictions", []):
            predictions.append({
                "description": prediction.get("description"),
                "place_id": prediction.get("place_id"),
                "main_text": prediction.get("structured_formatting", {}).get("main_text"),
                "secondary_text": prediction.get("structured_formatting", {}).get("secondary_text"),
            })
        
        return {
            "status": "success",
            "predictions": predictions,
            "count": len(predictions)
        }
        
    except requests.exceptions.RequestException as e:
        print(f"[Places API] Request error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch address suggestions"
        )
    except Exception as e:
        print(f"[Places API] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.get("/details")
async def place_details(
    place_id: str = Query(..., description="Google Place ID")
):
    """
    Get detailed information about a place.
    Used to get formatted address after user selects a suggestion.
    """
    places_api_key = settings.google_places_proxy_api_key
    if not places_api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Places API key not configured "
                "(GOOGLE_PLACES_API_KEY or legacy GOOGLE_MAPS_API_KEY)."
            )
        )
    
    try:
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "formatted_address,name,geometry",
            "key": places_api_key
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") != "OK":
            print(f"[Place Details] Error: {data.get('status')}")
            raise HTTPException(
                status_code=503,
                detail=f"Google Places API error: {data.get('status')}"
            )
        
        result = data.get("result", {})
        
        return {
            "status": "success",
            "formatted_address": result.get("formatted_address"),
            "name": result.get("name"),
            "location": result.get("geometry", {}).get("location")
        }
        
    except requests.exceptions.RequestException as e:
        print(f"[Place Details] Request error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch place details"
        )
    except Exception as e:
        print(f"[Place Details] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


