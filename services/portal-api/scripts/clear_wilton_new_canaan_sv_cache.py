"""
Clear Street View cache for Wilton and New Canaan
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

def clear_cache():
    """Clear Street View cache for Wilton and New Canaan."""
    db = SessionLocal()
    
    try:
        # Count entries
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM parcels 
            WHERE city IN ('Wilton', 'New Canaan')
                AND street_view_available IS NOT NULL
        """))
        cached_count = result.scalar()
        
        print(f"Found {cached_count} cached Street View entries in Wilton/New Canaan")
        
        if cached_count == 0:
            print("No cache to clear!")
            return
        
        # Clear the cache
        print("Clearing Street View cache for Wilton and New Canaan...")
        db.execute(text("""
            UPDATE parcels 
            SET 
                street_view_available = NULL,
                street_view_checked_at = NULL
            WHERE city IN ('Wilton', 'New Canaan')
        """))
        
        db.commit()
        print(f"SUCCESS: Cleared {cached_count} cached entries")
        print("Properties in Wilton/New Canaan will be re-checked on next view")
        
    except Exception as e:
        print(f"Error clearing cache: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Clear Street View Cache - Wilton & New Canaan")
    print("=" * 60)
    clear_cache()















