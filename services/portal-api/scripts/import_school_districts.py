#!/usr/bin/env python3
"""
Import TIGER/Line School District Boundaries into PostGIS

This script imports the Census TIGER/Line Unified School District shapefile
into the database, creating the `school_district_boundaries` table.

Source: https://www2.census.gov/geo/tiger/TIGER2023/UNSD/tl_2023_09_unsd.zip

Usage:
    python scripts/import_school_districts.py

Prerequisites:
    - geopandas installed: pip install geopandas
    - shapefile downloaded to data/gis/school_districts/
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import geopandas as gpd
from sqlalchemy import create_engine, text
from app.core.config import settings


def import_school_districts(shapefile_path: str = None):
    """Import school district boundaries from TIGER/Line shapefile."""
    
    if shapefile_path is None:
        shapefile_path = Path(__file__).parent.parent / "data" / "gis" / "school_districts" / "tl_2023_09_unsd.shp"
    
    shapefile_path = Path(shapefile_path)
    
    if not shapefile_path.exists():
        print(f"Error: Shapefile not found at {shapefile_path}")
        print("Please download from: https://www2.census.gov/geo/tiger/TIGER2023/UNSD/tl_2023_09_unsd.zip")
        return False
    
    print(f"Loading shapefile from {shapefile_path}...")
    
    # Read the shapefile
    gdf = gpd.read_file(shapefile_path)
    
    print(f"Loaded {len(gdf)} school districts")
    print(f"Columns: {list(gdf.columns)}")
    print(f"CRS: {gdf.crs}")
    
    # Reproject to WGS84 (EPSG:4326) if needed
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print("Reprojecting to EPSG:4326...")
        gdf = gdf.to_crs(epsg=4326)
    
    # Rename columns to match our schema
    column_mapping = {
        'GEOID': 'geoid',
        'NAME': 'name',
        'STATEFP': 'state_fips',
        'UNSDLEA': 'lea_code',
        'MTFCC': 'mtfcc',
        'FUNCSTAT': 'functional_status',
        'ALAND': 'land_area_sqm',
        'AWATER': 'water_area_sqm',
        'INTPTLAT': 'centroid_lat',
        'INTPTLON': 'centroid_lon',
        'geometry': 'geom'
    }
    
    # Select and rename columns
    cols_to_keep = [c for c in column_mapping.keys() if c in gdf.columns]
    gdf = gdf[cols_to_keep].copy()
    gdf = gdf.rename(columns={c: column_mapping[c] for c in cols_to_keep})
    
    # Set the active geometry column
    if 'geom' in gdf.columns:
        gdf = gdf.set_geometry('geom')
    
    # Connect to database
    engine = create_engine(settings.database_url)
    
    # Create table
    print("Creating school_district_boundaries table...")
    
    with engine.connect() as conn:
        # Drop existing table if exists
        conn.execute(text("DROP TABLE IF EXISTS school_district_boundaries CASCADE"))
        conn.commit()
    
    # Write to PostGIS
    print("Writing to database...")
    gdf.to_postgis(
        "school_district_boundaries",
        engine,
        if_exists="replace",
        index=False,
        dtype={'geom': 'geometry'}
    )
    
    # Add spatial index
    with engine.connect() as conn:
        print("Creating spatial index...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_school_district_boundaries_geom 
            ON school_district_boundaries USING GIST (geom)
        """))
        
        # Add primary key
        conn.execute(text("""
            ALTER TABLE school_district_boundaries 
            ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY
        """))
        
        conn.commit()
        
        # Verify
        result = conn.execute(text("SELECT COUNT(*) FROM school_district_boundaries"))
        count = result.scalar()
        print(f"Successfully imported {count} school districts")
    
    return True


def assign_parcels_to_districts():
    """
    Assign each parcel to its containing school district.
    Updates the school_district_id column on parcels table.
    """
    engine = create_engine(settings.database_url)
    
    print("Assigning parcels to school districts...")
    
    with engine.connect() as conn:
        # Add school_district_id column if not exists
        conn.execute(text("""
            ALTER TABLE parcels 
            ADD COLUMN IF NOT EXISTS school_district_id INTEGER
        """))
        conn.commit()
        
        # Update parcels with their containing district
        result = conn.execute(text("""
            UPDATE parcels p
            SET school_district_id = sd.id
            FROM school_district_boundaries sd
            WHERE ST_Within(p.geometry, sd.geom)
            AND p.school_district_id IS NULL
        """))
        conn.commit()
        
        # For parcels not fully within, try contains centroid
        conn.execute(text("""
            UPDATE parcels p
            SET school_district_id = sd.id
            FROM school_district_boundaries sd
            WHERE ST_Contains(sd.geom, ST_Centroid(p.geometry))
            AND p.school_district_id IS NULL
        """))
        conn.commit()
        
        # Get counts
        result = conn.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(school_district_id) as assigned
            FROM parcels
        """))
        row = result.fetchone()
        print(f"Assigned {row[1]} of {row[0]} parcels to school districts")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import school district boundaries")
    parser.add_argument("--shapefile", "-f", help="Path to shapefile", default=None)
    parser.add_argument("--assign-parcels", "-a", action="store_true", 
                       help="Also assign parcels to districts")
    
    args = parser.parse_args()
    
    success = import_school_districts(args.shapefile)
    
    if success and args.assign_parcels:
        assign_parcels_to_districts()
