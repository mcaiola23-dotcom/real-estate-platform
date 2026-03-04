"""
Compute AVMs for newly residential properties in Wilton, New Canaan, etc.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
import pickle
import pandas as pd
from datetime import date

# Load model
MODEL_PATH = 'backend/models/avm/avm_model_v20251119.pkl'
with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)

# Get feature columns
import json
with open('backend/models/avm/data_summary_v20251119.json', 'r') as f:
    summary = json.load(f)
feature_columns = summary['feature_columns']

engine = create_engine(settings.database_url)

print("Computing AVMs for newly residential properties...")

# Import feature engineering
from app.avm.feature_engineering import AvmFeatureEngineer

feature_engineer = AvmFeatureEngineer()
df_train, _ = feature_engineer.prepare_training_data()
print(f"Training data loaded: {len(df_train):,} records")

# Get newly residential properties without AVMs
with engine.connect() as conn:
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
        WHERE p.city IN ('Wilton', 'New Canaan')
          AND p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily')
          AND p.square_feet > 0
          AND NOT EXISTS (
              SELECT 1 FROM avm_valuations av WHERE av.parcel_id = p.parcel_id
          )
    """)
    
    parcels_df = pd.read_sql(query, conn)
    print(f"Found {len(parcels_df):,} properties to value")
    
    if len(parcels_df) == 0:
        print("No new properties to value!")
        sys.exit(0)
    
    # Extract features
    print("Extracting features...")
    df_with_features = feature_engineer.extract_all_features(parcels_df, df_train)
    
    # Make predictions
    print("Making predictions...")
    X = df_with_features[feature_columns]
    predictions = model.predict(X)
    
    # Apply market adjustment based on last sale date
    print("Applying market adjustment...")
    today = date.today()
    adjusted_predictions = []
    
    for idx, row in df_with_features.iterrows():
        base_pred = predictions[idx]
        
        # Apply appreciation based on last sale date
        if pd.notna(row.get('last_sale_date')):
            from datetime import datetime
            if isinstance(row['last_sale_date'], str):
                sale_date = datetime.strptime(row['last_sale_date'], '%Y-%m-%d').date()
            else:
                sale_date = row['last_sale_date']
            
            # Apply same boost as we did for existing AVMs
            if sale_date < datetime(2019, 1, 1).date():
                boost = 1.40
            elif sale_date < datetime(2021, 1, 1).date():
                boost = 1.30
            elif sale_date < datetime(2023, 1, 1).date():
                boost = 1.15
            else:
                boost = 1.05
        else:
            boost = 1.25
        
        adjusted_predictions.append(base_pred * boost)
    
    predictions = adjusted_predictions
    confidence_scores = [0.7] * len(predictions)
    low_estimates = [p * 0.9 for p in predictions]
    high_estimates = [p * 1.1 for p in predictions]
    
    # Save to database
    print(f"Saving {len(predictions):,} AVMs to database...")
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
            'confidence_score': float(confidence_scores[i]),
            'low_estimate': float(low_estimates[i]),
            'high_estimate': float(high_estimates[i]),
            'model_version': 'v20251119_market_adj'
        })
    
    conn.commit()
    print(f"✓ Saved {len(predictions):,} new AVMs!")
    
    # Final coverage check
    coverage = conn.execute(text("""
        SELECT 
            p.city,
            COUNT(DISTINCT p.parcel_id) as residential,
            COUNT(DISTINCT av.parcel_id) as with_avm,
            ROUND(100.0 * COUNT(DISTINCT av.parcel_id) / COUNT(DISTINCT p.parcel_id), 1) as pct
        FROM parcels p
        LEFT JOIN avm_valuations av ON p.parcel_id = av.parcel_id
        WHERE p.city IN ('Wilton', 'New Canaan')
          AND p.property_type IN ('SingleFamily', 'Condo', 'MultiFamily')
        GROUP BY p.city
    """)).fetchall()
    
    print("\nFinal Coverage:")
    for row in coverage:
        print(f"  {row[0]:15} {row[1]:6,} residential | {row[2]:6,} with AVM | {row[3]:5}% coverage")

print("\n✅ DONE! Refresh browser and test!")

