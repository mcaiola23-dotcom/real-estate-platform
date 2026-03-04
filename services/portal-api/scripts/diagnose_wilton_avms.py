"""Diagnose why Wilton still has low AVM count"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

db = SessionLocal()

# Check Wilton parcels by property type
print("=" * 70)
print("WILTON PARCEL BREAKDOWN")
print("=" * 70)

result = db.execute(text("""
    SELECT 
        p.property_type,
        COUNT(*) as total,
        COUNT(av1.id) as with_avm_v1,
        COUNT(av2.id) as with_avm_v2
    FROM parcels p
    LEFT JOIN avm_valuations av1 ON p.parcel_id = av1.parcel_id AND av1.model_version = 'v20251119'
    LEFT JOIN avm_valuations av2 ON p.parcel_id = av2.parcel_id AND av2.model_version = 'v20251119_market_adj'
    WHERE p.city = 'Wilton'
    GROUP BY p.property_type
    ORDER BY total DESC
"""))

for row in result:
    print(f"{row[0]}: {row[1]:,} total | v20251119: {row[2]:,} | v20251119_market_adj: {row[3]:,}")

print("\n" + "=" * 70)
print("WILTON RESIDENTIAL PROPERTIES")
print("=" * 70)

result = db.execute(text("""
    SELECT 
        COUNT(*) as total_residential,
        COUNT(av1.id) as with_v20251119,
        COUNT(av2.id) as with_market_adj
    FROM parcels p
    LEFT JOIN avm_valuations av1 ON p.parcel_id = av1.parcel_id AND av1.model_version = 'v20251119'
    LEFT JOIN avm_valuations av2 ON p.parcel_id = av2.parcel_id AND av2.model_version = 'v20251119_market_adj'
    WHERE p.city = 'Wilton'
        AND p.property_type IN ('SingleFamily', 'Condo', 'Townhouse', 'MultiFamily_2-4')
"""))

row = result.fetchone()
print(f"Total Residential: {row[0]:,}")
print(f"With v20251119: {row[1]:,}")
print(f"With v20251119_market_adj: {row[2]:,}")
print(f"With ANY AVM: {max(row[1], row[2]):,}")

# Check a few sample Wilton parcels
print("\n" + "=" * 70)
print("SAMPLE WILTON PARCELS")
print("=" * 70)

result = db.execute(text("""
    SELECT 
        p.parcel_id,
        p.address_full,
        p.property_type,
        p.appraised_total,
        av1.estimated_value as avm_v1,
        av2.estimated_value as avm_v2
    FROM parcels p
    LEFT JOIN avm_valuations av1 ON p.parcel_id = av1.parcel_id AND av1.model_version = 'v20251119'
    LEFT JOIN avm_valuations av2 ON p.parcel_id = av2.parcel_id AND av2.model_version = 'v20251119_market_adj'
    WHERE p.city = 'Wilton'
        AND p.property_type = 'SingleFamily'
    ORDER BY p.appraised_total DESC
    LIMIT 10
"""))

for row in result:
    v1 = f"${row[4]:,.0f}" if row[4] else "None"
    v2 = f"${row[5]:,.0f}" if row[5] else "None"
    print(f"{row[0]}: {row[1]}")
    print(f"  Type: {row[2]} | Appraised: ${row[3]:,.0f}")
    print(f"  AVM v20251119: {v1} | AVM market_adj: {v2}")

db.close()















