"""
Import neighborhood boundaries for Fairfield County from OpenStreetMap.

This script downloads neighborhood data and imports it into the database
for use in search filters and map overlays.
"""

import sys
import os
import requests
import json
from typing import List, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings

# Fairfield County towns for neighborhood extraction
FAIRFIELD_TOWNS = [
    "Bridgeport", "Stamford", "Norwalk", "Danbury", "Greenwich",
    "Westport", "Fairfield", "Shelton", "Trumbull", "Stratford",
    "Milford", "New Canaan", "Darien", "Ridgefield", "Wilton",
    "Monroe", "Bethel", "Brookfield", "Newtown", "Redding",
    "Easton", "Weston"
]

def create_neighborhoods_table():
    """Create neighborhoods table if it doesn't exist."""
    engine = create_engine(str(settings.database_url))
    
    with engine.connect() as conn:
        # Create neighborhoods table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS neighborhoods (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(2) DEFAULT 'CT',
                boundary GEOMETRY(MULTIPOLYGON, 4326),
                center_lat DOUBLE PRECISION,
                center_lng DOUBLE PRECISION,
                parcel_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, city)
            )
        """))
        conn.commit()
        
        # Create spatial index
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_neighborhoods_boundary 
            ON neighborhoods USING GIST (boundary)
        """))
        conn.commit()
        
        print("✅ Neighborhoods table created")

def fetch_neighborhoods_osm(city: str) -> List[Dict[str, Any]]:
    """
    Fetch neighborhood boundaries from OpenStreetMap Nominatim API.
    
    Note: This is a simplified approach. For production, consider:
    - Local OSM data extract
    - Overpass API for more control
    - Commercial data providers (Zillow, etc.)
    """
    # Nominatim API endpoint
    url = "https://nominatim.openstreetmap.org/search"
    
    # Search for neighborhoods/suburbs in the city
    params = {
        "city": city,
        "state": "Connecticut",
        "country": "USA",
        "format": "json",
        "polygon_geojson": 1,
        "addressdetails": 1
    }
    
    headers = {
        "User-Agent": "SmartMLS-AI-Platform/1.0 (development)"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"⚠️  Error fetching neighborhoods for {city}: {e}")
        return []

def import_manual_neighborhoods():
    """
    Import known neighborhoods manually for major towns.
    This is a more reliable approach than OSM for now.
    """
    engine = create_engine(str(settings.database_url))
    
    # Known neighborhoods for major Fairfield County towns
    # Source: Local knowledge + MLS data
    neighborhoods = {
        "Stamford": [
            {"name": "Shippan", "lat": 41.0389, "lng": -73.5315},
            {"name": "Cove", "lat": 41.0473, "lng": -73.5409},
            {"name": "Downtown Stamford", "lat": 41.0534, "lng": -73.5387},
            {"name": "North Stamford", "lat": 41.1189, "lng": -73.5540},
            {"name": "Springdale", "lat": 41.0951, "lng": -73.5121},
            {"name": "Turn of River", "lat": 41.0726, "lng": -73.5565},
            {"name": "Westover", "lat": 41.0651, "lng": -73.5732},
            {"name": "Glenbrook", "lat": 41.0623, "lng": -73.5232},
        ],
        "Greenwich": [
            {"name": "Old Greenwich", "lat": 41.0309, "lng": -73.5651},
            {"name": "Riverside", "lat": 41.0317, "lng": -73.5865},
            {"name": "Cos Cob", "lat": 41.0376, "lng": -73.5990},
            {"name": "Downtown Greenwich", "lat": 41.0262, "lng": -73.6282},
            {"name": "Belle Haven", "lat": 41.0073, "lng": -73.6173},
            {"name": "Byram", "lat": 41.0087, "lng": -73.6565},
            {"name": "Backcountry", "lat": 41.1018, "lng": -73.6365},
        ],
        "Norwalk": [
            {"name": "South Norwalk (SoNo)", "lat": 41.0906, "lng": -73.4218},
            {"name": "East Norwalk", "lat": 41.1087, "lng": -73.3951},
            {"name": "Rowayton", "lat": 41.0770, "lng": -73.4451},
            {"name": "Silvermine", "lat": 41.1451, "lng": -73.4179},
            {"name": "Cranbury", "lat": 41.1301, "lng": -73.4340},
        ],
        "Westport": [
            {"name": "Downtown Westport", "lat": 41.1415, "lng": -73.3579},
            {"name": "Greens Farms", "lat": 41.1257, "lng": -73.3037},
            {"name": "Saugatuck", "lat": 41.1165, "lng": -73.3618},
            {"name": "Compo Beach", "lat": 41.1229, "lng": -73.3390},
        ],
        "Darien": [
            {"name": "Noroton", "lat": 41.0673, "lng": -73.4801},
            {"name": "Tokeneke", "lat": 41.0537, "lng": -73.5023},
            {"name": "Downtown Darien", "lat": 41.0789, "lng": -73.4693},
        ],
        "New Canaan": [
            {"name": "Downtown New Canaan", "lat": 41.1468, "lng": -73.4948},
            {"name": "Silvermine", "lat": 41.1234, "lng": -73.4568},
        ],
        "Fairfield": [
            {"name": "Southport", "lat": 41.1348, "lng": -73.2876},
            {"name": "Greenfield Hill", "lat": 41.1873, "lng": -73.2715},
            {"name": "Downtown Fairfield", "lat": 41.1412, "lng": -73.2637},
        ]
    }
    
    print(f"📍 Importing {sum(len(n) for n in neighborhoods.values())} known neighborhoods...")
    
    with engine.connect() as conn:
        for city, hoods in neighborhoods.items():
            for hood in hoods:
                try:
                    # Insert neighborhood (will skip if already exists due to UNIQUE constraint)
                    conn.execute(text("""
                        INSERT INTO neighborhoods (name, city, state, center_lat, center_lng)
                        VALUES (:name, :city, 'CT', :lat, :lng)
                        ON CONFLICT (name, city) DO NOTHING
                    """), {
                        "name": hood["name"],
                        "city": city,
                        "lat": hood["lat"],
                        "lng": hood["lng"]
                    })
                    print(f"  ✅ {city}: {hood['name']}")
                except Exception as e:
                    print(f"  ⚠️  Error importing {hood['name']}: {e}")
        
        conn.commit()
    
    print("\n✅ Neighborhoods imported successfully!")

