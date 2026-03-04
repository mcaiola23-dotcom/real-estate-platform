import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def check_speed_no_stats():
    db = next(get_db())
    
    try:
        print("\nTesting 'No Stats' query performance...")
        start_time = time.time()
        
        query = text("""
                SELECT jsonb_build_object(
                    'type', 'FeatureCollection',
                    'features', jsonb_agg(feature)
                )
                FROM (
                    SELECT jsonb_build_object(
                        'type', 'Feature',
                        'id', id,
                        'properties', jsonb_build_object(
                            'id', id,
                            'name', name,
                            'city', city,
                            'parcel_count', parcel_count
                        ),
                        'geometry', ST_AsGeoJSON(boundary)::jsonb
                    ) AS feature
                    FROM neighborhoods
                ) features
        """)
        
        result = db.execute(query).fetchone()
        duration = time.time() - start_time
        print(f"Query executed in {duration:.4f} seconds")
        
        if result and result[0]:
            print("Result returned.")
        else:
            print("No result.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_speed_no_stats()
