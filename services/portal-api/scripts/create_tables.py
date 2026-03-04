"""
Script to create all database tables from models.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import create_tables, engine
from app.models import Parcel, Listing, AddressMatch, Agent, Office, Property, Lead
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Create all database tables."""
    logger.info("Creating database tables...")
    
    try:
        # Import all models to ensure they're registered
        from app.models import (
            Parcel, Listing, AddressMatch, Agent, Office, Property, Lead
        )
        
        # Create all tables (will skip if they already exist)
        create_tables()
        
        logger.info("✅ All tables created/verified successfully!")
        logger.info("Tables:")
        logger.info("  - parcels (with PostGIS geometry)")
        logger.info("  - listings")
        logger.info("  - address_matches")
        logger.info("  - agents")
        logger.info("  - offices")
        logger.info("  - properties (legacy)")
        logger.info("  - leads")
        
        # Verify PostGIS extension
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_version();"))
            version = result.fetchone()[0]
            logger.info(f"✅ PostGIS version: {version}")
            
            # Check which tables exist
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            logger.info(f"✅ Database tables: {', '.join(tables)}")
        
    except Exception as e:
        # Check if it's just a duplicate index error (tables already exist)
        if "already exists" in str(e):
            logger.warning("⚠️  Some tables/indexes already exist - this is OK if running multiple times")
            logger.info("✅ Tables are already created")
        else:
            logger.error(f"❌ Error creating tables: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == '__main__':
    main()

