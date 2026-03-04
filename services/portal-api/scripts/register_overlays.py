#!/usr/bin/env python3
"""
Register Map Overlay Layers

This script inserts metadata for map layers into the overlay_layers table.
"""

import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.overlay_layer import OverlayLayer

def register_overlays():
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    overlays = [
        OverlayLayer(
            layer_id="schools",
            name="School Districts",
            type="schools",
            geometry_type="Polygon",
            description="Unified School District boundaries from US Census TIGER/Line 2023.",
            source="Census Bureau",
            attribution="U.S. Census Bureau TIGER/Line",
            availability={"roles": ["public", "agent"]},
            style={
                "color": "#4f46e5",  # Indigo
                "weight": 2,
                "opacity": 0.8,
                "fillColor": "#4f46e5",
                "fillOpacity": 0.05
            },
            data_table="school_district_boundaries",
            update_cadence="Annually",
            updated_at=datetime.utcnow()
        ),
        OverlayLayer(
            layer_id="flood_zones",
            name="FEMA Flood Zones",
            type="hazard",
            geometry_type="Polygon",
            description="National Flood Hazard Layer (NFHL) from FEMA.",
            source="FEMA",
            attribution="FEMA Map Service Center",
            availability={"roles": ["public", "agent"]},
            style={
                "color": "#dc2626", # Red
                "weight": 1,
                "opacity": 0.6,
                "fillColor": "#e0f2fe",
                "fillOpacity": 0.4,
                "rules": [
                    {"prop": "zone", "val": "AE", "style": {"fillColor": "#3b82f6", "fillOpacity": 0.3}}, # Blue
                    {"prop": "zone", "val": "A", "style": {"fillColor": "#3b82f6", "fillOpacity": 0.3}},
                    {"prop": "zone", "val": "VE", "style": {"fillColor": "#818cf8", "fillOpacity": 0.4}}, # Indigo
                    {"prop": "zone", "val": "X", "style": {"fillColor": "#fdba74", "fillOpacity": 0.2}}, # Orange
                ]
            },
            data_table="flood_zones",
            update_cadence="Annually",
            updated_at=datetime.utcnow()
        ),
        OverlayLayer(
            layer_id="zoning",
            name="Zoning Districts",
            type="regulatory",
            geometry_type="Polygon",
            description="Municipal zoning districts.",
            source="Municipal GIS",
            attribution="Local Municipality",
            availability={"roles": ["agent"]}, # Agent only for now? Or public?
            style={
                "color": "#059669", # Emerald
                "weight": 2,
                "opacity": 0.7,
                "fillColor": "#d1fae5",
                "fillOpacity": 0.2
            },
            data_table="parcels_zoning_view", # Not real yet, placeholders
            update_cadence="As needed",
            updated_at=datetime.utcnow()
        )
    ]
    
    print("Registering overlay layers...")
    
    for layer in overlays:
        existing = db.query(OverlayLayer).filter(OverlayLayer.layer_id == layer.layer_id).first()
        if existing:
            print(f"Updating {layer.name}...")
            existing.name = layer.name
            existing.description = layer.description
            existing.style = layer.style
            existing.data_table = layer.data_table
            existing.updated_at = layer.updated_at
        else:
            print(f"Creating {layer.name}...")
            db.add(layer)
    
    db.commit()
    print("✓ Successfully registered map layers")

if __name__ == "__main__":
    register_overlays()
