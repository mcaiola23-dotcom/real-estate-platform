import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_buffer_merge():
    db = next(get_db())
    try:
        print("\nTesting ST_Buffer Merge on Bridgeport (ID 73)...")
        
        # Buffer by ~10 meters (0.0001 deg) then shrink back
        # This should bridge road gaps
        start_time = time.time()
        query = text("""
            SELECT 
                ST_NumGeometries(
                    ST_SimplifyPreserveTopology(
                        ST_Buffer(ST_Buffer(boundary, 0.0001), -0.0001), 
                        0.0001
                    )
                ) 
            FROM neighborhoods WHERE id = 73
        """)
        
        count = db.execute(query).scalar()
        elapsed = time.time() - start_time
        
        print(f"Buffer Merge Count: {count}")
        print(f"Time: {elapsed:.4f}s")
        
        if count < 100:
             print("✅ Success: Significant reduction!")
        else:
             print("❌ Failed to reduce significantly.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_buffer_merge()
