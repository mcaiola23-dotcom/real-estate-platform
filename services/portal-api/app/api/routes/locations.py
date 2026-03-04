"""
User locations API routes for managing saved commute destinations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db import get_db
from app.models.user import UserLocation
from app.core.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/locations", tags=["locations"])


# Pydantic schemas
class LocationCreate(BaseModel):
    location_type: str = Field(..., description="Type: work, home, gym, school, daycare, partner_office, other")
    label: Optional[str] = Field(None, description="Custom label like 'Downtown Office'")
    address: str = Field(..., description="Full address string")
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    commute_mode: str = Field("driving", description="driving, transit, bicycling, walking")
    is_primary: bool = False


class LocationUpdate(BaseModel):
    location_type: Optional[str] = None
    label: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    commute_mode: Optional[str] = None
    is_primary: Optional[bool] = None


class LocationResponse(BaseModel):
    id: int
    location_type: str
    label: Optional[str]
    address: str
    lat: float
    lng: float
    commute_mode: str
    is_primary: bool
    
    class Config:
        from_attributes = True


# Valid location types
LOCATION_TYPES = ["work", "home", "gym", "school", "daycare", "partner_office", "other"]


@router.get("", response_model=List[LocationResponse])
async def list_locations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all saved locations for the current user."""
    locations = db.query(UserLocation).filter(
        UserLocation.user_id == current_user.user_id
    ).order_by(UserLocation.is_primary.desc(), UserLocation.created_at).all()
    
    return locations


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location: LocationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new saved location."""
    # Validate location type
    if location.location_type not in LOCATION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid location_type. Must be one of: {LOCATION_TYPES}"
        )
    
    # If this is set as primary, unset other primaries
    if location.is_primary:
        db.query(UserLocation).filter(
            UserLocation.user_id == current_user.user_id,
            UserLocation.is_primary == True
        ).update({"is_primary": False})
    
    # Create the location
    db_location = UserLocation(
        user_id=current_user.user_id,
        location_type=location.location_type,
        label=location.label,
        address=location.address,
        lat=location.lat,
        lng=location.lng,
        commute_mode=location.commute_mode,
        is_primary=location.is_primary
    )
    
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    
    return db_location


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific saved location."""
    location = db.query(UserLocation).filter(
        UserLocation.id == location_id,
        UserLocation.user_id == current_user.user_id
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return location


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_update: LocationUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a saved location."""
    location = db.query(UserLocation).filter(
        UserLocation.id == location_id,
        UserLocation.user_id == current_user.user_id
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Validate location type if provided
    if location_update.location_type and location_update.location_type not in LOCATION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid location_type. Must be one of: {LOCATION_TYPES}"
        )
    
    # If setting as primary, unset others
    if location_update.is_primary:
        db.query(UserLocation).filter(
            UserLocation.user_id == current_user.user_id,
            UserLocation.is_primary == True,
            UserLocation.id != location_id
        ).update({"is_primary": False})
    
    # Update fields
    update_data = location_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a saved location."""
    location = db.query(UserLocation).filter(
        UserLocation.id == location_id,
        UserLocation.user_id == current_user.user_id
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(location)
    db.commit()
    
    return None
