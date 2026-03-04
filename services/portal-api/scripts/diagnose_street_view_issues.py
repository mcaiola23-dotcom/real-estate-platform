"""
Diagnose Street View issues for specific parcels
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

def diagnose_parcels():
    """Diagnose specific parcels with Street View issues."""
    db = SessionLocal()
    
    addresses = [
        ("53 London Lane", "Stamford"),
        ("415 Belden Hill Rd", "Wilton"),
        ("109 Highfield Rd", "Wilton"),
        ("36 Rilling Ridge", "New Canaan"),
        ("34 Braeburn Dr", "New Canaan"),
        ("94 Dabney Rd", "New Canaan"),
    ]
    
    try:
        for addr, city in addresses:
            print("=" * 70)
            print(f"Checking: {addr}, {city}")
            print("=" * 70)
            
            # Find the parcel
            result = db.execute(text("""
                SELECT 
                    p.parcel_id,
                    p.address_full,
                    p.city,
                    p.property_type,
                    p.appraised_total,
                    ST_X(p.centroid) as lng,
                    ST_Y(p.centroid) as lat,
                    p.street_view_available,
                    p.street_view_checked_at,
                    av.estimated_value,
                    av.confidence_score
                FROM parcels p
                LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
                WHERE p.address_full ILIKE :addr
                    AND p.city ILIKE :city
                LIMIT 1
            """), {"addr": f"%{addr.split()[0]}%{addr.split()[-1]}%", "city": f"%{city}%"})
            
            row = result.fetchone()
            
            if row:
                print(f"FOUND Parcel")
                print(f"  Parcel ID: {row[0]}")
                print(f"  Address: {row[1]}")
                print(f"  City: {row[2]}")
                print(f"  Property Type: {row[3]}")
                print(f"  Appraised: ${row[4]:,.0f}")
                print(f"  Coordinates: {row[6]:.6f}, {row[5]:.6f}")
                print(f"  Street View Checked: {row[7]}")
                print(f"  Street View Available: {row[7]}")
                
                if row[9]:
                    print(f"  AVM: ${row[9]:,.0f} (confidence: {row[10]:.1%})")
                else:
                    print(f"  AVM: NOT FOUND")
                
                # Check if address_full looks complete
                if not row[1] or len(row[1]) < 5:
                    print(f"  WARNING: address_full is empty or very short!")
                
                # Test Google Street View URL
                if row[5] and row[6]:
                    sv_url = f"https://maps.googleapis.com/maps/api/streetview/metadata?location={row[6]},{row[5]}&radius=50&key=AIzaSyB1nXOuazIvXiZo8zRkWTW0iL-nawfFLFo"
                    print(f"\n  Google Metadata URL:")
                    print(f"  {sv_url}")
                
            else:
                print(f"NOT FOUND in database")
                print(f"  Searching more broadly...")
                
                # Try broader search
                result = db.execute(text("""
                    SELECT parcel_id, address_full, city
                    FROM parcels
                    WHERE address_full ILIKE :addr
                        AND city ILIKE :city
                    LIMIT 5
                """), {"addr": f"%{addr.split()[-1]}%", "city": f"%{city}%"})
                
                rows = result.fetchall()
                if rows:
                    print(f"  Similar addresses found:")
                    for r in rows:
                        print(f"    - {r[0]}: {r[1]}, {r[2]}")
                else:
                    print(f"  No similar addresses found")
            
            print()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_parcels()

