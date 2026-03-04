import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_aggressive_merge():
    db = next(get_db())
    try:
        print("\nTesting Aggressive Buffer Merge on Bridgeport (ID 73)...")
        
        # Buffer 0.0004 deg (~44 meters) - should bridge almost any road
        # Then Union
        # Then un-buffer slightly less to keep it smooth? Or same amount.
        
        query = text("""
            SELECT 
                ST_NumGeometries(
                    ST_SimplifyPreserveTopology(
                        ST_Buffer(
                            ST_MakeValid(
                                ST_UnaryUnion(
                                    ST_Buffer(boundary, 0.0004)
                                )
                            ),
                            -0.0004
                        ),
                        0.0001
                    )
                ) as num_geoms
            FROM neighborhoods WHERE id = 73
        """)
        
        start_time = time.time()
        count = db.execute(query).scalar()
        elapsed = time.time() - start_time
        
        print(f"Aggressive Merge Count: {count}")
        print(f"Time: {elapsed:.4f}s")
        
        if count == 1:
             print("✅ Success: Unified into single shape!")
        else:
             print(f"❌ Still has {count} shapes.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_aggressive_merge()
