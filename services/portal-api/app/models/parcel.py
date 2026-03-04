"""
Parcel model for CT GIS parcel data.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from ..db import Base


class Parcel(Base):
    """Parcel model representing CT GIS parcel data."""
    
    __tablename__ = "parcels"
    
    # Primary identifier
    parcel_id = Column(String(50), primary_key=True, index=True)
    cama_link = Column(String(50), nullable=True, index=True)
    object_id = Column(Integer, nullable=True)
    
    # Location
    town_name = Column(String(50), nullable=False, index=True)
    address_full = Column(String(255), nullable=True)
    address_number = Column(String(20), nullable=True)
    street_name = Column(String(200), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(2), nullable=False, default="CT")
    zip_code = Column(String(10), nullable=True, index=True)
    neighborhood_id = Column(Integer, nullable=True, index=True)  # FK to neighborhoods table
    
    # PostGIS geometry
    geometry = Column(Geometry('POLYGON', srid=4326), nullable=False)
    centroid = Column(Geometry('POINT', srid=4326), nullable=False)
    
    # Lot information
    lot_size_acres = Column(Numeric(10, 4), nullable=True)
    lot_size_sqft = Column(Integer, nullable=True)
    
    # Zoning and land use
    zoning = Column(String(50), nullable=True, index=True)
    land_use = Column(String(50), nullable=True)
    land_use_description = Column(String(255), nullable=True)
    
    # Assessment values
    assessment_total = Column(Numeric(12, 2), nullable=True)
    assessment_land = Column(Numeric(12, 2), nullable=True)
    assessment_building = Column(Numeric(12, 2), nullable=True)
    
    # Appraised values
    appraised_land = Column(Numeric(12, 2), nullable=True)
    appraised_building = Column(Numeric(12, 2), nullable=True)
    appraised_total = Column(Numeric(12, 2), nullable=True)
    
    # Tax information
    tax_year = Column(Integer, nullable=True)
    
    # Property details
    year_built = Column(Integer, nullable=True)
    square_feet = Column(Integer, nullable=True)
    effective_area = Column(Integer, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Numeric(3, 1), nullable=True)
    baths_full = Column(Integer, nullable=True)
    baths_half = Column(Integer, nullable=True)
    total_rooms = Column(Integer, nullable=True)
    property_type = Column(String(50), nullable=True, index=True)  # Standardized: SingleFamily, Condo, MultiFamily, Commercial, etc.
    property_subtype = Column(String(50), nullable=True, index=True)  # Subtype: 2Family, 3Family, Office, Retail, etc.
    property_type_detail = Column(String(100), nullable=True)  # Original classification from source
    units = Column(Integer, nullable=True)  # Number of units for multifamily/commercial properties
    condition = Column(String(50), nullable=True)
    model = Column(String(100), nullable=True)
    
    # Sale history
    last_sale_price = Column(Numeric(12, 2), nullable=True)
    last_sale_date = Column(Date, nullable=True)
    prior_sale_price = Column(Numeric(12, 2), nullable=True)
    prior_sale_date = Column(Date, nullable=True)
    
    street_view_available = Column(Integer, nullable=True)  # NULL=not checked, 1=available, 0=unavailable
    street_view_checked_at = Column(DateTime(timezone=True), nullable=True)
    street_view_pano_id = Column(String(100), nullable=True)  # Google Street View Panorama ID
    
    # Metadata
    collection_year = Column(String(4), nullable=True)
    fips_code = Column(String(20), nullable=True)
    cog = Column(String(50), nullable=True)
    shape_area = Column(Numeric(15, 6), nullable=True)
    shape_length = Column(Numeric(15, 6), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    listings = relationship("Listing", back_populates="parcel")
    
    def __repr__(self) -> str:
        return f"<Parcel(parcel_id='{self.parcel_id}', address='{self.address_full}', city='{self.city}')>"
    
    # Spatial indexes are created via PostGIS
    # Note: Using unique names to avoid conflicts
    __table_args__ = (
        Index('idx_parcels_geometry', 'geometry', postgresql_using='gist', postgresql_concurrently=False),
        Index('idx_parcels_centroid', 'centroid', postgresql_using='gist', postgresql_concurrently=False),
    )

