from sqlalchemy import create_engine, text
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

engine = create_engine(settings.database_url)

print("Fixing properties with 'residential' in property_type_detail...")

with engine.connect() as conn:
    result = conn.execute(text("""
        UPDATE parcels 
        SET property_type = 'SingleFamily' 
        WHERE LOWER(property_type_detail) LIKE '%residential%' 
          AND property_type != 'SingleFamily'
    """))
    conn.commit()
    print(f"✓ Updated {result.rowcount:,} properties to SingleFamily")
    
    # Check Wilton now
    wilton = conn.execute(text("""
        SELECT property_type, COUNT(*) 
        FROM parcels 
        WHERE city = 'Wilton' 
        GROUP BY property_type
        ORDER BY COUNT(*) DESC
    """)).fetchall()
    
    print("\nWilton property types now:")
    for row in wilton:
        print(f"  {row[0]:20} {row[1]:6,}")

