import sys
import os
import geopandas as gpd
from sqlalchemy import text
from geoalchemy2.shape import from_shape

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

SHP_FILE = os.path.join(os.path.dirname(__file__), '../data/census_cdp/cb_2020_09_place_500k.shp')

def import_census_cdps():
    db = next(get_db())
    try:
        print(f"Loading Census data from {SHP_FILE}...")
        gdf = gpd.read_file(SHP_FILE)
        
        print(f"Loaded {len(gdf)} places.")
        
        # Ensure CRS is 4326 for matching/inserting
        if gdf.crs != "EPSG:4326":
            print("Reprojecting to EPSG:4326...")
            gdf = gdf.to_crs("EPSG:4326")

        updated_count = 0
        
        for idx, row in gdf.iterrows():
            name = row['NAME']
            # Census names often don't have "CDP" suffix in column, but let's check.
            # Usually just "Cos Cob", "Riverside".
            
            # Match by Name (Case Insensitive) against neighborhoods table
            # Limiting to Fairfield County towns might be safer, but name match is usually distinct enough locally.
            query_check = text("""
                SELECT id, city FROM neighborhoods 
                WHERE LOWER(name) = LOWER(:name)
            """)
            matches = db.execute(query_check, {"name": name}).fetchall()
            
            for match in matches:
                nid = match[0]
                city = match[1]
                print(f"✅ Match: Census '{name}' -> Neighborhood '{name}' ({city}) ID: {nid}")
                
                # Get the MultiPolygon geometry (Census might be Polygon types)
                geom = row.geometry
                
                # Update DB
                query_update = text("""
                    UPDATE neighborhoods 
                    SET boundary = ST_Multi(ST_SetSRID(ST_GeomFromText(:wkt), 4326))
                    WHERE id = :id
                """)
                db.execute(query_update, {"wkt": geom.wkt, "id": nid})
                
                # Update Cache
                query_cache = text("""
                    INSERT INTO neighborhood_boundary_cache (neighborhood_id, boundary)
                    VALUES (:id, ST_Multi(ST_SetSRID(ST_GeomFromText(:wkt), 4326)))
                    ON CONFLICT (neighborhood_id) DO UPDATE 
                    SET boundary = EXCLUDED.boundary
                """)
                db.execute(query_cache, {"wkt": geom.wkt, "id": nid})
                
                updated_count += 1
                
        db.commit()
        print(f"\n✅ Census Import Complete.")
        print(f"Total Neighborhoods Updated: {updated_count}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()

if __name__ == "__main__":
    import_census_cdps()
