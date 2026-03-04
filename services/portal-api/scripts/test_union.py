import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def test_unary_union():
    db = next(get_db())
    try:
        print("\nTesting ST_UnaryUnion on Bridgeport (ID 73)...")
        
        # Measure time for original query equivalent
        start_time = time.time()
        query_orig = text("""
            SELECT ST_NumGeometries(ST_SimplifyPreserveTopology(boundary, 0.0001)) 
            FROM neighborhoods WHERE id = 73
        """)
        orig_count = db.execute(query_orig).scalar()
        orig_time = time.time() - start_time
        print(f"Original: {orig_count} geoms, Time: {orig_time:.4f}s")
        
        # Measure time for UnaryUnion
        start_time = time.time()
        query_union = text("""
            SELECT ST_NumGeometries(ST_SimplifyPreserveTopology(ST_UnaryUnion(boundary), 0.0001)) 
            FROM neighborhoods WHERE id = 73
        """)
        union_count = db.execute(query_union).scalar()
        union_time = time.time() - start_time
        print(f"Union: {union_count} geoms, Time: {union_time:.4f}s")
        
        if union_count < orig_count:
            print("✅ ST_UnaryUnion successfully reduced geometry count!")
        else:
            print("❌ ST_UnaryUnion did not reduce geometry count.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_unary_union()
