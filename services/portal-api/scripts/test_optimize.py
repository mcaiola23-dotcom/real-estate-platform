import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_optimize():
    db = next(get_db())
    try:
        print("\nTesting Optimized Pipeline on Bridgeport (ID 73)...")
        
        start_time = time.time()
        # Pipeline: Simplify -> Snap -> Buffer(0) -> Union -> Buffer(+-)
        query = text("""
            SELECT 
                ST_NumGeometries(
                    ST_SimplifyPreserveTopology(
                        ST_Buffer(
                            ST_Buffer(
                                ST_UnaryUnion(
                                    ST_MakeValid(
                                        ST_SnapToGrid(
                                            ST_Simplify(boundary, 0.0001),
                                            0.0001
                                        )
                                    )
                                ), 
                                0.0001
                            ),
                            -0.0001
                        ),
                        0.0001
                    )
                ) 
            FROM neighborhoods WHERE id = 73
        """)
        
        count = db.execute(query).scalar()
        elapsed = time.time() - start_time
        
        print(f"Optimized Count: {count}")
        print(f"Time: {elapsed:.4f}s")
        
        if elapsed < 0.5:
             print("✅ Success: Sub-second performance!")
        else:
             print(f"❌ Time: {elapsed:.4f}s")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_optimize()
