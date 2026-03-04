import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def check_complexity():
    db = next(get_db())
    try:
        # ID 4: North Stamford (Updated by Zillow)
        # ID 65: Greenwich (Not updated, used Aggressive Merge)
        
        query = text("""
            SELECT 
                n.id, n.name, n.city,
                ST_NPoints(COALESCE(c.boundary, n.boundary)) as points,
                ST_NumGeometries(COALESCE(c.boundary, n.boundary)) as shapes
            FROM neighborhoods n
            LEFT JOIN neighborhood_boundary_cache c ON n.id = c.neighborhood_id
            WHERE n.id IN (14, 23, 26, 70)
        """)
        
        result = db.execute(query).fetchall()
        
        print(f"{'City':<15} | {'Name':<20} | {'Points':<8} | {'Shapes':<6}")
        print("-" * 60)
        for row in result:
            print(f"{row[2]:<15} | {row[1]:<20} | {row[3]:<8} | {row[4]:<6}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_complexity()
