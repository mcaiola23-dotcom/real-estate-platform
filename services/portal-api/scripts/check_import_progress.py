"""Quick script to check CT GIS import progress."""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from sqlalchemy import text

print("="*80)
print("CT GIS IMPORT PROGRESS CHECK")
print("="*80)

db = SessionLocal()
try:
    # Get total count
    result = db.execute(text("SELECT COUNT(*) FROM parcels;"))
    total = result.fetchone()[0]
    print(f"\nTotal parcels in database: {total:,}")
    
    # Get counts by town
    result = db.execute(text("""
        SELECT town_name, COUNT(*) as count 
        FROM parcels 
        GROUP BY town_name 
        ORDER BY town_name;
    """))
    towns = result.fetchall()
    
    print(f"\nParcels by town ({len(towns)} towns):")
    print("-"*80)
    for town, count in towns:
        print(f"  {town:20s}: {count:7,} parcels")
    
    # Expected totals (from our examination)
    expected_totals = {
        'Bethel': 7805,
        'Bridgeport': 28061,
        'Brookfield': 7520,
        'Danbury': 19088,
        'Darien': 7602,
        'Easton': 3563,
        'Fairfield': 19620,
        'Greenwich': 19364,
        'Milford': 19408,
        'Monroe': 8339,
        'New Canaan': 7467,
        'Newtown': 11228,
        'Norwalk': 22132,
        'Redding': 4202,
        'Ridgefield': 9318,
        'Shelton': 13297,  # From source file
        'Stamford': 25722,
        'Stratford': 17876,  # From source file
        'Trumbull': 12151,  # From source file
        'Weston': 4213,  # From source file
        'Westport': 10537,  # From source file
        'Wilton': 6443,  # From source file (complete)
    }
    
    print("\n" + "="*80)
    print("COMPLETENESS CHECK")
    print("="*80)
    
    # Normalize town names for comparison (handle case variations)
    # First, sum counts for towns with same normalized name (handle duplicates)
    normalized_dict = {}
    for town, count in towns:
        normalized = town.strip().title()
        normalized_dict[normalized] = normalized_dict.get(normalized, 0) + count
    
    # Fix known case issues
    if 'New canaan' in normalized_dict:
        normalized_dict['New Canaan'] = normalized_dict.pop('New canaan')
    
    for town, expected in expected_totals.items():
        if expected:
            # Try exact match first, then case-insensitive
            actual = normalized_dict.get(town, 0)
            if actual == 0:
                # Try case-insensitive lookup
                for db_town, count in normalized_dict.items():
                    if db_town.lower() == town.lower():
                        actual = count
                        break
            
            if actual > 0:
                pct = (actual / expected) * 100
                status = "[OK]" if pct >= 95 else "[WARN]"
                print(f"{status} {town:20s}: {actual:7,}/{expected:7,} ({pct:5.1f}%)")
            else:
                print(f"[MISSING] {town:20s}: Not started")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

