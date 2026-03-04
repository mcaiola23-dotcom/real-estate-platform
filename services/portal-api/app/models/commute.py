"""
Commute cache model for storing Google Distance Matrix API results.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from ..db import Base


class CommuteCache(Base):
    """Cache for commute time calculations from Google Distance Matrix API."""
    
    __tablename__ = "commute_cache"
    
    cache_id = Column(Integer, primary_key=True, autoincrement=True)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False, index=True)
    
    # Destination info
    destination_type = Column(String(50), nullable=False, index=True)  # nyc_grand_central, nyc_penn, nearest_train, town_center, custom
    destination_address = Column(String(500), nullable=True)
    
    # Commute times (in minutes)
    drive_time_min = Column(Integer, nullable=True)
    drive_time_peak_min = Column(Integer, nullable=True)
    transit_time_min = Column(Integer, nullable=True)
    distance_miles = Column(Float, nullable=True)
    
    # Cache management
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # 30-day expiration
    
    def __repr__(self) -> str:
        return f"<CommuteCache(cache_id={self.cache_id}, parcel_id='{self.parcel_id}', destination_type='{self.destination_type}')>"
    
    __table_args__ = (
        Index('idx_commute_cache_parcel', 'parcel_id'),
        Index('idx_commute_cache_destination', 'destination_type'),
        Index('idx_commute_cache_expires', 'expires_at'),
    )




