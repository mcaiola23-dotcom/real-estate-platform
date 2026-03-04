"""Quick check of AVM progress"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

db = SessionLocal()

# Check total AVMs by version
result = db.execute(text("""
    SELECT model_version, COUNT(*) as count, MAX(created_at) as latest
    FROM avm_valuations 
    GROUP BY model_version 
    ORDER BY latest DESC
"""))

print("AVM Counts by Model Version:")
for row in result:
    print(f"  {row[0]}: {row[1]:,} AVMs (latest: {row[2]})")

# Check Wilton specifically
result = db.execute(text("""
    SELECT COUNT(*) 
    FROM parcels p
    INNER JOIN avm_valuations av ON p.parcel_id = av.parcel_id
    WHERE p.city = 'Wilton'
"""))
wilton_count = result.scalar()
print(f"\nWilton AVMs: {wilton_count:,}")

# Check New Canaan
result = db.execute(text("""
    SELECT COUNT(*) 
    FROM parcels p
    INNER JOIN avm_valuations av ON p.parcel_id = av.parcel_id
    WHERE p.city = 'New Canaan'
"""))
nc_count = result.scalar()
print(f"New Canaan AVMs: {nc_count:,}")

db.close()















