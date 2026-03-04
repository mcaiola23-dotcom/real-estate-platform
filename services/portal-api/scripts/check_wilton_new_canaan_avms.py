"""
Check AVM coverage for Wilton and New Canaan parcels
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

def check_avms():
    """Check AVM coverage for Wilton and New Canaan."""
    db = SessionLocal()
    
    try:
        # Check Wilton
        print("=" * 60)
        print("WILTON AVMs")
        print("=" * 60)
        
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_parcels,
                COUNT(CASE WHEN av.id IS NOT NULL THEN 1 END) as with_avm,
                ROUND(100.0 * COUNT(CASE WHEN av.id IS NOT NULL THEN 1 END) / COUNT(*), 1) as coverage_pct
            FROM parcels p
            LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
            WHERE p.city = 'Wilton'
                AND p.property_type IN ('SingleFamily', 'Condo', 'Townhouse', 'MultiFamily_2-4')
        """))
        
        row = result.fetchone()
        print(f"Total parcels: {row[0]}")
        print(f"With AVM: {row[1]}")
        print(f"Coverage: {row[2]}%")
        
        # Sample 10 parcels without AVMs
        print("\nSample parcels WITHOUT AVM:")
        result = db.execute(text("""
            SELECT p.parcel_id, p.address_full, p.property_type, p.appraised_total
            FROM parcels p
            LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
            WHERE p.city = 'Wilton'
                AND p.property_type IN ('SingleFamily', 'Condo', 'Townhouse', 'MultiFamily_2-4')
                AND av.id IS NULL
            LIMIT 10
        """))
        
        for row in result:
            print(f"  {row[0]}: {row[1]} ({row[2]}, ${row[3]:,.0f})")
        
        # Check New Canaan
        print("\n" + "=" * 60)
        print("NEW CANAAN AVMs")
        print("=" * 60)
        
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_parcels,
                COUNT(CASE WHEN av.id IS NOT NULL THEN 1 END) as with_avm,
                ROUND(100.0 * COUNT(CASE WHEN av.id IS NOT NULL THEN 1 END) / COUNT(*), 1) as coverage_pct
            FROM parcels p
            LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
            WHERE p.city = 'New Canaan'
                AND p.property_type IN ('SingleFamily', 'Condo', 'Townhouse', 'MultiFamily_2-4')
        """))
        
        row = result.fetchone()
        print(f"Total parcels: {row[0]}")
        print(f"With AVM: {row[1]}")
        print(f"Coverage: {row[2]}%")
        
        # Sample 10 parcels without AVMs
        print("\nSample parcels WITHOUT AVM:")
        result = db.execute(text("""
            SELECT p.parcel_id, p.address_full, p.property_type, p.appraised_total
            FROM parcels p
            LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
            WHERE p.city = 'New Canaan'
                AND p.property_type IN ('SingleFamily', 'Condo', 'Townhouse', 'MultiFamily_2-4')
                AND av.id IS NULL
            LIMIT 10
        """))
        
        for row in result:
            print(f"  {row[0]}: {row[1]} ({row[2]}, ${row[3]:,.0f})")
        
        # Check if 53 London Lane has an AVM
        print("\n" + "=" * 60)
        print("53 LONDON LANE CHECK")
        print("=" * 60)
        
        result = db.execute(text("""
            SELECT 
                p.parcel_id,
                p.address_full,
                p.city,
                p.property_type,
                p.appraised_total,
                av.estimated_value,
                av.confidence_score
            FROM parcels p
            LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
            WHERE p.address_full ILIKE '%london%lane%'
                AND p.city = 'Wilton'
        """))
        
        row = result.fetchone()
        if row:
            print(f"Parcel ID: {row[0]}")
            print(f"Address: {row[1]}")
            print(f"City: {row[2]}")
            print(f"Property Type: {row[3]}")
            print(f"Appraised: ${row[4]:,.0f}")
            if row[5]:
                print(f"AVM: ${row[5]:,.0f}")
                print(f"Confidence: {row[6]:.1%}")
            else:
                print("AVM: NOT FOUND")
        else:
            print("Parcel not found!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_avms()

