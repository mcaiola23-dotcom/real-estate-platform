import sys
import os
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import get_db

def check_boundary():
    db = next(get_db())
    try:
        print("\nChecking Neighborhood 70 Boundary...")
        query = text("SELECT id, name, city, (boundary IS NULL) as is_null, ST_IsValid(boundary) as is_valid FROM neighborhoods WHERE id = 70")
        row = db.execute(query).fetchone()
        if row:
            print(f"ID: {row[0]}")
            print(f"Name: {row[1]}")
            print(f"City: {row[2]}")
            print(f"Is Null: {row[3]}")
            print(f"Is Valid: {row[4]}")
        else:
            print("Neighborhood 70 not found")
            
        print("\nChecking for any NULL boundaries...")
        query_all = text("SELECT count(*) FROM neighborhoods WHERE boundary IS NULL")
        count = db.execute(query_all).scalar()
        print(f"Count of neighborhoods with NULL boundary: {count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_boundary()
