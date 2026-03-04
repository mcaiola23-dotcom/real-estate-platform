"""
Authentication API routes for user registration, login, and OAuth sync.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.db import get_db
from app.models.user import User
from app.core.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])


# -------------------
# Request/Response Schemas
# -------------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OAuthSync(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    provider: str
    provider_account_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    user_id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    user_type: Optional[str] = None
    auth_provider: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Response for login endpoint - includes access token for API calls."""
    user_id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    access_token: str
    token_type: str = "bearer"


class OAuthSyncResponse(BaseModel):
    """Response for oauth-sync endpoint - includes user info and access token."""
    user_id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    auth_provider: Optional[str] = None
    is_active: bool
    created_at: datetime
    access_token: str

    class Config:
        from_attributes = True


# -------------------
# Routes
# -------------------

@router.post("/register", response_model=UserResponse)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with email/password."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Parse name
    first_name = None
    last_name = None
    if data.name:
        parts = data.name.strip().split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else None
    
    # Create user
    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=first_name,
        last_name=last_name,
        auth_provider="email",
        email_verified=False,  # TODO: Add email verification
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=LoginResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with email/password. Returns user info and access token for API calls."""
    
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses social login. Please sign in with your provider."
        )
    
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Generate access token for backend API calls
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    return LoginResponse(
        user_id=user.user_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        access_token=access_token,
    )


@router.post("/oauth-sync", response_model=OAuthSyncResponse)
async def oauth_sync(data: OAuthSync, db: Session = Depends(get_db)):
    """
    Sync OAuth user to database.
    Called by NextAuth on successful OAuth sign-in.
    Creates user if not exists, updates last login if exists.
    Returns access token for backend API calls.
    """
    
    # Check if user exists by email
    user = db.query(User).filter(User.email == data.email).first()
    
    if user:
        # Update last login and provider ID if needed
        user.last_login_at = datetime.utcnow()
        if not user.auth_provider_id:
            user.auth_provider_id = data.provider_account_id
            user.auth_provider = data.provider
        db.commit()
    else:
        # Create new user
        first_name = None
        last_name = None
        if data.name:
            parts = data.name.strip().split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else None
        
        user = User(
            email=data.email,
            first_name=first_name,
            last_name=last_name,
            auth_provider=data.provider,
            auth_provider_id=data.provider_account_id,
            email_verified=True,  # OAuth emails are pre-verified
            last_login_at=datetime.utcnow(),
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate access token for backend API calls
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    return OAuthSyncResponse(
        user_id=user.user_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        auth_provider=user.auth_provider,
        is_active=user.is_active,
        created_at=user.created_at,
        access_token=access_token,
    )


@router.post("/token", response_model=TokenResponse)
async def get_token(data: UserLogin, db: Session = Depends(get_db)):
    """Get JWT token for API authentication."""
    
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return current_user
