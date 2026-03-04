"""
AddressMatch model for tracking matches between parcels and listings.
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class AddressMatch(Base):
    """Model for tracking matches between CT GIS parcels and SimplyRETS listings."""
    
    __tablename__ = "address_matches"
    
    # Primary key
    match_id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey('listings.listing_id'), nullable=False, index=True)
    
    # Matching information
    match_confidence = Column(Numeric(3, 2), nullable=False)  # 0.00 to 1.00
    match_method = Column(String(20), nullable=False)  # 'address', 'geospatial', 'tax_id', 'manual'
    match_details = Column(JSONB, nullable=True)  # Additional matching metadata
    
    # Tracking
    matched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    matched_by = Column(String(50), nullable=True)  # 'system', 'admin', user ID
    
    # Relationships
    parcel = relationship("Parcel")
    listing = relationship("Listing")
    
    def __repr__(self) -> str:
        return f"<AddressMatch(match_id={self.match_id}, parcel_id='{self.parcel_id}', listing_id={self.listing_id}, confidence={self.match_confidence})>"
    
    __table_args__ = (
        Index('idx_address_matches_confidence', 'match_confidence'),
        Index('idx_address_matches_unique', 'parcel_id', 'listing_id', unique=True),
    )

