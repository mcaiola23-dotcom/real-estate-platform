"""
OPTION C: Hybrid AVM Fix
========================
1. Reclas

sify properties using property_type_detail
2. Add time-based appreciation adjustment
3. Re-compute AVMs for affected towns
"""

import sys
import os
from datetime import date, datetime
from sqlalchemy import create_engine, text
import pickle
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.avm.property_classifier import PropertyClassifier
from app.avm.feature_engineering import AvmFeatureEngineer

# Towns to fix (based on analysis)
AFFECTED_TOWNS = [
    'Danbury', 'Easton', 'New Canaan', 'Ridgefield', 'Shelton',
    'Weston', 'Wilton', 'Westport', 'Brookfield', 'Darien',
    'Monroe', 'Redding', 'Trumbull'
]

MODEL_PATH = 'backend/models/avm/avm_model_v20251119.pkl'
MODEL_VERSION = 'v20251119'

print("=" * 80)
print("OPTION C: HYBRID AVM FIX")
print("=" * 80)
print(f"Affected towns: {', '.join(AFFECTED_TOWNS)}")
print()

engine = create_engine(settings.database_url)

# STEP 1: Fix property types using property_type_detail
print("STEP 1: Reclassifying properties...")
print("-" * 80)

classifier = PropertyClassifier()

with engine.connect() as conn:
    # Get all properties in affected towns
    properties = conn.execute(text("""
        SELECT parcel_id, property_type, property_type_detail
        FROM parcels
        WHERE city IN :cities
          AND property_type_detail IS NOT NULL
          AND property_type_detail != ''
    """), {'cities': tuple(AFFECTED_TOWNS)}).fetchall()
    
    print(f"Found {len(properties):,} properties to reclassify")
    
    reclassified = 0
    now_residential = 0
    
    for parcel_id, old_type, detail in properties:
        new_type = classifier.classify_property_type(old_type, detail)
        
        if new_type != old_type:
            conn.execute(text("""
                UPDATE parcels
                SET property_type = :new_type
                WHERE parcel_id = :parcel_id
            """), {'new_type': new_type, 'parcel_id': parcel_id})
            conn.commit()
            reclassified += 1
            
            if new_type in ('SingleFamily', 'Condo', 'MultiFamily'):
                now_residential += 1
    
    print(f"✓ Reclassified {reclassified:,} properties")
    print(f"✓ {now_residential:,} are now residential (eligible for AVM)")

# STEP 2: Load model and feature engineer
print("\nSTEP 2: Loading model and preparing feature engineering...")
print("-" * 80)

with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)
print(f"✓ Model loaded: {MODEL_PATH}")

# Load training data for location feature extraction
feature_engineer = AvmFeatureEngineer()
df_train, df_test = feature_engineer.prepare_training_data()
print(f"✓ Training data loaded: {len(df_train):,} records")

# STEP 3: Recompute AVMs for affected towns
print("\nSTEP 3: Recomputing AVMs with appreciation adjustment...")
print("-" * 80)

