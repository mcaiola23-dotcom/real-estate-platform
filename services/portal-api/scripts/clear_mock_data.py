"""
Clear mock/test data from the database.
This will remove all listings, agents, and offices.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.db import SessionLocal


def main():
    """Clear mock data from database."""
    print("=" * 80)
    print("🗑️  CLEARING MOCK DATA")
    print("=" * 80)
    
    db = SessionLocal()
    
    try:
        # Get counts before deletion
        result = db.execute(text("SELECT COUNT(*) FROM listings"))
        listings_count = result.fetchone()[0]
        
        result = db.execute(text("SELECT COUNT(*) FROM agents"))
        agents_count = result.fetchone()[0]
        
        result = db.execute(text("SELECT COUNT(*) FROM offices"))
        offices_count = result.fetchone()[0]
        
        print(f"\n📊 Current counts:")
        print(f"  Listings: {listings_count}")
        print(f"  Agents: {agents_count}")
        print(f"  Offices: {offices_count}")
        
        if listings_count == 0 and agents_count == 0 and offices_count == 0:
            print("\n✅ No mock data to clear!")
            return
        
        print("\n🗑️  Deleting...")
        
        # Delete in correct order (foreign keys)
        db.execute(text("DELETE FROM listings"))
        print("  ✓ Deleted listings")
        
        db.execute(text("DELETE FROM agents"))
        print("  ✓ Deleted agents")
        
        db.execute(text("DELETE FROM offices"))
        print("  ✓ Deleted offices")
        
        db.commit()
        
        print("\n✅ Successfully cleared all mock data!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

