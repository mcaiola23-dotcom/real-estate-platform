"""
Search alerts API routes for authenticated users.
Allows users to create alerts from saved searches and receive notifications.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...db import get_db
from ...models.user import User, SavedSearch
from ...models.search_alert import SearchAlert
from ...core.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["alerts"])


# -------------------
# Request/Response Schemas
# -------------------

class AlertCreate(BaseModel):
    saved_search_id: int
    frequency: str = "daily"  # daily, weekly, instant
    

class AlertUpdate(BaseModel):
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


class AlertResponse(BaseModel):
    id: int
    saved_search_id: int
    search_name: str
    frequency: str
    is_active: bool
    last_sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int


# -------------------
# Valid frequency values
# -------------------
VALID_FREQUENCIES = ["daily", "weekly", "instant"]


# -------------------
# Routes
# -------------------

@router.get("", response_model=AlertListResponse)
async def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all search alerts for the current user."""
    
    alerts = db.query(SearchAlert).filter(
        SearchAlert.user_id == current_user.user_id
    ).order_by(SearchAlert.created_at.desc()).all()
    
    # Fetch saved search names
    alert_responses = []
    for alert in alerts:
        saved_search = db.query(SavedSearch).filter(
            SavedSearch.id == alert.saved_search_id
        ).first()
        
        search_name = saved_search.name if saved_search else "Unknown Search"
        
        alert_responses.append(AlertResponse(
            id=alert.id,
            saved_search_id=alert.saved_search_id,
            search_name=search_name,
            frequency=alert.frequency,
            is_active=alert.is_active,
            last_sent_at=alert.last_sent_at,
            created_at=alert.created_at
        ))
    
    return AlertListResponse(
        alerts=alert_responses,
        total=len(alert_responses)
    )


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new search alert from a saved search."""
    
    # Validate frequency
    if data.frequency not in VALID_FREQUENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frequency. Must be one of: {VALID_FREQUENCIES}"
        )
    
    # Verify saved search exists and belongs to user
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == data.saved_search_id,
        SavedSearch.user_id == current_user.user_id
    ).first()
    
    if not saved_search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved search not found"
        )
    
    # Check if alert already exists for this saved search
    existing = db.query(SearchAlert).filter(
        SearchAlert.saved_search_id == data.saved_search_id,
        SearchAlert.user_id == current_user.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert already exists for this saved search"
        )
    
    # Limit to 5 alerts per user
    alert_count = db.query(SearchAlert).filter(
        SearchAlert.user_id == current_user.user_id
    ).count()
    
    if alert_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 5 alerts allowed. Please delete one first."
        )
    
    # Create the alert
    alert = SearchAlert(
        user_id=current_user.user_id,
        saved_search_id=data.saved_search_id,
        frequency=data.frequency,
        is_active=True
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return AlertResponse(
        id=alert.id,
        saved_search_id=alert.saved_search_id,
        search_name=saved_search.name,
        frequency=alert.frequency,
        is_active=alert.is_active,
        last_sent_at=alert.last_sent_at,
        created_at=alert.created_at
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific alert."""
    
    alert = db.query(SearchAlert).filter(
        SearchAlert.id == alert_id,
        SearchAlert.user_id == current_user.user_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == alert.saved_search_id
    ).first()
    
    return AlertResponse(
        id=alert.id,
        saved_search_id=alert.saved_search_id,
        search_name=saved_search.name if saved_search else "Unknown Search",
        frequency=alert.frequency,
        is_active=alert.is_active,
        last_sent_at=alert.last_sent_at,
        created_at=alert.created_at
    )


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    data: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an alert's frequency or active status."""
    
    alert = db.query(SearchAlert).filter(
        SearchAlert.id == alert_id,
        SearchAlert.user_id == current_user.user_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Validate frequency if provided
    if data.frequency and data.frequency not in VALID_FREQUENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frequency. Must be one of: {VALID_FREQUENCIES}"
        )
    
    # Update fields
    if data.frequency is not None:
        alert.frequency = data.frequency
    if data.is_active is not None:
        alert.is_active = data.is_active
    
    db.commit()
    db.refresh(alert)
    
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == alert.saved_search_id
    ).first()
    
    return AlertResponse(
        id=alert.id,
        saved_search_id=alert.saved_search_id,
        search_name=saved_search.name if saved_search else "Unknown Search",
        frequency=alert.frequency,
        is_active=alert.is_active,
        last_sent_at=alert.last_sent_at,
        created_at=alert.created_at
    )


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an alert."""
    
    alert = db.query(SearchAlert).filter(
        SearchAlert.id == alert_id,
        SearchAlert.user_id == current_user.user_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    db.delete(alert)
    db.commit()
    
    return None
