import sys
import os
import json
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def verify_response_fixed():
    db = next(get_db())
    
    try:
        print("\nVerifying Neighborhood Boundaries (Fixed) Response...")
        
        # Test unfiltered query with ST_SimplifyPreserveTopology
        query = text("""
                WITH neighborhood_stats AS (
                    SELECT 
                        p.neighborhood_id as id,
                        COUNT(CASE WHEN l.status = 'Active' THEN 1 END) as active_count,
                        COUNT(CASE WHEN l.status = 'Pending' THEN 1 END) as pending_count,
                        COUNT(CASE WHEN l.status = 'Sold' AND l.sold_date >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as sold_count
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
                        'geometry', ST_AsGeoJSON(ST_SimplifyPreserveTopology(n.boundary, 0.0001))::jsonb
                    ) AS feature
                    FROM neighborhoods n
                    LEFT JOIN neighborhood_stats s ON n.id = s.id
                ) features
        """)
        
        result = db.execute(query).fetchone()
        
        if result and result[0]:
            data = result[0]
            features = data.get('features')
            if features is None:
                print("❌ ERROR: 'features' is None/Null")
            else:
                print(f"✅ Success: Returned {len(features)} features")
                
                # Check for NULL geometries
                null_geoms = 0
                for f in features:
                    if f['geometry'] is None:
                        null_geoms += 1
                
                if null_geoms > 0:
                    print(f"❌ ERROR: Found {null_geoms} features with NULL geometry.")
                else:
                    print("✅ All features have valid geometry.")

        else:
            print("❌ ERROR: No result returned from DB")

    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_response_fixed()
