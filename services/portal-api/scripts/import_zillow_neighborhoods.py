import sys
import os
import json
from sqlalchemy import text
from shapely.geometry import shape
from geoalchemy2.shape import from_shape

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

GEOJSON_FILE = os.path.join(os.path.dirname(__file__), '../data/zillow_neighborhoods_ct.geojson')

def import_zillow_boundaries():
    db = next(get_db())
    try:
        print(f"Loading Zillow data from {GEOJSON_FILE}...")
        with open(GEOJSON_FILE, 'r') as f:
            data = json.load(f)
            
        print(f"Found {len(data['features'])} features.")
        
        updated_count = 0
        skipped_count = 0
        
        # Custom Mappings (Zillow Name -> DB Name)
        NAME_MAPPING = {
            "Downtown": "Downtown Stamford",
            "Cove-East Side": "Cove",
            "South End": "South End", # verify
            "West Side": "West Side", # verify
            "Waterside": "Waterside"
        }
        
        for feature in data['features']:
            props = feature['properties']
            name = props.get('NAME')
            city = props.get('CITY')
            
            if not name or not city:
                continue
                
            # Apply mapping if exists
            if city == "Stamford" and name in NAME_MAPPING:
                print(f"Mapping '{name}' -> '{NAME_MAPPING[name]}'")
                name = NAME_MAPPING[name]
                
            # Convert GeoJSON geometry to WKT/WKB for PostGIS
            geom = shape(feature['geometry'])
            
            # Simple matching logic: Match by Name and City (Case Insensitive)
            # Check if neighborhood exists
            query_check = text("""
                SELECT id FROM neighborhoods 
                WHERE LOWER(name) = LOWER(:name) AND LOWER(city) = LOWER(:city)
            """)
            result = db.execute(query_check, {"name": name, "city": city}).fetchone()
            
            if result:
                nid = result[0]
                print(f"Updating {name}, {city} (ID: {nid})...")
                
                # Update boundary in neighborhoods table
                # We use ST_Multi to ensure it's a MultiPolygon as expected by the column
                query_update = text("""
                    UPDATE neighborhoods 
                    SET boundary = ST_Multi(ST_SetSRID(ST_GeomFromText(:wkt), 4326))
                    WHERE id = :id
                """)
                db.execute(query_update, {"wkt": geom.wkt, "id": nid})
                
                # ALSO Update the cache immediately to verify results
                query_cache = text("""
                    INSERT INTO neighborhood_boundary_cache (neighborhood_id, boundary)
                    VALUES (:id, ST_Multi(ST_SetSRID(ST_GeomFromText(:wkt), 4326)))
                    ON CONFLICT (neighborhood_id) DO UPDATE 
                    SET boundary = EXCLUDED.boundary
                """)
                db.execute(query_cache, {"wkt": geom.wkt, "id": nid})
                
                updated_count += 1
            else:
                # Optional: Insert new neighborhood?
                # For now, let's just log it. The user cares about existing ones.
                # print(f"Skipping {name}, {city} (Not in DB)")
                skipped_count += 1
                
        db.commit()
        print(f"\n[OK] Import Complete.")
        print(f"Updated: {updated_count}")
        print(f"Skipped (Not matched): {skipped_count}")

    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()

if __name__ == "__main__":
    import_zillow_boundaries()
