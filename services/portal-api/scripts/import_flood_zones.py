#!/usr/bin/env python3
"""
Import FEMA Flood Zones into PostGIS

This script imports the FEMA National Flood Hazard Layer (NFHL) shapefile
into the database. It specifically targets the S_FLD_HAZ_AR.shp file.

Usage:
    python scripts/import_flood_zones.py

Prerequisites:
    - geopandas installed
    - FEMA NFHL extracted to data/gis/flood_zones/
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import geopandas as gpd
from sqlalchemy import create_engine, text
from app.core.config import settings


def import_flood_zones(shapefile_path: str = None):
    """Import FEMA flood zones from NFHL shapefile."""
    
    if shapefile_path is None:
        shapefile_path = Path(__file__).parent.parent / "data" / "gis" / "flood_zones" / "S_FLD_HAZ_AR.shp"
    
    shapefile_path = Path(shapefile_path)
    
    if not shapefile_path.exists():
        print(f"Error: Shapefile not found at {shapefile_path}")
        return False
    
    print(f"Loading flood zones from {shapefile_path}...")
    
    # Read the shapefile
    gdf = gpd.read_file(shapefile_path)
    
    print(f"Loaded {len(gdf)} flood zones")
    print(f"Columns: {list(gdf.columns)}")
    print(f"CRS: {gdf.crs}")
    
    # Reproject to WGS84 (EPSG:4326) if needed
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print("Reprojecting to EPSG:4326...")
        gdf = gdf.to_crs(epsg=4326)
    
    # Rename columns to match reasonable schema
    # S_FLD_HAZ_AR columns: FLD_AR_ID, FLD_ZONE, FLOODWAY, SFHA_TF, STATIC_BFE, DEPTH, LEN_UNIT, V_DATUM, DATE_R
    column_mapping = {
        'FLD_AR_ID': 'fema_id',
        'FLD_ZONE': 'zone',
        'FLOODWAY': 'floodway',
        'SFHA_TF': 'is_sfha', # Special Flood Hazard Area (T/F)
        'STATIC_BFE': 'static_bfe',
        'DEPTH': 'depth',
        'LEN_UNIT': 'units',
        'ZONE_SUBTY': 'subtype',
        'geometry': 'geom'
    }
    
    # Select and rename
    cols_to_keep = [c for c in column_mapping.keys() if c in gdf.columns]
    gdf = gdf[cols_to_keep].copy()
    gdf = gdf.rename(columns={c: column_mapping[c] for c in cols_to_keep})
    
    # Set the active geometry column
    if 'geom' in gdf.columns:
        gdf = gdf.set_geometry('geom')
    
    # Connect to database
    engine = create_engine(settings.database_url)
    
    print("Creating flood_zones table...")
    
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS flood_zones CASCADE"))
        conn.commit()
    
    print("Writing to database...")
    gdf.to_postgis(
        "flood_zones",
        engine,
        if_exists="replace",
        index=False,
        dtype={'geom': 'geometry'}
    )
    
    with engine.connect() as conn:
        print("Creating spatial index...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_flood_zones_geom 
            ON flood_zones USING GIST (geom)
        """))
        
        # Add primary key
        conn.execute(text("""
            ALTER TABLE flood_zones 
            ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY
        """))
        
        conn.commit()
        
        result = conn.execute(text("SELECT COUNT(*) FROM flood_zones"))
        count = result.scalar()
        print(f"Successfully imported {count} flood zones")
        
    return True

def assign_parcels_to_flood_zones():
    """Tag parcels that intersect with flood zones."""
    engine = create_engine(settings.database_url)
    
    print("Assigning flood zone data to parcels...")
    
    with engine.connect() as conn:
        # Add columns if not exist
        conn.execute(text("""
            ALTER TABLE parcels 
            ADD COLUMN IF NOT EXISTS flood_zone VARCHAR(10),
            ADD COLUMN IF NOT EXISTS is_sfha BOOLEAN
        """))
        conn.commit()
        
        # Update parcels
        # We take the highest risk zone if multiple intersect (simplified)
        # Or just the one that covers the centroid
        print("Updating parcels...")
        conn.execute(text("""
            UPDATE parcels p
            SET flood_zone = fz.zone,
                is_sfha = (fz.is_sfha = 'T')
            FROM flood_zones fz
            WHERE ST_Intersects(p.geometry, fz.geom)
            AND ST_Area(ST_Intersection(p.geometry, fz.geom)) > (ST_Area(p.geometry) * 0.1) -- Must overlap >10%
        """))
        conn.commit()
        
        result = conn.execute(text("SELECT COUNT(*) FROM parcels WHERE flood_zone IS NOT NULL"))
        count = result.scalar()
        print(f"Tagged {count} parcels with flood detail")

if __name__ == "__main__":
    success = import_flood_zones()
    if success:
        assign_parcels_to_flood_zones()
