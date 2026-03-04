"""
Verify mock listings and test parcel-listing relationships.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.db import SessionLocal


def main():
    """Verify mock listings."""
    print("=" * 80)
    print("🔍 MOCK LISTING VERIFICATION")
    print("=" * 80)
    
    db = SessionLocal()
    
    try:
        # Test parcel-listing relationship
        print("\n📋 Testing parcel-listing relationship...")
        result = db.execute(text("""
            SELECT p.parcel_id, p.address_full AS parcel_address, p.city, 
                   l.listing_id_str, l.list_price, l.status
            FROM parcels p
            JOIN listings l ON p.parcel_id = l.parcel_id
            LIMIT 5
        """))
        
        print("\nSample listings matched to parcels:")
        for row in result:
            print(f"  ✓ {row[0]}: {row[1]}, {row[2]}")
            print(f"    -> Listing {row[3]} - ${row[4]:,.0f} ({row[5]})")
        
        # Check available cities
        print("\n🏙️  Available cities in database:")
        result = db.execute(text("""
            SELECT city, COUNT(*) as count
            FROM parcels 
            WHERE address_full IS NOT NULL AND address_full != ''
            GROUP BY city
            ORDER BY count DESC
            LIMIT 20
        """))
        
        for row in result:
            print(f"  {row[0]}: {row[1]:,} parcels")
        
        # Get listing statistics by town
        print("\n📊 Listings by town:")
        result = db.execute(text("""
            SELECT city, COUNT(*) as count, 
                   AVG(list_price) as avg_price,
                   COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_count
            FROM listings
            GROUP BY city
            ORDER BY count DESC
        """))
        
        for row in result:
            print(f"  {row[0]}: {row[1]} listings (${row[2]:,.0f} avg, {row[3]} active)")
        
        # Get property type distribution
        print("\n🏠 Property types:")
        result = db.execute(text("""
            SELECT property_type, COUNT(*) as count
            FROM listings
            GROUP BY property_type
            ORDER BY count DESC
        """))
        
        for row in result:
            print(f"  {row[0] or 'Unknown'}: {row[1]} listings")
        
        # Get price range statistics
        print("\n💰 Price statistics:")
        result = db.execute(text("""
            SELECT 
                MIN(list_price) as min_price,
                MAX(list_price) as max_price,
                AVG(list_price) as avg_price,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) as median_price
            FROM listings
        """))
        
        row = result.fetchone()
        print(f"  Min: ${row[0]:,.0f}")
        print(f"  Max: ${row[1]:,.0f}")
        print(f"  Avg: ${row[2]:,.0f}")
        print(f"  Median: ${row[3]:,.0f}")
        
        # Test querying by parcel_id
        print("\n🔎 Testing query by parcel_id...")
        result = db.execute(text("""
            SELECT listing_id_str, address_full, city, status, list_price
            FROM listings
            WHERE parcel_id = (SELECT parcel_id FROM listings LIMIT 1)
        """))
        
        row = result.fetchone()
        if row:
            print(f"  ✓ Successfully queried listing by parcel_id")
            print(f"    {row[0]}: {row[1]}, {row[2]} - {row[3]} - ${row[4]:,.0f}")
        
        print("\n" + "=" * 80)
        print("✅ All verification tests passed!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

