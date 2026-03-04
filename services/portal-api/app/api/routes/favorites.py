"""
Favorites API routes for authenticated users.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from ...db import get_db
from ...models.user import User, UserFavorite
from ...models.listing import Listing
from ...models.parcel import Parcel
from ...core.auth import get_current_user
from ...core.config import settings
from ...avm.prediction import AvmPredictionService
from geoalchemy2.shape import to_shape

router = APIRouter(prefix="/favorites", tags=["favorites"])


# -------------------
# Request/Response Schemas
# -------------------

class FavoriteCreate(BaseModel):
    listing_id: Optional[int] = None
    parcel_id: Optional[str] = None


class FavoriteResponse(BaseModel):
    favorite_id: int
    listing_id: Optional[int] = None
    parcel_id: Optional[str] = None
    created_at: datetime
    
    # Property details
    property_address: Optional[str] = None
    property_city: Optional[str] = None
    property_state: Optional[str] = None
    property_zip: Optional[str] = None
    property_price: Optional[float] = None
    property_status: Optional[str] = None  # Active, Pending, Sold, Off-Market
    
    # Property characteristics
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    lot_size_acres: Optional[float] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    
    # Media
    photo_url: Optional[str] = None  # Main listing photo or Google Street View
    photos: Optional[List[str]] = None  # All photos
    
    # Special features
    has_pool: Optional[bool] = None
    is_waterfront: Optional[bool] = None

    class Config:
        from_attributes = True


class FavoriteListResponse(BaseModel):
    favorites: List[FavoriteResponse]
    total: int


# -------------------
# Routes
# -------------------

@router.get("", response_model=FavoriteListResponse)
async def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all favorites for the current user."""
    
    favorites = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.user_id
    ).order_by(UserFavorite.created_at.desc()).all()
    
    # Build response with property details
    response_favorites = []
    for fav in favorites:
        fav_response = {
            "favorite_id": fav.favorite_id,
            "listing_id": fav.listing_id,
            "parcel_id": fav.parcel_id,
            "created_at": fav.created_at,
            "property_address": None,
            "property_city": None,
            "property_state": None,
            "property_zip": None,
            "property_price": None,
            "property_status": "Off-Market",
            "bedrooms": None,
            "bathrooms": None,
            "square_feet": None,
            "lot_size_acres": None,
            "year_built": None,
            "property_type": None,
            "photo_url": None,
            "photos": None,
            "has_pool": None,
            "is_waterfront": None,
        }
        
        # Get listing details if available
        if fav.listing_id and fav.listing:
            listing = fav.listing
            fav_response["property_address"] = listing.address_full
            fav_response["property_city"] = listing.city
            fav_response["property_state"] = listing.state
            fav_response["property_zip"] = listing.zip_code
            fav_response["property_status"] = listing.status or "Active"
            fav_response["bedrooms"] = listing.bedrooms
            fav_response["bathrooms"] = float(listing.bathrooms) if listing.bathrooms else None
            fav_response["square_feet"] = listing.square_feet
            fav_response["lot_size_acres"] = float(listing.acres) if listing.acres else None
            fav_response["year_built"] = listing.year_built
            fav_response["property_type"] = listing.property_type
            
            # Get price based on status
            if listing.status == "Sold" and listing.sold_price:
                fav_response["property_price"] = float(listing.sold_price)
            elif listing.list_price:
                fav_response["property_price"] = float(listing.list_price)
            
            # Photos
            if listing.photos and len(listing.photos) > 0:
                fav_response["photo_url"] = listing.photos[0]
                fav_response["photos"] = listing.photos
            
            # Special features (check listing remarks or features if available)
            # These would need actual data columns - for now, leave as None
            
        elif fav.parcel_id and fav.parcel:
            parcel = fav.parcel
            fav_response["property_address"] = parcel.address_full
            fav_response["property_city"] = parcel.city
            fav_response["property_state"] = parcel.state
            fav_response["property_zip"] = parcel.zip_code
            fav_response["property_status"] = "Off-Market"
            fav_response["bedrooms"] = parcel.bedrooms
            fav_response["bathrooms"] = float(parcel.bathrooms) if parcel.bathrooms else None
            fav_response["square_feet"] = parcel.square_feet
            fav_response["lot_size_acres"] = float(parcel.lot_size_acres) if parcel.lot_size_acres else None
            fav_response["year_built"] = parcel.year_built
            fav_response["property_type"] = parcel.property_type
            
            # For off-market, get AVM value (DoorTag) instead of assessment
            avm_service = AvmPredictionService(db=db)
            avm_data = avm_service.get_latest_avm(fav.parcel_id)
            if avm_data and avm_data.get("estimated_value"):
                fav_response["property_price"] = avm_data["estimated_value"]
            elif parcel.assessment_total:
                # Fallback to assessment if no AVM available
                fav_response["property_price"] = float(parcel.assessment_total)
            
            # Generate Google Street View URL for off-market properties
            # Use pano_id if available for 100% consistency
            if parcel.street_view_pano_id:
                google_api_key = settings.google_server_api_key
                if google_api_key:
                    fav_response["photo_url"] = (
                        f"https://maps.googleapis.com/maps/api/streetview"
                        f"?size=640x320&pano={parcel.street_view_pano_id}"
                        f"&fov=90&key={google_api_key}"
                    )
            
            # Fallback to coordinates if no pano_id but street view is available
            elif parcel.street_view_available == 1:
                # Tablet model uses PostGIS geometry, need to extract lat/lng from centroid
                latitude = None
                longitude = None
                
                if parcel.centroid is not None:
                    try:
                        point = to_shape(parcel.centroid)
                        latitude = point.y
                        longitude = point.x
                    except Exception:
                        pass

                if latitude and longitude:
                    google_api_key = settings.google_server_api_key
                    if google_api_key:
                        fav_response["photo_url"] = (
                            f"https://maps.googleapis.com/maps/api/streetview"
                            f"?size=640x320&location={latitude},{longitude}"
                            f"&fov=90&key={google_api_key}"
                        )
        
        response_favorites.append(FavoriteResponse(**fav_response))
    
    return FavoriteListResponse(
        favorites=response_favorites,
        total=len(response_favorites)
    )


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    data: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a property to favorites."""
    
    if not data.listing_id and not data.parcel_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either listing_id or parcel_id is required"
        )
    
    # Check if already favorited
    query = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.user_id
    )
    
    if data.listing_id:
        existing = query.filter(UserFavorite.listing_id == data.listing_id).first()
    else:
        existing = query.filter(UserFavorite.parcel_id == data.parcel_id).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property already in favorites"
        )
    
    # Verify listing/parcel exists
    if data.listing_id:
        listing = db.query(Listing).filter(Listing.listing_id == data.listing_id).first()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
    
    if data.parcel_id:
        parcel = db.query(Parcel).filter(Parcel.parcel_id == data.parcel_id).first()
        if not parcel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parcel not found"
            )
    
    # Create favorite
    favorite = UserFavorite(
        user_id=current_user.user_id,
        listing_id=data.listing_id,
        parcel_id=data.parcel_id,
    )
    
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    # Build response
    response = {
        "favorite_id": favorite.favorite_id,
        "listing_id": favorite.listing_id,
        "parcel_id": favorite.parcel_id,
        "created_at": favorite.created_at,
        "property_address": None,
        "property_city": None,
        "property_price": None,
    }
    
    if favorite.listing_id and favorite.listing:
        response["property_address"] = favorite.listing.address_full
        response["property_city"] = favorite.listing.city
        response["property_price"] = float(favorite.listing.list_price) if favorite.listing.list_price else None
    elif favorite.parcel_id and favorite.parcel:
        response["property_address"] = favorite.parcel.address
        response["property_city"] = favorite.parcel.city
    
    return FavoriteResponse(**response)


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a property from favorites."""
    
    favorite = db.query(UserFavorite).filter(
        UserFavorite.favorite_id == favorite_id,
        UserFavorite.user_id == current_user.user_id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return None


@router.delete("/by-property", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite_by_property(
    listing_id: Optional[int] = None,
    parcel_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a property from favorites by listing_id or parcel_id."""
    
    if not listing_id and not parcel_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either listing_id or parcel_id is required"
        )
    
    query = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.user_id
    )
    
    if listing_id:
        favorite = query.filter(UserFavorite.listing_id == listing_id).first()
    else:
        favorite = query.filter(UserFavorite.parcel_id == parcel_id).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return None


@router.get("/check")
async def check_favorite(
    listing_id: Optional[int] = None,
    parcel_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if a property is favorited."""
    
    if not listing_id and not parcel_id:
        return {"is_favorited": False}
    
    query = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.user_id
    )
    
    if listing_id:
        exists = query.filter(UserFavorite.listing_id == listing_id).first()
    else:
        exists = query.filter(UserFavorite.parcel_id == parcel_id).first()
    
    return {"is_favorited": exists is not None, "favorite_id": exists.favorite_id if exists else None}
