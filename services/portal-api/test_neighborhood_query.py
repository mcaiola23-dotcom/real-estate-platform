"""Test the neighborhood query logic directly."""

from app.db import get_db
from sqlalchemy import text

db = next(get_db())

# Test the exact query used in search.py
neighborhoods = ["Westover"]
placeholders = ','.join([f':name{i}' for i in range(len(neighborhoods))])
params = {f'name{i}': name for i, name in enumerate(neighborhoods)}

print(f"Query: SELECT id FROM neighborhoods WHERE name IN ({placeholders})")
print(f"Params: {params}")

result = db.execute(
    text(f"SELECT id FROM neighborhoods WHERE name IN ({placeholders})"),
    params
).fetchall()

print(f"\nResult: {result}")

if result:
    neighborhood_id_list = [row[0] for row in result]
    print(f"IDs: {neighborhood_id_list}")
    
    # Now test the parcel query
    parcel_count = db.execute(
        text(f"SELECT COUNT(*) FROM parcels WHERE neighborhood_id IN ({','.join(map(str, neighborhood_id_list))})")
    ).fetchone()
    
    print(f"Parcels matching: {parcel_count[0]}")
    
    # Sample some parcels
    samples = db.execute(
        text(f"SELECT parcel_id, address_full, city FROM parcels WHERE neighborhood_id IN ({','.join(map(str, neighborhood_id_list))}) LIMIT 5")
    ).fetchall()
    
    print(f"\nSample parcels:")
    for row in samples:
        print(f"  {row[0]} - {row[1]} ({row[2]})")

