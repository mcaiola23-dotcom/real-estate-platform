"""
Complete feature engineering pipeline for AVM model.
Combines property classification, location features, and derived features.
"""

from typing import Dict, List, Tuple
import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy import create_engine

from ..core.config import settings
from .config import (
    TRAINING_START_DATE, MINIMUM_SALE_PRICE, LUXURY_CITIES,
    LUXURY_MARKET_CAP, FEATURE_COLUMNS
)
from .property_classifier import classify_dataframe, encode_property_type
from .location_features import LocationFeatureExtractor


class AvmFeatureEngineer:
    """Complete feature engineering pipeline for AVM."""
    
    def __init__(self, engine=None):
        """Initialize with database connection."""
        self.engine = engine or create_engine(settings.database_url)
        self.location_extractor = LocationFeatureExtractor(self.engine)
    
    def load_training_data(self) -> pd.DataFrame:
        """
        Load recent sales data from database for model training.
        
        Returns:
            DataFrame with recent residential sales
        """
        print("="*80)
        print("LOADING TRAINING DATA")
        print("="*80)
        
        query = f"""
            SELECT 
                parcel_id,
                cama_link,
                town_name,
                address_full,
                city,
                zip_code,
                neighborhood_id,
                ST_AsText(centroid) as centroid_wkt,
                lot_size_acres,
                lot_size_sqft,
                zoning,
                land_use,
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
                total_rooms,
                condition,
                last_sale_price,
                last_sale_date
            FROM parcels
            WHERE last_sale_price IS NOT NULL
              AND last_sale_date >= '{TRAINING_START_DATE}'
              AND last_sale_price >= {MINIMUM_SALE_PRICE}
            ORDER BY last_sale_date DESC
        """
        
        print(f"Querying sales since {TRAINING_START_DATE}...")
        df = pd.read_sql(query, self.engine)
        
        # Convert centroid WKT to coordinates
        df['longitude'] = df['centroid_wkt'].apply(
            lambda x: float(x.split('(')[1].split()[0]) if x and 'POINT' in x else None
        )
        df['latitude'] = df['centroid_wkt'].apply(
            lambda x: float(x.split()[1].split(')')[0]) if x and 'POINT' in x else None
        )
        
        # Create a proper centroid object for distance calculations
        from shapely.geometry import Point
        df['centroid'] = df.apply(
            lambda row: Point(row['longitude'], row['latitude']) 
            if pd.notna(row['longitude']) and pd.notna(row['latitude']) else None,
            axis=1
        )
        
        print(f"OK: Loaded {len(df):,} sales records")
        print(f"  Date range: {df['last_sale_date'].min()} to {df['last_sale_date'].max()}")
        print(f"  Price range: ${df['last_sale_price'].min():,.0f} to ${df['last_sale_price'].max():,.0f}")
        print(f"  Median price: ${df['last_sale_price'].median():,.0f}")
        print()
        
        return df
    
    def clean_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove outliers and data quality issues.
        
        Args:
            df: Raw training data
        
        Returns:
            Cleaned DataFrame
        """
        print("CLEANING OUTLIERS")
        print("-"*80)
        
        initial_count = len(df)
        
        # Separate luxury markets from standard markets
        df_luxury = df[df['city'].isin(LUXURY_CITIES)].copy()
        df_standard = df[~df['city'].isin(LUXURY_CITIES)].copy()
        
        # Luxury markets: cap at $75M
        df_luxury = df_luxury[df_luxury['last_sale_price'] <= LUXURY_MARKET_CAP]
        luxury_removed = len(df[df['city'].isin(LUXURY_CITIES)]) - len(df_luxury)
        
        # Standard markets: use IQR method
        Q1 = df_standard['last_sale_price'].quantile(0.25)
        Q3 = df_standard['last_sale_price'].quantile(0.75)
        IQR = Q3 - Q1
        upper_bound = Q3 + 3 * IQR  # 3x IQR (keeps more data than 1.5x)
        
        df_standard = df_standard[df_standard['last_sale_price'] <= upper_bound]
        standard_removed = len(df[~df['city'].isin(LUXURY_CITIES)]) - len(df_standard)
        
        # Combine back
        df_clean = pd.concat([df_luxury, df_standard])
        
        # Remove properties with missing critical features
        df_clean = df_clean[df_clean['square_feet'].notna() & (df_clean['square_feet'] > 0)]
        df_clean = df_clean[df_clean['bedrooms'].notna()]
        df_clean = df_clean[df_clean['bathrooms'].notna()]
        df_clean = df_clean[df_clean['year_built'].notna()]
        df_clean = df_clean[df_clean['zip_code'].notna()]
        
        final_count = len(df_clean)
        removed_count = initial_count - final_count
        
        print(f"  Initial records: {initial_count:,}")
        print(f"  Outliers removed:")
        print(f"    Luxury markets (>${LUXURY_MARKET_CAP/1e6:.0f}M): {luxury_removed}")
        print(f"    Standard markets (IQR method): {standard_removed}")
        print(f"    Missing critical features: {removed_count - luxury_removed - standard_removed}")
        print(f"  OK: Clean records: {final_count:,} ({final_count/initial_count*100:.1f}% retained)")
        print()
        
        return df_clean
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Complete feature engineering pipeline.
        
        Args:
            df: Cleaned training data
        
        Returns:
            DataFrame with all engineered features
        """
        print("="*80)
        print("FEATURE ENGINEERING PIPELINE")
        print("="*80)
        print()
        
        # Step 1: Property type classification
        print("STEP 1: Property Type Classification")
        print("-"*80)
        df_residential = classify_dataframe(df)
        df_residential = encode_property_type(df_residential)
        print()
        
        # Step 2: Location features (hierarchical)
        print("STEP 2: Location Feature Extraction")
        print("-"*80)
        self.location_extractor.extract_all_stats(df_residential)
        df_with_location = self.location_extractor.extract_features_batch(df_residential)
        print()
        
        # Step 3: Derived features
        print("STEP 3: Derived Features")
        print("-"*80)
        df_final = self._create_derived_features(df_with_location)
        print()
        
        # Step 4: Final feature selection and cleaning
        print("STEP 4: Final Feature Selection")
        print("-"*80)
        df_final = self._select_features(df_final)
        print()
        
        return df_final
    
    def _create_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create derived features from raw data."""
        
        # Property age
        current_year = datetime.now().year
        df['property_age'] = current_year - df['year_built']
        df['effective_age'] = df['property_age']  # Can be adjusted for renovations later
        
        # Price per square foot (estimate from assessment if no sale)
        df['price_per_sqft_estimate'] = df['last_sale_price'] / df['square_feet']
        
        # Ratios
        df['bedroom_to_sqft_ratio'] = df['bedrooms'] / df['square_feet']
        
        # Land to building ratio
        df['land_to_building_ratio'] = np.where(
            (df['assessment_building'].notna()) & (df['assessment_building'] > 0),
            df['assessment_land'] / df['assessment_building'],
            1.0
        )
        
        # Assessment to appraisal ratio
        df['assessment_to_appraisal_ratio'] = np.where(
            (df['appraised_total'].notna()) & (df['appraised_total'] > 0),
            df['assessment_total'] / df['appraised_total'],
            1.0
        )
        
        # Convert lot size to sqft if only acres available
        df['lot_size_sqft'] = df['lot_size_sqft'].fillna(df['lot_size_acres'] * 43560)
        
        # Fill missing baths_full/half with estimates
        df['baths_full'] = df['baths_full'].fillna(df['bathrooms'].apply(lambda x: int(x) if pd.notna(x) else 0))
        df['baths_half'] = df['baths_half'].fillna(
            df.apply(lambda row: 1 if pd.notna(row['bathrooms']) and (row['bathrooms'] % 1 == 0.5) else 0, axis=1)
        )
        
        print(f"  OK: Created derived features:")
        print(f"    - property_age, effective_age")
        print(f"    - price_per_sqft_estimate")
        print(f"    - bedroom_to_sqft_ratio")
        print(f"    - land_to_building_ratio")
        print(f"    - assessment_to_appraisal_ratio")
        
        return df
    
    def _select_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Select and clean final feature set for model training."""
        
        # Ensure all required features exist
        available_features = [col for col in FEATURE_COLUMNS if col in df.columns]
        missing_features = [col for col in FEATURE_COLUMNS if col not in df.columns]
        
        if missing_features:
            print(f"  âš  Missing features (will use defaults): {', '.join(missing_features)}")
            for feature in missing_features:
                df[feature] = 0
        
        # Select feature columns + target + identifiers
        selected_columns = ['parcel_id', 'city', 'property_type_clean', 'last_sale_price', 'last_sale_date'] + FEATURE_COLUMNS
        selected_columns = [col for col in selected_columns if col in df.columns]
        
        df_final = df[selected_columns].copy()
        
        # Fill any remaining NaN values
        for col in FEATURE_COLUMNS:
            if col in df_final.columns and df_final[col].dtype in [np.float64, np.int64]:
                median_val = df_final[col].median()
                if pd.isna(median_val):
                    median_val = 0
                df_final[col] = df_final[col].fillna(median_val)
        
        print(f"  OK: Final dataset: {len(df_final):,} records")
        print(f"  OK: Features: {len([col for col in df_final.columns if col in FEATURE_COLUMNS])}")
        print(f"  OK: Target: last_sale_price")
        
        # Data quality summary
        completeness = (df_final[FEATURE_COLUMNS].notna().sum() / len(df_final) * 100).mean()
        print(f"  OK: Average feature completeness: {completeness:.1f}%")
        
        return df_final
    
    def prepare_training_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Complete pipeline: load, clean, engineer, and split data.
        
        Returns:
            X_train, X_test, y_train, y_test
        """
        # Load data
        df_raw = self.load_training_data()
        
        # Clean outliers
        df_clean = self.clean_outliers(df_raw)
        
        # Engineer features
        df_final = self.engineer_features(df_clean)
        
        # Train-test split (time-based)
        print("="*80)
        print("TRAIN-TEST SPLIT")
        print("="*80)
        
        # Use last 20% of data (by date) for testing
        cutoff_date = df_final['last_sale_date'].quantile(0.80)
        
        df_train = df_final[df_final['last_sale_date'] < cutoff_date]
        df_test = df_final[df_final['last_sale_date'] >= cutoff_date]
        
        X_train = df_train[FEATURE_COLUMNS]
        y_train = df_train['last_sale_price']
        X_test = df_test[FEATURE_COLUMNS]
        y_test = df_test['last_sale_price']
        
        print(f"  Training set: {len(df_train):,} properties (before {cutoff_date})")
        print(f"    Median price: ${y_train.median():,.0f}")
        print(f"  Test set: {len(df_test):,} properties (from {cutoff_date} onwards)")
        print(f"    Median price: ${y_test.median():,.0f}")
        print()
        
        print("âœ… Training data preparation complete!")
        print("="*80)
        print()
        
        return X_train, X_test, y_train, y_test, df_train, df_test


