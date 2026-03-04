"""
Office model for SimplyRETS office information (IDX compliance).
"""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class Office(Base):
    """Model for listing offices (from SimplyRETS)."""
    
    __tablename__ = "offices"
    
    # Primary key
    office_id = Column(String(50), primary_key=True, index=True)
    
    # Office information
    name = Column(String(200), nullable=True)
    serving_name = Column(String(200), nullable=True)
    
    # Contact information
    email = Column(String(255), nullable=True)
    office_phone = Column(String(20), nullable=True)
    cell_phone = Column(String(20), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    listings = relationship("Listing", foreign_keys="Listing.listing_office_id", back_populates="listing_office")
    
    def __repr__(self) -> str:
        return f"<Office(office_id='{self.office_id}', name='{self.name}')>"

