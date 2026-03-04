"""
Investigate Stamford data quality issues.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.db import SessionLocal


def main():
    """Investigate Stamford parcel data."""
    print("=" * 80)
    print("🔍 STAMFORD DATA INVESTIGATION")
    print("=" * 80)
    
    db = SessionLocal()
    
    try:
        # Check Stamford parcels
        print("\n📊 Stamford Parcel Summary:")
        result = db.execute(text("""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN address_full IS NULL OR address_full = '' THEN 1 END) as empty_address,
                   COUNT(CASE WHEN geometry IS NULL THEN 1 END) as missing_geometry
            FROM parcels 
            WHERE city = 'Stamford'
        """))
        row = result.fetchone()
        total, empty_addr, missing_geom = row
        print(f"  Total parcels: {total:,}")
        print(f"  Empty addresses: {empty_addr:,} ({(empty_addr/total*100):.1f}%)")
        print(f"  Missing geometry: {missing_geom:,} ({(missing_geom/total*100):.1f}%)")
        
        # Check London Lane area
        print("\n🏡 London Lane Area:")
        result = db.execute(text("""
            SELECT parcel_id, address_full, address_number, street_name, geometry IS NOT NULL as has_geometry
            FROM parcels 
            WHERE city = 'Stamford' 
            AND (address_full LIKE '%London%' OR street_name LIKE '%London%')
            LIMIT 10
        """))
        
        found_london = False
        for row in result:
            found_london = True
            geom_status = "✓ Has geometry" if row[4] else "✗ Missing geometry"
            print(f"  {row[0]}: {row[1] or 'NO ADDRESS'}")
            print(f"    Number: {row[2] or 'N/A'} | Street: {row[3] or 'N/A'} | {geom_status}")
        
        if not found_london:
            print("  ⚠️  No parcels found matching 'London'")
            print("\n  Checking all Stamford street names containing 'Lon'...")
            result = db.execute(text("""
                SELECT DISTINCT street_name
                FROM parcels 
                WHERE city = 'Stamford' 
                AND street_name LIKE '%Lon%'
                LIMIT 10
            """))
            for row in result:
                print(f"    - {row[0]}")
        
        # Sample of Stamford data
        print("\n📋 Sample Stamford Parcels:")
        result = db.execute(text("""
            SELECT parcel_id, address_full, address_number, street_name, 
                   geometry IS NOT NULL as has_geometry
            FROM parcels 
            WHERE city = 'Stamford'
            LIMIT 10
        """))
        
        for row in result:
            geom_status = "✓" if row[4] else "✗"
            print(f"  {geom_status} {row[0]}: {row[1] or 'NO ADDRESS'}")
        
        # Compare with Darien (which works)
        print("\n📊 Darien Comparison:")
        result = db.execute(text("""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN address_full IS NULL OR address_full = '' THEN 1 END) as empty_address,
                   COUNT(CASE WHEN geometry IS NULL THEN 1 END) as missing_geometry
            FROM parcels 
            WHERE city = 'Darien'
        """))
        row = result.fetchone()
        total, empty_addr, missing_geom = row
        print(f"  Total parcels: {total:,}")
        print(f"  Empty addresses: {empty_addr:,} ({(empty_addr/total*100):.1f}%)")
        print(f"  Missing geometry: {missing_geom:,} ({(missing_geom/total*100):.1f}%)")
        
        print("\n📋 Sample Darien Parcels:")
        result = db.execute(text("""
            SELECT parcel_id, address_full, geometry IS NOT NULL as has_geometry
            FROM parcels 
            WHERE city = 'Darien'
            LIMIT 5
        """))
        
        for row in result:
            geom_status = "✓" if row[2] else "✗"
            print(f"  {geom_status} {row[0]}: {row[1] or 'NO ADDRESS'}")
        
        # Check which towns were imported
        print("\n🗺️  All Towns in Database:")
        result = db.execute(text("""
            SELECT city, COUNT(*) as count,
                   COUNT(CASE WHEN address_full IS NULL OR address_full = '' THEN 1 END) as empty_addr
            FROM parcels
            GROUP BY city
            ORDER BY count DESC
        """))
        
        for row in result:
            empty_pct = (row[2]/row[1]*100) if row[1] > 0 else 0
            print(f"  {row[0]}: {row[1]:,} parcels ({row[2]:,} empty addresses = {empty_pct:.1f}%)")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()


