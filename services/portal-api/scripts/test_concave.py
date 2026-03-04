import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_concave_hull():
    db = next(get_db())
    try:
        print("\nTesting ST_ConcaveHull on Bridgeport (ID 73)...")
        
        start_time = time.time()
        # Concave Hull with 99% target
        query = text("""
            SELECT 
                ST_NumGeometries(
                    ST_SimplifyPreserveTopology(
                        ST_ConcaveHull(boundary, 0.99), 
                        0.0001
                    )
                ) 
            FROM neighborhoods WHERE id = 73
        """)
        
        count = db.execute(query).scalar()
        elapsed = time.time() - start_time
        
        print(f"Concave Hull Count: {count}")
        print(f"Time: {elapsed:.4f}s")
        
        if count < 10 and elapsed < 0.2:
             print("✅ Success: Blazing fast and clean!")
        else:
             print(f"❌ Result: {count} geoms, {elapsed:.4f}s")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_concave_hull()
