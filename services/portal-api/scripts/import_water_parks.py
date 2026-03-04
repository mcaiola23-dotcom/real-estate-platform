"""
Import major water bodies and parks for Fairfield County.
Simplified sample data approach.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def import_water_parks():
    print("\n[INFO] Importing Water Bodies & Parks")
    print("="*80)
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        print("[1/2] Creating water bodies...")
        
        # Long Island Sound coastline (simplified polygon)
        conn.execute(text("""
            INSERT INTO water_bodies (name, water_type, source, geometry)
            VALUES (
                'Long Island Sound',
                'ocean',
                'Sample Data',
                ST_GeomFromText('MULTIPOLYGON(((-73.8 41.0, -73.0 41.0, -73.0 41.1, -73.8 41.1, -73.8 41.0)))', 4326)
            )
        """))
        
        print("[2/2] Creating parks...")
        
        parks = [
            ("Greenwich Point Park", "beach", "Greenwich", -73.5882, 41.0098),
            ("Cove Island Park", "park", "Stamford", -73.5387, 41.0462),
            ("Sherwood Island State Park", "beach", "Westport", -73.3344, 41.1186),
            ("Seaside Park", "park", "Bridgeport", -73.1845, 41.1673),
        ]
        
        for name, ptype, city, lng, lat in parks:
            conn.execute(text("""
                INSERT INTO parks_recreation (name, park_type, city, geometry)
                VALUES (:name, :type, :city, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            """), {"name": name, "type": ptype, "city": city, "lng": lng, "lat": lat})
        
        conn.commit()
        
        result = conn.execute(text("SELECT COUNT(*) FROM water_bodies"))
        water_count = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM parks_recreation"))
        park_count = result.scalar()
        
        print(f"[OK] Water bodies: {water_count:,}")
        print(f"[OK] Parks: {park_count:,}")
        print("="*80)
        print("[SUCCESS] Import Complete")
        print()

if __name__ == "__main__":
    try:
        import_water_parks()
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)




