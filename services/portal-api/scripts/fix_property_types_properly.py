"""
Properly fix property types using property_type_detail
"""
from sqlalchemy import create_engine, text
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

engine = create_engine(settings.database_url)

print("=" * 80)
print("FIXING PROPERTY TYPES PROPERLY")
print("=" * 80)

with engine.connect() as conn:
    # Show current state
    print("\nCurrent Wilton property types:")
    current = conn.execute(text("""
        SELECT property_type, COUNT(*) 
        FROM parcels 
        WHERE city = 'Wilton' 
        GROUP BY property_type 
        ORDER BY COUNT(*) DESC
    """)).fetchall()
    for row in current:
        print(f"  {row[0]:20} {row[1]:6,}")
    
    # Sample property_type_detail values
    print("\nSample property_type_detail values in Wilton:")
    samples = conn.execute(text("""
        SELECT DISTINCT property_type_detail, COUNT(*)
        FROM parcels
        WHERE city = 'Wilton'
          AND property_type = 'VacantLand'
        GROUP BY property_type_detail
        ORDER BY COUNT(*) DESC
        LIMIT 10
    """)).fetchall()
    for row in samples:
        print(f"  {row[0]:40} {row[1]:6,}")
    
    # Apply comprehensive fix
    print("\nApplying comprehensive property type fix...")
    
    updates = conn.execute(text("""
        UPDATE parcels
        SET property_type = CASE
            WHEN LOWER(property_type_detail) LIKE '%single family%' THEN 'SingleFamily'
            WHEN LOWER(property_type_detail) LIKE '%1 family%' THEN 'SingleFamily'
            WHEN LOWER(property_type_detail) LIKE '%one family%' THEN 'SingleFamily'
            WHEN LOWER(property_type_detail) = 'residential' THEN 'SingleFamily'
            WHEN LOWER(property_type_detail) LIKE '%condo%' THEN 'Condo'
            WHEN LOWER(property_type_detail) LIKE '%townhouse%' THEN 'Townhouse'
            WHEN LOWER(property_type_detail) LIKE '%town house%' THEN 'Townhouse'
            WHEN LOWER(property_type_detail) LIKE '%two family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%2 family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%three family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%3 family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%four family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%4 family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%multi%family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%multiple dwelling%' THEN 'MultiFamily'
            ELSE property_type
        END
        WHERE city IN ('Wilton', 'New Canaan', 'Danbury', 'Easton', 'Ridgefield', 'Shelton', 'Weston')
          AND property_type_detail IS NOT NULL
          AND LOWER(property_type_detail) NOT LIKE '%vacant%'
          AND LOWER(property_type_detail) NOT LIKE '%commercial%'
          AND LOWER(property_type_detail) NOT LIKE '%industrial%'
    """))
    conn.commit()
    
    print(f"✓ Updated {updates.rowcount:,} properties")
    
    # Show new state
    print("\nNew Wilton property types:")
    new_state = conn.execute(text("""
        SELECT property_type, COUNT(*) 
        FROM parcels 
        WHERE city = 'Wilton' 
        GROUP BY property_type 
        ORDER BY COUNT(*) DESC
    """)).fetchall()
    for row in new_state:
        print(f"  {row[0]:20} {row[1]:6,}")

print("\n" + "=" * 80)
print("✅ PROPERTY TYPES FIXED!")
print("=" * 80)
print("Now run: python scripts/precompute_all_avms.py")

