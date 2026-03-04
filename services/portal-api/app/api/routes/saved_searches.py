"""
Saved searches API routes for authenticated users.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ...db import get_db
from ...models.user import User, SavedSearch
from ...core.auth import get_current_user

router = APIRouter(prefix="/saved-searches", tags=["saved-searches"])


# -------------------
# Request/Response Schemas
# -------------------

class SavedSearchCreate(BaseModel):
    name: str
    filters: Dict[str, Any]
    ai_query: Optional[str] = None


class SavedSearchUpdate(BaseModel):
    name: Optional[str] = None


class SavedSearchResponse(BaseModel):
    id: int
    name: str
    filters: Dict[str, Any]
    ai_query: Optional[str] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SavedSearchListResponse(BaseModel):
    searches: List[SavedSearchResponse]
    total: int


# -------------------
# Routes
# -------------------

@router.get("", response_model=SavedSearchListResponse)
async def list_saved_searches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all saved searches for the current user."""
    
    searches = db.query(SavedSearch).filter(
        SavedSearch.user_id == current_user.user_id
    ).order_by(SavedSearch.created_at.desc()).all()
    
    return SavedSearchListResponse(
        searches=searches,
        total=len(searches)
    )


@router.post("", response_model=SavedSearchResponse, status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    data: SavedSearchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new saved search."""
    
    # Limit to 10 saved searches per user
    existing_count = db.query(SavedSearch).filter(
        SavedSearch.user_id == current_user.user_id
    ).count()
    
    if existing_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 10 saved searches allowed. Please delete one first."
        )
    
    saved_search = SavedSearch(
        user_id=current_user.user_id,
        name=data.name,
        filters=data.filters,
        ai_query=data.ai_query,
    )
    
    db.add(saved_search)
    db.commit()
    db.refresh(saved_search)
    
    return saved_search


@router.get("/{search_id}", response_model=SavedSearchResponse)
async def get_saved_search(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific saved search."""
    
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == search_id,
        SavedSearch.user_id == current_user.user_id
    ).first()
    
    if not saved_search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved search not found"
        )
    
    return saved_search


@router.put("/{search_id}", response_model=SavedSearchResponse)
async def update_saved_search(
    search_id: int,
    data: SavedSearchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a saved search (rename)."""
    
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == search_id,
        SavedSearch.user_id == current_user.user_id
    ).first()
    
    if not saved_search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved search not found"
        )
    
    if data.name:
        saved_search.name = data.name
    
    db.commit()
    db.refresh(saved_search)
    
    return saved_search


@router.post("/{search_id}/use", response_model=SavedSearchResponse)
async def mark_search_used(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a saved search as used (update last_used_at)."""
    
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == search_id,
        SavedSearch.user_id == current_user.user_id
    ).first()
    
    if not saved_search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved search not found"
        )
    
    saved_search.last_used_at = datetime.utcnow()
    db.commit()
    db.refresh(saved_search)
    
    return saved_search


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_search(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a saved search."""
    
    saved_search = db.query(SavedSearch).filter(
        SavedSearch.id == search_id,
        SavedSearch.user_id == current_user.user_id
    ).first()
    
    if not saved_search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved search not found"
        )
    
    db.delete(saved_search)
    db.commit()
    
    return None
