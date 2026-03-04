import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def troubleshoot_missing():
    db = next(get_db())
    try:
        # Check ID 2 (Cove) and 3 (Downtown)
        print("Checking Cache for ID 2 and 3:")
        query = text("""
            SELECT n.id, n.name, 
                   (c.boundary IS NOT NULL) as in_cache, 
                   ST_NPoints(c.boundary) as points,
                   ST_Area(c.boundary) as area
            FROM neighborhoods n
            LEFT JOIN neighborhood_boundary_cache c ON n.id = c.neighborhood_id
            WHERE n.id IN (2, 3)
        """)
        results = db.execute(query).fetchall()
        for r in results:
            print(f"ID: {r[0]} | Name: {r[1]} | Cache: {r[2]} | Points: {r[3]} | Area: {r[4]}")
            
        # Check intersect manually for one point in Downtown?
        # Let's find a parcel in 06901 (Downtown Zip) and checks its coords.
        print("\nChecking a random parcel in 06901:")
        query_parcel = text("""
            SELECT p.address_full, ST_AsText(p.geometry), p.city
            FROM parcels p
            WHERE p.zip_code = '06901'
            LIMIT 1
        """)
        parcel = db.execute(query_parcel).fetchone()
        if parcel:
            print(f"Parcel: {parcel[0]} | Geom: {parcel[1]}")
            
            # Check intersection against ID 3
            query_test = text("""
                SELECT ST_Intersects(c.boundary, ST_GeomFromText(:pt, 4326))
                FROM neighborhood_boundary_cache c
                WHERE c.neighborhood_id = 3
            """)
            intersects = db.execute(query_test, {"pt": parcel[1]}).scalar()
            print(f"Intersects Downtown (ID 3)? {intersects}")
        else:
            print("No parcels found in 06901")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    troubleshoot_missing()
