from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from ..db import Base

class Neighborhood(Base):
    """Neighborhood boundary and metadata."""
    __tablename__ = "neighborhoods"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(2), default="CT")
    
    # Pre-computed center for map positioning
    center_lat = Column(Float, nullable=True)
    center_lng = Column(Float, nullable=True)
    
    # Stats
    parcel_count = Column(Integer, default=0)
    
    # Geometry
    boundary = Column(Geometry('POLYGON', srid=4326), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Neighborhood(id={self.id}, name='{self.name}', city='{self.city}')>"
