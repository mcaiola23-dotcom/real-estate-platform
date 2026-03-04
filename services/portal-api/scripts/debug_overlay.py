import sys
import os
import time
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def check_counts():
    db = next(get_db())
    
    try:
        # Check counts
        n_count = db.execute(text("SELECT COUNT(*) FROM neighborhoods")).scalar()
        p_count = db.execute(text("SELECT COUNT(*) FROM parcels")).scalar()
        l_count = db.execute(text("SELECT COUNT(*) FROM listings")).scalar()
        
        print(f"Neighborhoods: {n_count}")
        print(f"Parcels: {p_count}")
        print(f"Listings: {l_count}")
        
        # Test the 'No City' query performance
        print("\nTesting 'No City' query performance...")
        start_time = time.time()
        
        query = text("""
                WITH neighborhood_stats AS (
                    SELECT 
                        p.neighborhood_id as id,
                        COUNT(CASE WHEN l.status = 'Active' THEN 1 END) as active_count,
                        COUNT(CASE WHEN l.status = 'Pending' THEN 1 END) as pending_count,
                        COUNT(CASE WHEN l.status = 'Sold' THEN 1 END) as sold_count
                    FROM parcels p
                    JOIN listings l ON l.parcel_id = p.parcel_id
                    WHERE p.neighborhood_id IS NOT NULL
                    GROUP BY p.neighborhood_id
                )
                SELECT jsonb_build_object(
                    'type', 'FeatureCollection',
                    'features', jsonb_agg(feature)
                )
                FROM (
                    SELECT jsonb_build_object(
                        'type', 'Feature',
                        'id', n.id,
                        'properties', jsonb_build_object(
                            'id', n.id,
                            'name', n.name,
                            'city', n.city,
                            'parcel_count', n.parcel_count,
                            'active_count', COALESCE(s.active_count, 0),
                            'pending_count', COALESCE(s.pending_count, 0),
                            'sold_count', COALESCE(s.sold_count, 0)
                        ),
                        'geometry', ST_AsGeoJSON(n.boundary)::jsonb
                    ) AS feature
                    FROM neighborhoods n
                    LEFT JOIN neighborhood_stats s ON n.id = s.id
                ) features
        """)
        
        result = db.execute(query).fetchone()
        duration = time.time() - start_time
        print(f"Query executed in {duration:.4f} seconds")
        
        if result and result[0]:
            print("Result returned.")
            data = result[0]
            if data.get('features') is None:
                print("WARNING: features is NULL")
            else:
                print(f"Features count: {len(data['features'])}")
        else:
            print("No result returned.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_counts()
