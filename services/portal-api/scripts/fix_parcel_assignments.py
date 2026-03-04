import sys
import os
from sqlalchemy import text
import time

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def fix_parcel_assignments():
    db = next(get_db())
    start_time = time.time()
    try:
        print("Starting Parcel Spatial Re-assignment...")
        print("This may take 10-30 seconds depending on data size.")

        # 1. Reset all parcels to NULL (or City Level) first? 
        # Actually safer to just overwrite.
        
        # 2. Update parcels to match Specific Neighborhoods (Excluding Town-level chunks)
        # We rely on neighborhood_boundary_cache now.
        
        # We prefer the specific neighborhoods. 
        # If there are overlaps, the result is arbitrary, but usually Zillow/Census don't overlap much effectively.
        # We filter out matching Name=City (e.g. Stamford=Stamford).
        
        query = text("""
            UPDATE parcels p
            SET neighborhood_id = n.id
            FROM neighborhoods n
            JOIN neighborhood_boundary_cache c ON n.id = c.neighborhood_id
            WHERE 
                ST_Intersects(c.boundary, p.geometry)
                AND LOWER(n.city) = LOWER(p.city) -- Optimization / Safety
                AND LOWER(n.name) != LOWER(n.city) -- Exclude generic Town polygons
        """)
        
        result = db.execute(query)
        db.commit()

        print(f"[OK] Pass 1 (intersection): Updated {result.rowcount} parcels.")
        print(f"Time taken: {time.time() - start_time:.2f}s")

        # Pass 2: Nearest-neighbor fallback for parcels still on city-level neighborhoods
        # These are parcels just outside Zillow boundary polygons.
        # Assign them to the nearest specific neighborhood (within 2km max).
        print("\nPass 2: Nearest-neighbor fallback for city-level parcels...")
        pass2_start = time.time()

        # Get all city-level neighborhood IDs (where name = city)
        city_level = db.execute(text("""
            SELECT id, name, city FROM neighborhoods
            WHERE LOWER(name) = LOWER(city)
        """)).fetchall()

        total_pass2 = 0
        for row in city_level:
            city_nid = row[0]
            city_name = row[2]

            # For each parcel assigned to the city-level neighborhood,
            # find the nearest specific neighborhood boundary (within 2km)
            nearest_query = text("""
                UPDATE parcels p
                SET neighborhood_id = nearest.nid
                FROM (
                    SELECT DISTINCT ON (p2.parcel_id)
                        p2.parcel_id,
                        n.id as nid
                    FROM parcels p2
                    JOIN neighborhood_boundary_cache c ON true
                    JOIN neighborhoods n ON n.id = c.neighborhood_id
                    WHERE p2.neighborhood_id = :city_nid
                      AND LOWER(n.city) = LOWER(:city_name)
                      AND LOWER(n.name) != LOWER(n.city)
                      AND ST_DWithin(
                          ST_Centroid(p2.geometry::geometry)::geography,
                          c.boundary::geography,
                          2000
                      )
                    ORDER BY p2.parcel_id,
                             ST_Distance(
                                 ST_Centroid(p2.geometry::geometry)::geography,
                                 c.boundary::geography
                             )
                ) nearest
                WHERE p.parcel_id = nearest.parcel_id
            """)

            result2 = db.execute(nearest_query, {
                "city_nid": city_nid,
                "city_name": city_name
            })
            db.commit()

            if result2.rowcount > 0:
                print(f"  {city_name}: {result2.rowcount} parcels reassigned via nearest-neighbor")
                total_pass2 += result2.rowcount

        print(f"[OK] Pass 2: {total_pass2} parcels reassigned.")
        print(f"Time taken: {time.time() - pass2_start:.2f}s")
        print(f"\nTotal time: {time.time() - start_time:.2f}s")

    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()

if __name__ == "__main__":
    fix_parcel_assignments()
