"""
Import neighborhood data for Fairfield County using town boundaries as neighborhoods.
Simplified approach using town-level data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

FAIRFIELD_TOWNS = [
    {"name": "Greenwich", "lat": 41.0262, "lng": -73.6282},
    {"name": "Stamford", "lat": 41.0534, "lng": -73.5387},
    {"name": "Norwalk", "lat": 41.1176, "lng": -73.4079},
    {"name": "Danbury", "lat": 41.3948, "lng": -73.4540},
    {"name": "Darien", "lat": 41.0787, "lng": -73.4693},
    {"name": "New Canaan", "lat": 41.1465, "lng": -73.4948},
    {"name": "Westport", "lat": 41.1415, "lng": -73.3579},
    {"name": "Fairfield", "lat": 41.1410, "lng": -73.2637},
    {"name": "Bridgeport", "lat": 41.1865, "lng": -73.1952},
    {"name": "Wilton", "lat": 41.1954, "lng": -73.4379},
]

def import_neighborhoods():
    print("\n[INFO] Importing Neighborhoods")
    print("="*80)
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        print("[1/2] Creating neighborhoods from town boundaries...")
        
        for town in FAIRFIELD_TOWNS:
            # Create neighborhood record with computed boundary from parcels
            conn.execute(text("""
                INSERT INTO neighborhoods (name, city, state, center_lat, center_lng, boundary)
                SELECT 
                    :name,
                    :name,
                    'CT',
                    :lat,
                    :lng,
                    ST_Multi(ST_Union(geometry))
                FROM parcels
                WHERE town_name = :name
                ON CONFLICT DO NOTHING
            """), town)
        
        conn.commit()
        
        print("[2/2] Updating parcel neighborhood assignments...")
        
        # Assign parcels to neighborhoods
        conn.execute(text("""
            UPDATE parcels p
            SET neighborhood_id = n.id
            FROM neighborhoods n
            WHERE p.town_name = n.name
        """))
        
        conn.commit()
        
        # Get counts
        result = conn.execute(text("SELECT COUNT(*) FROM neighborhoods"))
        count = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM parcels WHERE neighborhood_id IS NOT NULL"))
        assigned = result.scalar()
        
        print(f"[OK] Neighborhoods: {count:,}")
        print(f"[OK] Parcels assigned: {assigned:,}")
        print("="*80)
        print("[SUCCESS] Neighborhoods Import Complete")
        print()

if __name__ == "__main__":
    try:
        import_neighborhoods()
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)




