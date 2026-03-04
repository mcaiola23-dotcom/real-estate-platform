"""
Check existing AVM model versions and when they were created
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

def check_avms():
    """Check existing AVMs."""
    db = SessionLocal()
    
    try:
        # Check model versions
        print("=" * 70)
        print("EXISTING AVM MODEL VERSIONS")
        print("=" * 70)
        
        result = db.execute(text("""
            SELECT 
                model_version, 
                COUNT(*) as count,
                MIN(created_at) as first_created,
                MAX(created_at) as last_created
            FROM avm_valuations 
            GROUP BY model_version 
            ORDER BY first_created DESC
        """))
        
        rows = result.fetchall()
        for row in rows:
            print(f"{row[0]}: {row[1]:,} AVMs")
            print(f"  Created: {row[2]} to {row[3]}")
        
        # Check if model files exist in database
        print("\n" + "=" * 70)
        print("AVM MODEL VERSIONS TABLE")
        print("=" * 70)
        
        result = db.execute(text("""
            SELECT version, model_path, is_active, training_date
            FROM avm_model_versions
            ORDER BY training_date DESC
        """))
        
        rows = result.fetchall()
        if rows:
            for row in rows:
                active = "[ACTIVE]" if row[2] else ""
                print(f"{row[0]} {active}")
                print(f"  Path: {row[1]}")
                print(f"  Trained: {row[3]}")
        else:
            print("No model versions found in database")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_avms()















