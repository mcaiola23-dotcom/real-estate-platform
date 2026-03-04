from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT 
            city,
            COUNT(DISTINCT p.parcel_id) as total,
            COUNT(DISTINCT av.parcel_id) as with_avm,
            ROUND(100.0 * COUNT(DISTINCT av.parcel_id) / COUNT(DISTINCT p.parcel_id), 1) as pct,
            COUNT(DISTINCT CASE WHEN p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily') THEN p.parcel_id END) as residential,
            COUNT(DISTINCT CASE WHEN p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily') AND av.parcel_id IS NOT NULL THEN p.parcel_id END) as residential_with_avm
        FROM parcels p
        LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
        WHERE p.city IN ('Wilton', 'New Canaan', 'Westport', 'Greenwich')
        GROUP BY p.city
        ORDER BY city
    """)).fetchall()
    
    print("\nCurrent AVM Coverage:")
    print(f"{'City':15} {'Total':8} {'With AVM':10} {'Coverage':10} {'Residential':12} {'Res w/AVM':12} {'Res %':8}")
    print("-" * 90)
    for row in result:
        res_pct = (row[5] / row[4] * 100) if row[4] > 0 else 0
        print(f"{row[0]:15} {row[1]:8,} {row[2]:10,} {row[3]:9.1f}% {row[4]:12,} {row[5]:12,} {res_pct:7.1f}%")
    
    # Check why Wilton has low coverage
    print("\nWilton Analysis - Why low coverage?")
    wilton_detail = conn.execute(text("""
        SELECT 
            p.property_type,
            COUNT(*) as total,
            COUNT(CASE WHEN av.parcel_id IS NOT NULL THEN 1 END) as with_avm,
            COUNT(CASE WHEN p.square_feet IS NULL OR p.square_feet <= 0 THEN 1 END) as missing_sqft
        FROM parcels p
        LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
        WHERE p.city = 'Wilton'
          AND p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily')
        GROUP BY p.property_type
    """)).fetchall()
    
    print(f"{'Type':20} {'Total':8} {'With AVM':10} {'Missing SqFt':15}")
    print("-" * 60)
    for row in wilton_detail:
        print(f"{row[0]:20} {row[1]:8,} {row[2]:10,} {row[3]:15,}")

