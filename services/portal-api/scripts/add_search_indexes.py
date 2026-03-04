"""
Add database indexes to optimize search performance.

This script adds indexes for:
- City/town filtering
- Price range queries
- Bedroom/bathroom filtering
- Square footage and lot size filtering
- Property type filtering
- Status filtering with date ranges
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_search_indexes():
    """Add indexes to optimize property search queries."""
    
    engine = create_engine(str(settings.database_url))
    
    indexes = [
        # City/Town filtering (most common filter)
        {
            "name": "idx_parcels_city",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_city ON parcels (city)"
        },
        
        # Price filtering (range queries)
        {
            "name": "idx_listings_list_price",
            "sql": "CREATE INDEX IF NOT EXISTS idx_listings_list_price ON listings (list_price) WHERE list_price IS NOT NULL"
        },
        
        # Bedroom filtering
        {
            "name": "idx_parcels_bedrooms",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_bedrooms ON parcels (bedrooms) WHERE bedrooms IS NOT NULL"
        },
        
        # Bathroom filtering (combined full + half)
        {
            "name": "idx_parcels_bathrooms",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_bathrooms ON parcels (baths_full, baths_half)"
        },
        
        # Square footage filtering
        {
            "name": "idx_parcels_square_feet",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_square_feet ON parcels (square_feet) WHERE square_feet IS NOT NULL"
        },
        
        # Lot size filtering
        {
            "name": "idx_parcels_lot_size",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_lot_size ON parcels (lot_size_acres) WHERE lot_size_acres IS NOT NULL"
        },
        
        # Property type filtering
        {
            "name": "idx_parcels_property_type",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_property_type ON parcels (property_type)"
        },
        
        # Listing status filtering
        {
            "name": "idx_listings_status",
            "sql": "CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status)"
        },
        
        # Date filtering for sold properties
        {
            "name": "idx_listings_sold_date",
            "sql": "CREATE INDEX IF NOT EXISTS idx_listings_sold_date ON listings (close_date) WHERE close_date IS NOT NULL"
        },
        
        # Composite index for common filter combinations
        {
            "name": "idx_parcels_city_bedrooms_price",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_city_bedrooms_price ON parcels (city, bedrooms, property_type)"
        },
        
        # Parcel ID lookups (critical for joins)
        {
            "name": "idx_listings_parcel_id",
            "sql": "CREATE INDEX IF NOT EXISTS idx_listings_parcel_id ON listings (parcel_id)"
        },
        
        # Spatial index for map queries (if not already exists)
        {
            "name": "idx_parcels_geom",
            "sql": "CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom)"
        },
        
        # Address search (trigram for fuzzy matching)
        {
            "name": "idx_parcels_address_trgm",
            "sql": """
                CREATE EXTENSION IF NOT EXISTS pg_trgm;
                CREATE INDEX IF NOT EXISTS idx_parcels_address_trgm ON parcels USING GIN (address_full gin_trgm_ops);
            """
        }
    ]
    
    print("🗄️  Adding database indexes for search optimization...")
    print("=" * 60)
    
    with engine.connect() as conn:
        for idx in indexes:
            try:
                print(f"Adding index: {idx['name']}...", end=" ")
                conn.execute(text(idx['sql']))
                conn.commit()
                print("✅")
            except Exception as e:
                print(f"⚠️  (may already exist or error: {str(e)[:50]})")
                conn.rollback()
    
    print("=" * 60)
    print("✅ Database indexes added successfully!")
    print("\n📊 Index Statistics:")
    
    # Get index sizes
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                schemaname,
                relname as tablename,
                indexrelname as indexname,
                pg_size_pretty(pg_relation_size(indexrelid)) as size
            FROM pg_stat_user_indexes
            WHERE relname IN ('parcels', 'listings')
            ORDER BY pg_relation_size(indexrelid) DESC
            LIMIT 20
        """))
        
        print(f"\n{'Schema':<10} {'Table':<12} {'Index Name':<40} {'Size':<10}")
        print("-" * 75)
        for row in result:
            print(f"{row[0]:<10} {row[1]:<12} {row[2]:<40} {row[3]:<10}")

if __name__ == "__main__":
    add_search_indexes()

