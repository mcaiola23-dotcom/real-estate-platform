"""
Add Street View cache columns to parcels table.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_street_view_columns():
    """Add Street View availability cache columns to parcels table."""
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        print("Adding Street View cache columns to parcels table...")
        
        # Check if columns already exist
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'parcels' 
            AND column_name IN ('street_view_available', 'street_view_checked_at')
        """)
        existing = conn.execute(check_query).fetchall()
        existing_cols = [row[0] for row in existing]
        
        if 'street_view_available' not in existing_cols:
            conn.execute(text("""
                ALTER TABLE parcels 
                ADD COLUMN street_view_available INTEGER DEFAULT NULL
            """))
            print("✓ Added street_view_available column")
        else:
            print("  street_view_available column already exists")
        
        if 'street_view_checked_at' not in existing_cols:
            conn.execute(text("""
                ALTER TABLE parcels 
                ADD COLUMN street_view_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
            """))
            print("✓ Added street_view_checked_at column")
        else:
            print("  street_view_checked_at column already exists")
        
        conn.commit()
        
    print("\n✅ Street View cache columns ready!")

if __name__ == "__main__":
    add_street_view_columns()

