import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_ultra_aggressive():
    db = next(get_db())
    try:
        print("\nTesting Ultra Aggressive Buffer (0.0008)...")
        
        query = text("""
            SELECT 
                ST_NumGeometries(
                    ST_SimplifyPreserveTopology(
                        ST_Buffer(
                            ST_MakeValid(
                                ST_UnaryUnion(
                                    ST_Buffer(boundary, 0.0008)
                                )
                            ),
                            -0.0008
                        ),
                        0.0001
                    )
                ) as num_geoms
            FROM neighborhoods WHERE id = 73
        """)
        
        start_time = time.time()
        count = db.execute(query).scalar()
        elapsed = time.time() - start_time
        
        print(f"Result: {count} shapes")
        print(f"Time: {elapsed:.4f}s")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ultra_aggressive()
