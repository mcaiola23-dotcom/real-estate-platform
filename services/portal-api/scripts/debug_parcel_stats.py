import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def check_assignments():
    db = next(get_db())
    try:
        # Check Stamford (City ID 66?) stats vs Sub-neighborhoods (e.g. Westover ID 7, North Stamford ID 4)
        
        print("Checking Neighborhood Listing Counts:")
        query_stats = text("""
            SELECT 
                n.id, n.name, n.city,
                COUNT(p.parcel_id) as assigned_parcels
            FROM neighborhoods n
            LEFT JOIN parcels p ON n.id = p.neighborhood_id
            WHERE n.city = 'Stamford'
            GROUP BY n.id, n.name
            ORDER BY n.name
        """)
        results = db.execute(query_stats).fetchall()
        
        print(f"{'ID':<4} | {'Name':<20} | {'Assigned Parcels'}")
        print("-" * 50)
        for r in results:
            print(f"{r[0]:<4} | {r[1]:<20} | {r[3]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_assignments()
