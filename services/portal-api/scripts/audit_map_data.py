import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def audit_map():
    db = next(get_db())
    try:
        # Get all neighborhoods with boundaries
        query = text("""
            SELECT 
                n.id, 
                n.city,
                n.name, 
                ST_NPoints(COALESCE(c.boundary, n.boundary)) as points,
                ST_NumGeometries(COALESCE(c.boundary, n.boundary)) as shapes,
                (c.boundary IS NOT NULL) as is_cached
            FROM neighborhoods n
            LEFT JOIN neighborhood_boundary_cache c ON n.id = c.neighborhood_id
            WHERE n.boundary IS NOT NULL OR c.boundary IS NOT NULL
            ORDER BY n.city, n.name
        """)
        
        results = db.execute(query).fetchall()
        
        print(f"{'ID':<4} | {'City':<15} | {'Name':<25} | {'Points':<6} | {'Shapes':<6} | {'Cached'}")
        print("-" * 80)
        
        for r in results:
            print(f"{r[0]:<4} | {r[1]:<15} | {r[2]:<25} | {r[3]:<6} | {r[4]:<6} | {r[5]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    audit_map()
