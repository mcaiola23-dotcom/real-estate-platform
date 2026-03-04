"""SQLAlchemy model for map overlay layer metadata."""

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from ..db import Base


class OverlayLayer(Base):
    """Metadata for map overlay layers (zoning, schools, flood zones, etc.)."""

    __tablename__ = "overlay_layers"

    layer_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    geometry_type = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)
    attribution = Column(Text, nullable=True)
    availability = Column(JSONB, nullable=True)
    style = Column(JSONB, nullable=True)
    data_table = Column(String(100), nullable=True)
    update_cadence = Column(String(50), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<OverlayLayer(layer_id='{self.layer_id}', name='{self.name}', type='{self.type}')>"