def assign_parcels_to_neighborhoods():
    """
    Assign parcels to neighborhoods based on proximity.
    For now, use a simple distance-based approach.
    In future, can use actual boundary polygons.
    """
    engine = create_engine(str(settings.database_url))
    
    print("\n🔄 Assigning parcels to neighborhoods...")
    print("This may take a few minutes...")
    
    # Add neighborhood_id column to parcels if it doesn't exist
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE parcels 
            ADD COLUMN IF NOT EXISTS neighborhood_id INTEGER REFERENCES neighborhoods(id)
        """))
        conn.commit()
        
        # Create index on neighborhood_id
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parcels_neighborhood 
            ON parcels (neighborhood_id)
        """))
        conn.commit()
        
        # Assign parcels to nearest neighborhood (within 2km)
        # This is a simplified approach - ideally would use proper boundary polygons
        result = conn.execute(text("""
            UPDATE parcels p
            SET neighborhood_id = (
                SELECT n.id
                FROM neighborhoods n
                WHERE n.city = p.city
                AND ST_Distance(
                    p.centroid::geography,
                    ST_SetSRID(ST_MakePoint(n.center_lng, n.center_lat), 4326)::geography
                ) < 2000  -- Within 2km
                ORDER BY ST_Distance(
                    p.centroid::geography,
                    ST_SetSRID(ST_MakePoint(n.center_lng, n.center_lat), 4326)::geography
                )
                LIMIT 1
            )
            WHERE p.city IN (
                SELECT DISTINCT city FROM neighborhoods
            )
            AND p.neighborhood_id IS NULL
        """))
        conn.commit()
        
        print(f"✅ Assigned {result.rowcount} parcels to neighborhoods")
        
        # Update parcel counts
        conn.execute(text("""
            UPDATE neighborhoods n
            SET parcel_count = (
                SELECT COUNT(*)
                FROM parcels p
                WHERE p.neighborhood_id = n.id
            )
        """))
        conn.commit()
        
        # Show statistics
        stats = conn.execute(text("""
            SELECT 
                n.city,
                n.name,
                n.parcel_count
            FROM neighborhoods n
            WHERE n.parcel_count > 0
            ORDER BY n.city, n.parcel_count DESC
        """))
        
        print("\n📊 Neighborhood Statistics:")
        print(f"{'City':<20} {'Neighborhood':<30} {'Parcels':<10}")
        print("-" * 60)
        for row in stats:
            print(f"{row[0]:<20} {row[1]:<30} {row[2]:<10}")

if __name__ == "__main__":
    print("🏘️  Neighborhood Import Script")
    print("=" * 60)
    
    create_neighborhoods_table()
    import_manual_neighborhoods()
    assign_parcels_to_neighborhoods()
    
    print("\n" + "=" * 60)
    print("✅ Neighborhood import complete!")
    print("\nNext steps:")
    print("1. Add neighborhood filter to search UI")
    print("2. Add neighborhood endpoint to API")
    print("3. Add neighborhood overlay to map")

