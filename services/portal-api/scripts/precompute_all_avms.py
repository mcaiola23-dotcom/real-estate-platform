"""
Pre-compute AVMs for all parcels in the database.
This makes API responses instant since values are already calculated.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime, date
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.avm.training import AvmModelTrainer
from app.avm.location_features import LocationFeatureExtractor
from app.avm.property_classifier import standardize_property_type, encode_property_type
from app.avm.config import MODEL_VERSION, FEATURE_COLUMNS, RESIDENTIAL_TYPES

def precompute_all_avms(batch_size=5000):
    """
    Pre-compute AVMs for all parcels.
    
    Args:
        batch_size: Number of parcels to process at once
    """
    
    print("\n" + "="*80)
    print("PRE-COMPUTING AVMs FOR ALL PARCELS")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    print()
    
    engine = create_engine(settings.database_url)
    
    # Load trained model
    print("Loading trained model...")
    trainer = AvmModelTrainer()
    trainer.load_model(version=MODEL_VERSION)
    print()
    
    # Get total parcel count
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM parcels"))
        total_parcels = result.scalar()
    
    print(f"Total parcels in database: {total_parcels:,}")
    print(f"Batch size: {batch_size:,}")
    print(f"Estimated batches: {(total_parcels + batch_size - 1) // batch_size}")
    print()
    
    # Load training data statistics (for location features)
    print("Loading training data for feature engineering...")
    # Need to load from database to get all fields including neighborhood_id and centroid
    query_train = """
        SELECT 
            parcel_id, neighborhood_id, city, zip_code,
            last_sale_price, square_feet,
            ST_AsText(centroid) as centroid_wkt
        FROM parcels
        WHERE last_sale_price IS NOT NULL
          AND last_sale_date >= '2023-01-01'
          AND last_sale_price >= 50000
        LIMIT 10000
    """
    df_train = pd.read_sql(query_train, engine)
    
    # Parse centroid from WKT
    from shapely.geometry import Point
    df_train['longitude'] = df_train['centroid_wkt'].apply(
        lambda x: float(x.split('(')[1].split()[0]) if x and 'POINT' in x else None
    )
    df_train['latitude'] = df_train['centroid_wkt'].apply(
        lambda x: float(x.split()[1].split(')')[0]) if x and 'POINT' in x else None
    )
    df_train['centroid'] = df_train.apply(
        lambda row: Point(row['longitude'], row['latitude']) 
        if pd.notna(row['longitude']) and pd.notna(row['latitude']) else None,
        axis=1
    )
    
    # Initialize location feature extractor with training stats
    location_extractor = LocationFeatureExtractor(engine)
    location_extractor.extract_all_stats(df_train)
    print()
    
    # Process in batches
    offset = 0
    total_processed = 0
    total_valuations_saved = 0
    total_skipped = 0
    start_time = datetime.now()
    
    while offset < total_parcels:
        batch_start = datetime.now()
        
        print(f"Processing batch {offset:,} to {min(offset + batch_size, total_parcels):,}...")
        
        # Load batch of parcels
        query = f"""
            SELECT 
                parcel_id,
                town_name,
                city,
                zip_code,
                neighborhood_id,
                ST_AsText(centroid) as centroid_wkt,
                lot_size_acres,
                lot_size_sqft,
                property_type,
                property_type_detail,
                property_subtype,
                units,
                assessment_total,
                assessment_land,
                assessment_building,
                appraised_total,
                appraised_land,
                appraised_building,
                year_built,
                square_feet,
                effective_area,
                bedrooms,
                bathrooms,
                baths_full,
                baths_half,
                total_rooms
            FROM parcels
            ORDER BY parcel_id
            LIMIT {batch_size}
            OFFSET {offset}
        """
        
        df_batch = pd.read_sql(query, engine)
        
        if len(df_batch) == 0:
            break
        
        # Extract coordinates from centroid
        df_batch['longitude'] = df_batch['centroid_wkt'].apply(
            lambda x: float(x.split('(')[1].split()[0]) if x and 'POINT' in x else None
        )
        df_batch['latitude'] = df_batch['centroid_wkt'].apply(
            lambda x: float(x.split()[1].split(')')[0]) if x and 'POINT' in x else None
        )
        
        # Create centroid objects for distance calculations
        from shapely.geometry import Point
        df_batch['centroid'] = df_batch.apply(
            lambda row: Point(row['longitude'], row['latitude']) 
            if pd.notna(row['longitude']) and pd.notna(row['latitude']) else None,
            axis=1
        )
        
        # Property type classification
        df_batch['property_type_clean'] = df_batch.apply(standardize_property_type, axis=1)
        
        # Filter to residential only
        df_residential = df_batch[df_batch['property_type_clean'].notna()].copy()
        
        if len(df_residential) == 0:
            print(f"  âš  No residential properties in this batch")
            offset += batch_size
            total_skipped += len(df_batch)
            continue
        
        # Encode property type (use medians from training)
        property_type_medians = {
            'SingleFamily': 695000,
            'Condo': 417500,
            'Townhouse': 500000,  # Default if not in training
            'MultiFamily_2-4': 538750
        }
        df_residential['property_type_encoded'] = df_residential['property_type_clean'].map({
            'SingleFamily': 1, 'Condo': 2, 'Townhouse': 3, 'MultiFamily_2-4': 4
        })
        df_residential['property_type_target_encoded'] = df_residential['property_type_clean'].map(
            property_type_medians
        )
        
        # Extract location features
        df_with_features = location_extractor.extract_features_batch(df_residential)
        
        # Create derived features
        current_year = datetime.now().year
        df_with_features['property_age'] = current_year - df_with_features['year_built'].fillna(current_year)
        df_with_features['effective_age'] = df_with_features['property_age']
        df_with_features['bedroom_to_sqft_ratio'] = df_with_features['bedrooms'] / df_with_features['square_feet'].replace(0, 1)
        df_with_features['land_to_building_ratio'] = np.where(
            (df_with_features['assessment_building'].notna()) & (df_with_features['assessment_building'] > 0),
            df_with_features['assessment_land'] / df_with_features['assessment_building'],
            1.0
        )
        df_with_features['assessment_to_appraisal_ratio'] = np.where(
            (df_with_features['appraised_total'].notna()) & (df_with_features['appraised_total'] > 0),
            df_with_features['assessment_total'] / df_with_features['appraised_total'],
            1.0
        )
        df_with_features['lot_size_sqft'] = df_with_features['lot_size_sqft'].fillna(
            df_with_features['lot_size_acres'] * 43560
        )
        df_with_features['baths_full'] = df_with_features['baths_full'].fillna(
            df_with_features['bathrooms'].apply(lambda x: int(x) if pd.notna(x) else 0)
        )
        df_with_features['baths_half'] = df_with_features['baths_half'].fillna(0)
        
        # Use appraised value as price_per_sqft_estimate for prediction
        df_with_features['price_per_sqft_estimate'] = (
            df_with_features['appraised_total'] / df_with_features['square_feet'].replace(0, 1)
        ).fillna(300)  # Default $300/sqft if missing
        
        # Ensure all features exist
        for feature in FEATURE_COLUMNS:
            if feature not in df_with_features.columns:
                df_with_features[feature] = 0
        
        # Fill missing values
        for col in FEATURE_COLUMNS:
            if df_with_features[col].dtype in [np.float64, np.int64]:
                median_val = df_with_features[col].median()
                if pd.isna(median_val):
                    median_val = 0
                df_with_features[col] = df_with_features[col].fillna(median_val)
        
        # Prepare feature matrix
        X = df_with_features[FEATURE_COLUMNS].copy()
        
        # Make predictions
        predictions = trainer.predict(X)
        
        # Calculate confidence intervals (Â±10%)
        low_estimates = predictions * 0.90
        high_estimates = predictions * 1.10
        
        # Simple confidence score (based on data completeness)
        data_completeness = X.notna().mean(axis=1)
        confidence_scores = np.clip(0.60 + (data_completeness - 0.8) * 0.5, 0.50, 0.95)
        
        # Prepare records for insertion
        today = date.today()
        valuations = []
        
        for i in range(len(df_with_features)):
            row = df_with_features.iloc[i]
            
            valuations.append({
                'parcel_id': row['parcel_id'],
                'valuation_date': today,
                'estimated_value': float(predictions[i]),
                'confidence_score': float(confidence_scores.iloc[i]),
                'low_estimate': float(low_estimates[i]),
                'high_estimate': float(high_estimates[i]),
                'model_version': MODEL_VERSION
            })
        
        # Insert into database (use ON CONFLICT to handle duplicates)
        if len(valuations) > 0:
            with engine.connect() as conn:
                # Build batch insert with ON CONFLICT
                insert_query = """
                    INSERT INTO avm_valuations (
                        parcel_id, valuation_date, estimated_value, confidence_score,
                        low_estimate, high_estimate, model_version
                    ) VALUES (
                        :parcel_id, :valuation_date, :estimated_value, :confidence_score,
                        :low_estimate, :high_estimate, :model_version
                    )
                    ON CONFLICT (parcel_id, valuation_date) 
                    DO UPDATE SET
                        estimated_value = EXCLUDED.estimated_value,
                        confidence_score = EXCLUDED.confidence_score,
                        low_estimate = EXCLUDED.low_estimate,
                        high_estimate = EXCLUDED.high_estimate,
                        model_version = EXCLUDED.model_version
                """
                
                conn.execute(text(insert_query), valuations)
                conn.commit()
            
            total_valuations_saved += len(valuations)
        
        total_processed += len(df_batch)
        total_skipped += len(df_batch) - len(df_residential)
        
        batch_duration = (datetime.now() - batch_start).total_seconds()
        elapsed = (datetime.now() - start_time).total_seconds()
        
        # Calculate progress
        progress_pct = (total_processed / total_parcels) * 100
        rate = total_processed / elapsed if elapsed > 0 else 0
        remaining = (total_parcels - total_processed) / rate if rate > 0 else 0
        
        print(f"  OK: Batch complete in {batch_duration:.1f}s")
        print(f"    Residential: {len(df_residential):,} | AVMs saved: {len(valuations):,}")
        print(f"    Progress: {total_processed:,}/{total_parcels:,} ({progress_pct:.1f}%)")
        print(f"    Rate: {rate:.0f} parcels/sec | ETA: {remaining/60:.1f} min")
        print()
        
        offset += batch_size
    
    # Final summary
    total_duration = (datetime.now() - start_time).total_seconds()
    
    print("="*80)
    print("âœ… PRE-COMPUTATION COMPLETE!")
    print("="*80)
    print()
    print(f"Total parcels processed: {total_processed:,}")
    print(f"Residential properties: {total_valuations_saved:,}")
    print(f"Non-residential (skipped): {total_skipped:,}")
    print(f"Total duration: {total_duration/60:.1f} minutes")
    print(f"Average rate: {total_processed/total_duration:.0f} parcels/second")
    print()
    
    # Verify database
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM avm_valuations"))
        avm_count = result.scalar()
        
        result = conn.execute(text("""
            SELECT 
                MIN(estimated_value) as min_val,
                MAX(estimated_value) as max_val,
                AVG(estimated_value) as avg_val,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY estimated_value) as median_val
            FROM avm_valuations
        """))
        stats = result.fetchone()
    
    print("Database Verification:")
    print(f"  Total AVMs in database: {avm_count:,}")
    print(f"  Min value: ${stats[0]:,.0f}")
    print(f"  Max value: ${stats[1]:,.0f}")
    print(f"  Average value: ${stats[2]:,.0f}")
    print(f"  Median value: ${stats[3]:,.0f}")
    print()
    
    print("="*80)
    print()


if __name__ == "__main__":
    try:
        precompute_all_avms(batch_size=5000)
        sys.exit(0)
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


