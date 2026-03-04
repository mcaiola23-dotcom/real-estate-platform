from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from ..db import Base


class Lead(Base):
    """Lead model for capturing potential clients."""
    
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    message = Column(Text, nullable=True)
    
    # Lead status and tracking
    status = Column(String(20), nullable=False, default="new")
    source = Column(String(50), nullable=True, default="website")
    lead_score = Column(Integer, nullable=True, default=0)
    
    # Property interest (optional)
    interested_property_id = Column(Integer, nullable=True)
    property_address = Column(String(255), nullable=True)
    parcel_id = Column(String(50), nullable=True, index=True)
    listing_id_str = Column(String(50), nullable=True, index=True)
    intent = Column(String(50), nullable=True) # e.g., "tour_request", "question", "valuation"
    meta_data = Column(JSON, nullable=True) # Renamed from metadata to avoid reserve word conflict if any, though metadata is safe in SQL usually. Let's use meta_data.
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, name='{self.name}', email='{self.email}')>"

