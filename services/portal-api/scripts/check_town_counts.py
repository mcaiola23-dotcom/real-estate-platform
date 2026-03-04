"""Check parcel counts for specific towns."""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from sqlalchemy import text

towns_to_check = ['Monroe', 'Darien', 'Milford', 'Brookfield']

db = SessionLocal()
try:
    for town in towns_to_check:
        result = db.execute(text("""
            SELECT town_name, COUNT(*) as count 
            FROM parcels 
            WHERE LOWER(town_name) = LOWER(:town)
            GROUP BY town_name
            ORDER BY town_name;
        """), {'town': town})
        
        rows = result.fetchall()
        total = sum(count for _, count in rows)
        print(f"\n{town}:")
        for town_name, count in rows:
            print(f"  '{town_name}': {count:,} parcels")
        print(f"  Total: {total:,} parcels")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()


