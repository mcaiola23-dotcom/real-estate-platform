import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_grid_union():
    db = next(get_db())
    try:
        print("\nTesting ST_SnapToGrid + ST_UnaryUnion on Bridgeport (ID 73)...")
        
        start_time = time.time()
        # Snap to ~11 meters grid (0.0001) then union
        query = text("""
            SELECT 
                ST_NumGeometries(
                    ST_SimplifyPreserveTopology(
                        ST_UnaryUnion(ST_SnapToGrid(boundary, 0.0001)), 
                        0.0001
                    )
                ) 
            FROM neighborhoods WHERE id = 73
        """)
        
        count = db.execute(query).scalar()
        elapsed = time.time() - start_time
        
        print(f"Grid Union Count: {count}")
        print(f"Time: {elapsed:.4f}s")
        
        if count < 100 and elapsed < 1.0:
             print("✅ Success: Fast and effective!")
        else:
             print("❌ Failed or too slow.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_grid_union()
