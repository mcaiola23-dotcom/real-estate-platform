
import os
import sys
from sqlalchemy import create_engine, text

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'app'))
sys.path.append(os.getcwd())

from app.core.config import settings

def migrate_db():
    print(f"Connecting to database...")
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        try:
            print("Adding street_view_pano_id column to parcels table...")
            conn.execute(text("ALTER TABLE parcels ADD COLUMN IF NOT EXISTS street_view_pano_id VARCHAR(100);"))
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    migrate_db()
