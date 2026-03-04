"""
User and authentication models.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index, JSON, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class User(Base):
    """User model for authentication and profile management."""
    
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Authentication
    auth_provider_id = Column(String(255), unique=True, nullable=True, index=True)  # OAuth provider ID
    auth_provider = Column(String(20), nullable=True)  # google, facebook, apple, email
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # For email/password auth
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Profile
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # User type and preferences
    user_type = Column(String(20), nullable=True, index=True)  # buyer, seller, investor, agent
    notification_preferences = Column(JSON, nullable=True)  # Email notification settings
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    saved_searches = relationship("SavedSearch", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("UserAlert", back_populates="user", cascade="all, delete-orphan")
    locations = relationship("UserLocation", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("LeadActivity", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def full_name(self) -> str:
        """Get full name from first and last name."""
        parts = [self.first_name, self.last_name]
        return " ".join(p for p in parts if p) or self.email
    
    def __repr__(self) -> str:
        return f"<User(user_id={self.user_id}, email='{self.email}', user_type='{self.user_type}')>"
    
    __table_args__ = (
        Index('idx_users_provider_id', 'auth_provider_id'),
        Index('idx_users_email', 'email'),
        Index('idx_users_type', 'user_type'),
    )


class UserFavorite(Base):
    """User favorites (saved properties)."""
    
    __tablename__ = "user_favorites"
    
    favorite_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Can favorite either a listing or a parcel
    listing_id = Column(Integer, ForeignKey('listings.listing_id'), nullable=True, index=True)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="favorites")
    listing = relationship("Listing")
    parcel = relationship("Parcel")
    
    def __repr__(self) -> str:
        return f"<UserFavorite(favorite_id={self.favorite_id}, user_id={self.user_id})>"
    
    __table_args__ = (
        Index('idx_user_favorites_user', 'user_id'),
        Index('idx_user_favorites_listing', 'listing_id'),
        Index('idx_user_favorites_parcel', 'parcel_id'),
    )


class SavedSearch(Base):
    """User saved searches."""
    
    __tablename__ = "saved_searches"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Search details
    name = Column(String(100), nullable=False)
    filters = Column(JSON, nullable=False)  # Search filter JSON
    ai_query = Column(String(500), nullable=True)  # AI search query if used
    
    # Tracking
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="saved_searches")
    
    def __repr__(self) -> str:
        return f"<SavedSearch(id={self.id}, name='{self.name}', user_id={self.user_id})>"
    
    __table_args__ = (
        Index('idx_saved_searches_user', 'user_id'),
    )


class UserAlert(Base):
    """User property alerts for new listings matching criteria."""
    
    __tablename__ = "user_alerts"
    
    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Alert criteria (stored as JSON search filters)
    alert_criteria = Column(String, nullable=False)  # JSON string of search filters
    
    # Alert settings
    frequency = Column(String(20), nullable=False, default='daily')  # daily, weekly
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Tracking
    last_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="alerts")
    
    def __repr__(self) -> str:
        return f"<UserAlert(alert_id={self.alert_id}, user_id={self.user_id}, frequency='{self.frequency}')>"
    
    __table_args__ = (
        Index('idx_user_alerts_user', 'user_id'),
        Index('idx_user_alerts_active', 'is_active'),
    )


class UserLocation(Base):
    """User saved locations for commute calculations."""
    
    __tablename__ = "user_locations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Location type: work, home, gym, school, daycare, partner_office, other
    location_type = Column(String(30), nullable=False)
    label = Column(String(100), nullable=True)  # Custom name like "Downtown Office"
    
    # Address details
    address = Column(String(500), nullable=False)
    lat = Column(Numeric(10, 7), nullable=False)
    lng = Column(Numeric(10, 7), nullable=False)
    
    # Commute preferences
    commute_mode = Column(String(20), default='driving')  # driving, transit, bicycling, walking
    is_primary = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="locations")
    
    def __repr__(self) -> str:
        return f"<UserLocation(id={self.id}, type='{self.location_type}', label='{self.label}')>"
    
    __table_args__ = (
        Index('idx_user_locations_user', 'user_id'),
        Index('idx_user_locations_type', 'location_type'),
    )
