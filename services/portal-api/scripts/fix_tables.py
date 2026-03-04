"""Fix table creation - drop indexes if needed and recreate tables."""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import engine
from sqlalchemy import text
from app.models import Parcel, Listing, AddressMatch, Agent, Office

# Drop indexes if they exist
with engine.connect() as conn:
    conn.execute(text("DROP INDEX IF EXISTS idx_parcels_geometry;"))
    conn.execute(text("DROP INDEX IF EXISTS idx_parcels_centroid;"))
    conn.execute(text("DROP INDEX IF EXISTS idx_listings_location;"))
    conn.execute(text("DROP INDEX IF EXISTS idx_address_matches_confidence;"))
    conn.execute(text("DROP INDEX IF EXISTS idx_address_matches_unique;"))
    conn.commit()

# Create tables
from app.db import create_tables
create_tables()
print("✅ Tables created successfully")