with engine.connect() as conn:
    # Get all residential properties in affected towns
    query = text("""
        SELECT 
            p.parcel_id,
            p.property_type,
            p.property_type_detail,
            p.square_feet,
            p.bedrooms,
            p.bathrooms,
            p.year_built,
            p.lot_size_acres,
            p.last_sale_price,
            p.last_sale_date,
            p.assessment_total,
            p.appraised_total,
            p.city,
            p.zip_code,
            p.neighborhood_id,
            ST_X(p.centroid::geometry) as longitude,
            ST_Y(p.centroid::geometry) as latitude
        FROM parcels p
        WHERE p.city IN :cities
          AND p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily')
          AND p.square_feet > 0
    """)
    
    parcels_df = pd.read_sql(query, conn, params={'cities': tuple(AFFECTED_TOWNS)})
    print(f"Found {len(parcels_df):,} residential properties to value")
    
    if len(parcels_df) == 0:
        print("No properties to value!")
        sys.exit(0)
    
    # Apply feature engineering
    print("Extracting features...")
    df_with_features = feature_engineer.extract_all_features(parcels_df, df_train)
    
    # Make predictions
    print("Making predictions...")
    X = df_with_features[feature_engineer.feature_columns]
    predictions = model.predict(X)
    
    # Calculate confidence scores (70% for all - simplified)
    confidence_scores = pd.Series([0.7] * len(predictions))
    low_estimates = predictions * 0.9
    high_estimates = predictions * 1.1
    
    # STEP 4: Apply appreciation adjustment for old sales
    print("\nSTEP 4: Applying appreciation adjustment...")
    print("-" * 80)
    
    today = date.today()
    appreciation_rate = 0.07  # 7% annual appreciation (between 5-10%)
    
    adjusted_predictions = []
    adjustments_made = 0
    
    for idx, row in df_with_features.iterrows():
        base_prediction = predictions[idx]
        
        # If property has a last sale date, calculate time-based appreciation
        if pd.notna(row.get('last_sale_date')):
            try:
                if isinstance(row['last_sale_date'], str):
                    sale_date = datetime.strptime(row['last_sale_date'], '%Y-%m-%d').date()
                else:
                    sale_date = row['last_sale_date']
                
                years_since_sale = (today - sale_date).days / 365.25
                
                # Only adjust if sale was more than 1 year ago
                if years_since_sale > 1:
                    appreciation_multiplier = (1 + appreciation_rate) ** years_since_sale
                    adjusted_prediction = base_prediction * appreciation_multiplier
                    adjusted_predictions.append(adjusted_prediction)
                    adjustments_made += 1
                else:
                    adjusted_predictions.append(base_prediction)
            except:
                adjusted_predictions.append(base_prediction)
        else:
            # No sale data - apply modest 2-year appreciation
            appreciation_multiplier = (1 + appreciation_rate) ** 2
            adjusted_prediction = base_prediction * appreciation_multiplier
            adjusted_predictions.append(adjusted_prediction)
            adjustments_made += 1
    
    predictions = np.array(adjusted_predictions)
    low_estimates = predictions * 0.9
    high_estimates = predictions * 1.1
    
    print(f"✓ Applied appreciation adjustment to {adjustments_made:,} properties")
    print(f"  Using {appreciation_rate*100:.1f}% annual appreciation rate")
    
    # STEP 5: Save to database
    print("\nSTEP 5: Saving to database...")
    print("-" * 80)
    
    # Delete old AVMs for these towns
    conn.execute(text("""
        DELETE FROM avm_valuations
        WHERE parcel_id IN (
            SELECT parcel_id FROM parcels WHERE city IN :cities
        )
    """), {'cities': tuple(AFFECTED_TOWNS)})
    conn.commit()
    
    # Insert new AVMs
    today = date.today()
    for i in range(len(df_with_features)):
        row = df_with_features.iloc[i]
        
        conn.execute(text("""
            INSERT INTO avm_valuations 
            (parcel_id, valuation_date, estimated_value, confidence_score, low_estimate, high_estimate, model_version)
            VALUES (:parcel_id, :valuation_date, :estimated_value, :confidence_score, :low_estimate, :high_estimate, :model_version)
        """), {
            'parcel_id': row['parcel_id'],
            'valuation_date': today,
            'estimated_value': float(predictions[i]),
            'confidence_score': float(confidence_scores.iloc[i]),
            'low_estimate': float(low_estimates[i]),
            'high_estimate': float(high_estimates[i]),
            'model_version': MODEL_VERSION + '_adjusted'
        })
    
    conn.commit()
    print(f"✓ Saved {len(df_with_features):,} new AVMs")

print("\n" + "=" * 80)
print("✅ OPTION C FIX COMPLETE!")
print("=" * 80)
print(f"Summary:")
print(f"  - Reclassified properties: {reclassified:,}")
print(f"  - New residential properties: {now_residential:,}")
print(f"  - AVMs computed: {len(df_with_features):,}")
print(f"  - Appreciation adjustments applied: {adjustments_made:,}")
print()
print("Next: Test in app to verify improvements!")

