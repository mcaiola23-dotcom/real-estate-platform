"""
User profile API routes for authenticated users.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from app.db import get_db
from app.models.user import User
from app.core.auth import get_current_user, get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["users"])


# -------------------
# Request/Response Schemas
# -------------------

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    user_type: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class UserProfileResponse(BaseModel):
    user_id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    user_type: Optional[str] = None
    auth_provider: Optional[str] = None
    email_verified: bool
    notification_preferences: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------
# Routes
# -------------------

@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Get the current user's profile."""
    return current_user


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the current user's profile."""
    
    if data.first_name is not None:
        current_user.first_name = data.first_name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.user_type is not None:
        current_user.user_type = data.user_type
    if data.notification_preferences is not None:
        current_user.notification_preferences = data.notification_preferences
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/me/change-password")
async def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change the current user's password."""
    
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for social login accounts"
        )
    
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )
    
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.delete("/me")
async def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete the current user's account (soft delete)."""
    
    # Soft delete - just deactivate the account
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.user_id}_{current_user.email}"
    db.commit()
    
    return {"message": "Account deleted successfully"}
