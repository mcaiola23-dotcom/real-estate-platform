"""Create parcels table directly with SQL."""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import engine
from sqlalchemy import text

create_sql = """
CREATE TABLE IF NOT EXISTS parcels (
    parcel_id VARCHAR(50) PRIMARY KEY,
    cama_link VARCHAR(50),
    object_id INTEGER,
    town_name VARCHAR(50) NOT NULL,
    address_full VARCHAR(255),
    address_number VARCHAR(20),
    street_name VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'CT',
    zip_code VARCHAR(10),
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    centroid GEOMETRY(POINT, 4326) NOT NULL,
    lot_size_acres NUMERIC(10, 4),
    lot_size_sqft INTEGER,
    zoning VARCHAR(50),
    land_use VARCHAR(50),
    land_use_description VARCHAR(255),
    assessment_total NUMERIC(12, 2),
    assessment_land NUMERIC(12, 2),
    assessment_building NUMERIC(12, 2),
    appraised_land NUMERIC(12, 2),
    appraised_building NUMERIC(12, 2),
    appraised_total NUMERIC(12, 2),
    tax_year INTEGER,
    year_built INTEGER,
    square_feet INTEGER,
    effective_area INTEGER,
    bedrooms INTEGER,
    bathrooms NUMERIC(3, 1),
    baths_full INTEGER,
    baths_half INTEGER,
    total_rooms INTEGER,
    property_type VARCHAR(50),
    condition VARCHAR(50),
    model VARCHAR(100),
    last_sale_price NUMERIC(12, 2),
    last_sale_date DATE,
    prior_sale_price NUMERIC(12, 2),
    prior_sale_date DATE,
    collection_year VARCHAR(4),
    fips_code VARCHAR(20),
    cog VARCHAR(50),
    shape_area NUMERIC(15, 6),
    shape_length NUMERIC(15, 6),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_parcels_city ON parcels(city);
CREATE INDEX IF NOT EXISTS idx_parcels_zip_code ON parcels(zip_code);
CREATE INDEX IF NOT EXISTS idx_parcels_zoning ON parcels(zoning);
CREATE INDEX IF NOT EXISTS idx_parcels_cama_link ON parcels(cama_link);
CREATE INDEX IF NOT EXISTS idx_parcels_geometry ON parcels USING gist(geometry);
CREATE INDEX IF NOT EXISTS idx_parcels_centroid ON parcels USING gist(centroid);
"""

with engine.connect() as conn:
    conn.execute(text(create_sql))
    conn.commit()
    print("✅ Parcels table created successfully")

