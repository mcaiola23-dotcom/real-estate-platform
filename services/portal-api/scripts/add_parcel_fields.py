"""
Script to add new fields to parcels table: property_type_detail and units.
Run this before re-importing data to ensure schema is up to date.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import engine
from sqlalchemy import text

def add_new_fields():
    """Add property_type_detail and units columns to parcels table."""
    with engine.connect() as conn:
        try:
            # Add property_subtype column
            conn.execute(text("""
                ALTER TABLE parcels 
                ADD COLUMN IF NOT EXISTS property_subtype VARCHAR(50);
            """))
            
            # Add property_type_detail column
            conn.execute(text("""
                ALTER TABLE parcels 
                ADD COLUMN IF NOT EXISTS property_type_detail VARCHAR(100);
            """))
            
            # Add units column
            conn.execute(text("""
                ALTER TABLE parcels 
                ADD COLUMN IF NOT EXISTS units INTEGER;
            """))
            
            # Update property_type index if needed (should already exist)
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_parcels_property_type 
                ON parcels(property_type);
            """))
            
            # Add property_subtype index
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_parcels_property_subtype 
                ON parcels(property_subtype);
            """))
            
            conn.commit()
            print("✅ Successfully added property_subtype, property_type_detail, and units columns")
            print("✅ Added property_type and property_subtype indexes")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error adding columns: {e}")
            raise

if __name__ == '__main__':
    add_new_fields()

