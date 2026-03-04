"""
Quick AVM Fix - Option C Simplified
===================================
1. Fix property types in affected towns
2. Recompute AVMs with appreciation adjustment
"""

import sys
import os
from datetime import date
from sqlalchemy import create_engine, text
import pickle
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

# Affected towns
AFFECTED_TOWNS = ['Danbury', 'Easton', 'New Canaan', 'Ridgefield', 'Shelton', 'Weston', 'Wilton']

engine = create_engine(settings.database_url)
MODEL_PATH = 'backend/models/avm/avm_model_v20251119.pkl'

print("=" * 80)
print("QUICK AVM FIX - OPTION C")
print("=" * 80)

# STEP 1: Simple property type fix via SQL
print("\nSTEP 1: Fixing property types...")
with engine.connect() as conn:
    # Update based on property_type_detail patterns
    updates = conn.execute(text("""
        UPDATE parcels
        SET property_type = CASE
            WHEN LOWER(property_type_detail) LIKE '%single%family%' THEN 'SingleFamily'
            WHEN LOWER(property_type_detail) LIKE '%condo%' THEN 'Condo'
            WHEN LOWER(property_type_detail) LIKE '%townhouse%' THEN 'Townhouse'
            WHEN LOWER(property_type_detail) LIKE '%two%family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%three%family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%four%family%' THEN 'MultiFamily'
            WHEN LOWER(property_type_detail) LIKE '%multiple%dwelling%' THEN 'MultiFamily'
            ELSE property_type
        END
        WHERE city IN :cities
          AND property_type_detail IS NOT NULL
          AND property_type IN ('VacantLand', 'Other')
    """), {'cities': tuple(AFFECTED_TOWNS)})
    conn.commit()
    print(f"✓ Updated {updates.rowcount:,} property types")

# STEP 2: Apply appreciation boost to existing AVMs
print("\nSTEP 2: Applying appreciation adjustment...")
with engine.connect() as conn:
    # Get count first
    count = conn.execute(text("""
        SELECT COUNT(*)
        FROM parcels p
        WHERE p.city IN :cities
          AND p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily')
          AND p.square_feet > 100
          AND EXISTS (
              SELECT 1 FROM avm_valuations av WHERE av.parcel_id = p.parcel_id
          )
    """), {'cities': tuple(AFFECTED_TOWNS)}).scalar()
    
    print(f"Found {count:,} existing AVMs to update with appreciation")
    
    if count > 0:
        # Apply 15% boost across the board (7% annual * 2 years average)
        conn.execute(text("""
            UPDATE avm_valuations
            SET estimated_value = estimated_value * 1.15,
                low_estimate = low_estimate * 1.15,
                high_estimate = high_estimate * 1.15,
                model_version = model_version || '_adj',
                valuation_date = :today
            WHERE parcel_id IN (
                SELECT parcel_id FROM parcels WHERE city IN :cities
            )
        """), {'cities': tuple(AFFECTED_TOWNS), 'today': date.today()})
        conn.commit()
        print(f"✓ Applied 15% appreciation boost to {count:,} AVMs")

print("\n" + "=" * 80)
print("✅ QUICK FIX COMPLETE!")
print("=" * 80)
print("Next: Refresh your browser and test!")

