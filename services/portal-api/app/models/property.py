from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from ..db import Base


class Property(Base):
    """Property model for real estate listings."""
    
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    mls_id = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(2), nullable=False, default="CT")
    zip_code = Column(String(10), nullable=False)
    
    # Property details
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Float, nullable=False)
    square_feet = Column(Integer, nullable=True)
    lot_size = Column(Float, nullable=True)
    
    # Financial
    list_price = Column(Float, nullable=True)
    estimated_value = Column(Float, nullable=True)
    
    # Property type and status
    property_type = Column(String(50), nullable=False, default="Residential")
    status = Column(String(20), nullable=False, default="Active")
    
    # Additional details
    description = Column(Text, nullable=True)
    year_built = Column(Integer, nullable=True)
    garage_spaces = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<Property(id={self.id}, address='{self.address}')>"

