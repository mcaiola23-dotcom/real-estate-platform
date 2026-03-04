"""
Find 53 London Lane parcel
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

def find_parcel():
    """Find 53 London Lane."""
    db = SessionLocal()
    
    try:
        # Search for London Lane in Wilton
        print("Searching for London Lane parcels in Wilton...")
        result = db.execute(text("""
            SELECT 
                parcel_id,
                address_full,
                city,
                property_type,
                appraised_total
            FROM parcels
            WHERE address_full ILIKE '%london%'
            AND city ILIKE '%wilton%'
            ORDER BY address_full
        """))
        
        rows = result.fetchall()
        print(f"\nFound {len(rows)} parcels with 'London' in address:")
        for row in rows:
            print(f"  {row[0]}: {row[1]}, {row[2]} ({row[3]}, ${row[4]:,.0f})")
        
        # Try broader search
        print("\n\nSearching all Wilton parcels with house numbers around 53...")
        result = db.execute(text("""
            SELECT 
                parcel_id,
                address_full,
                city,
                property_type,
                appraised_total
            FROM parcels
            WHERE city ILIKE '%wilton%'
            AND (address_full ILIKE '53 %' OR address_full ILIKE '% 53 %')
            AND address_full ILIKE '%lane%'
            ORDER BY address_full
            LIMIT 20
        """))
        
        rows = result.fetchall()
        print(f"Found {len(rows)} potential matches:")
        for row in rows:
            print(f"  {row[0]}: {row[1]}, {row[2]} ({row[3]}, ${row[4]:,.0f})")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    find_parcel()















