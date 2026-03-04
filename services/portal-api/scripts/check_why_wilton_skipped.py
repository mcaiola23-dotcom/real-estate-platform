"""Check why Wilton parcels were skipped during AVM pre-computation"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

db = SessionLocal()

print("Checking 10 sample Wilton SingleFamily parcels for missing data...")
print("=" * 70)

result = db.execute(text("""
    SELECT 
        p.parcel_id,
        p.address_full,
        p.property_type,
        p.appraised_total,
        p.land_value,
        p.building_value,
        p.square_feet,
        p.lot_size,
        p.bedrooms,
        p.bathrooms,
        p.year_built,
        CASE WHEN av.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_avm
    FROM parcels p
    LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
    WHERE p.city = 'Wilton'
        AND p.property_type = 'SingleFamily'
    LIMIT 10
"""))

for row in result:
    print(f"\n{row[0]}: {row[1]}")
    print(f"  Property Type: {row[2]}")
    print(f"  Appraised Total: ${row[3]:,.0f if row[3] else 0}")
    print(f"  Land Value: ${row[4]:,.0f if row[4] else 0}")
    print(f"  Building Value: ${row[5]:,.0f if row[5] else 0}")
    print(f"  Square Feet: {row[6] or 'MISSING'}")
    print(f"  Lot Size: {row[7] or 'MISSING'}")
    print(f"  Bedrooms: {row[8] or 'MISSING'}")
    print(f"  Bathrooms: {row[9] or 'MISSING'}")
    print(f"  Year Built: {row[10] or 'MISSING'}")
    print(f"  Has AVM: {row[11]}")

# Check how many Wilton parcels have square_feet
print("\n" + "=" * 70)
print("WILTON DATA COMPLETENESS")
print("=" * 70)

result = db.execute(text("""
    SELECT 
        COUNT(*) as total,
        COUNT(square_feet) as with_sqft,
        COUNT(lot_size) as with_lot_size,
        COUNT(bedrooms) as with_bedrooms,
        COUNT(bathrooms) as with_bathrooms,
        COUNT(year_built) as with_year_built
    FROM parcels
    WHERE city = 'Wilton'
        AND property_type = 'SingleFamily'
"""))

row = result.fetchone()
print(f"Total SingleFamily: {row[0]:,}")
print(f"With Square Feet: {row[1]:,} ({row[1]/row[0]*100:.1f}%)")
print(f"With Lot Size: {row[2]:,} ({row[2]/row[0]*100:.1f}%)")
print(f"With Bedrooms: {row[3]:,} ({row[3]/row[0]*100:.1f}%)")
print(f"With Bathrooms: {row[4]:,} ({row[4]/row[0]*100:.1f}%)")
print(f"With Year Built: {row[5]:,} ({row[5]/row[0]*100:.1f}%)")

db.close()

