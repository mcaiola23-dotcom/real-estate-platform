"""
Clear Street View cache to force re-fetch with updated settings.

This will reset the street_view_available flag for all parcels,
causing them to be re-checked with the new coordinate-based approach
(no heading, no address).
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

def clear_cache():
    """Clear Street View cache."""
    db = SessionLocal()
    
    try:
        # Count how many cached entries we have
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM parcels 
            WHERE street_view_available IS NOT NULL
        """))
        cached_count = result.scalar()
        
        print(f"Found {cached_count} cached Street View entries")
        
        if cached_count == 0:
            print("No cache to clear!")
            return
        
        # Clear the cache (only the columns that exist)
        print("Clearing Street View cache...")
        db.execute(text("""
            UPDATE parcels 
            SET 
                street_view_available = NULL,
                street_view_checked_at = NULL
        """))
        
        db.commit()
        print(f"SUCCESS: Cleared {cached_count} cached entries")
        print("Street View images will be re-fetched with new settings on next view")
        
    except Exception as e:
        print(f"Error clearing cache: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Clear Street View Cache")
    print("=" * 60)
    clear_cache()

