"""Generate actual boundary polygons for neighborhoods using parcel convex hulls."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import get_db
from sqlalchemy import text

def main():
    db = next(get_db())
    
    print("Generating neighborhood boundaries from parcel locations...")
    
    # Update each neighborhood's boundary to be the convex hull of its parcels
    result = db.execute(text("""
        UPDATE neighborhoods n
        SET boundary = (
            SELECT ST_Multi(ST_Union(p.geometry))
            FROM parcels p
            WHERE p.neighborhood_id = n.id
        )
        WHERE id IN (
            SELECT DISTINCT neighborhood_id 
            FROM parcels 
            WHERE neighborhood_id IS NOT NULL
        )
        RETURNING id, name, city, ST_GeometryType(boundary) as geom_type
    """))
    
    updated = result.fetchall()
    
    print(f"\n✓ Updated {len(updated)} neighborhoods with boundaries:")
    for row in updated:
        print(f"   - {row[1]}, {row[2]} ({row[3]})")
    
    db.commit()
    print("\n✓ All neighborhood boundaries generated!")

if __name__ == "__main__":
    main()

