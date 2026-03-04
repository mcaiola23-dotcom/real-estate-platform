import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def check_geometry_complexity():
    db = next(get_db())
    try:
        print("\nChecking Neighborhood Geometry Complexity...")
        # Check average and max number of geometries in the MultiPolygon boundaries
        query = text("""
            SELECT 
                id, 
                name, 
                ST_NumGeometries(boundary) as num_geoms,
                ST_GeometryType(boundary) as geom_type
            FROM neighborhoods 
            WHERE boundary IS NOT NULL 
            ORDER BY num_geoms DESC 
            LIMIT 5
        """)
        
        results = db.execute(query).fetchall()
        
        print("\nTop 5 Complex Neighborhoods:")
        for row in results:
            print(f"ID: {row[0]}, Name: {row[1]}, Geometries: {row[2]}, Type: {row[3]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_geometry_complexity()
