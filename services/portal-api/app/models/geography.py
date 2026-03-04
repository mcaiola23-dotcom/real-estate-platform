"""
Geography models for water bodies, parks, and other geographic features.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from ..db import Base


class WaterBody(Base):
    """Water bodies (ocean, river, lake, pond) for waterfront detection."""
    
    __tablename__ = "water_bodies"
    
    water_body_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=True)
    water_type = Column(String(50), nullable=False, index=True)  # ocean, river, lake, pond, stream
    source = Column(String(100), nullable=True)  # NOAA, NHD, CT GIS, OSM
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return f"<WaterBody(water_body_id={self.water_body_id}, name='{self.name}', type='{self.water_type}')>"
    
    __table_args__ = (
        Index('idx_water_bodies_geometry', 'geometry', postgresql_using='gist'),
        Index('idx_water_bodies_type', 'water_type'),
    )


class ParkRecreation(Base):
    """Parks, beaches, and recreation areas."""
    
    __tablename__ = "parks_recreation"
    
    park_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    park_type = Column(String(50), nullable=False, index=True)  # beach, park, trail, recreation_area
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    amenities = Column(JSONB, nullable=True)  # e.g., {"playground": true, "picnic_area": true}
    geometry = Column(Geometry('GEOMETRY', srid=4326), nullable=False)  # Can be POINT or POLYGON
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return f"<ParkRecreation(park_id={self.park_id}, name='{self.name}', type='{self.park_type}')>"
    
    __table_args__ = (
        Index('idx_parks_recreation_geometry', 'geometry', postgresql_using='gist'),
        Index('idx_parks_recreation_type', 'park_type'),
        Index('idx_parks_recreation_city', 'city'),
    )




