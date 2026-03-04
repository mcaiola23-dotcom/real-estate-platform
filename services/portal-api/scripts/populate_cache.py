import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def create_and_populate_cache():
    db = next(get_db())
    try:
        print("\nCreating neighborhood_boundary_cache table...")
        
        # 1. Create Table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS neighborhood_boundary_cache (
                neighborhood_id INTEGER PRIMARY KEY REFERENCES neighborhoods(id),
                boundary Geometry(MultiPolygon, 4326)
            );
        """))
        db.commit()
        print("[OK] Table created.")

        # 2. Populate Table
        print("Populating cache (this may take 30-60 seconds)...")
        
        # Get all neighborhood IDs
        ids = db.execute(text("SELECT id, name FROM neighborhoods WHERE boundary IS NOT NULL")).fetchall()
        
        count = 0
        total = len(ids)
        
        for row in ids:
            nid = row[0]
            name = row[1]
            print(f"[{count+1}/{total}] Processing {name} (ID: {nid})...")
            
            # The Merge Logic: Buffer 0.00015 (~16m) -> Buffer -0.00015
            # MakeValid first to ensure buffer works
            # Multi() to ensure type matches MultiPolygon
            query = text("""
                INSERT INTO neighborhood_boundary_cache (neighborhood_id, boundary)
                SELECT 
                    :nid, 
                    ST_Multi(
                        ST_SimplifyPreserveTopology(
                            ST_MakeValid(
                                ST_Buffer(
                                    ST_Buffer(ST_MakeValid(boundary), 0.001), 
                                    -0.001
                                )
                            ),
                            0.0001
                        )
                    )
                FROM neighborhoods 
                WHERE id = :nid
                ON CONFLICT (neighborhood_id) DO UPDATE 
                SET boundary = EXCLUDED.boundary;
            """)
            
            db.execute(query, {"nid": nid})
            db.commit()
            count += 1
            
        print("\n[OK] Cache population complete!")
        
        # Verify
        c = db.execute(text("SELECT count(*) FROM neighborhood_boundary_cache")).scalar()
        print(f"Cached records: {c}")

    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()

if __name__ == "__main__":
    create_and_populate_cache()
