"""
AVM configuration and constants.
"""

from typing import List, Dict
from datetime import datetime

# Model configuration
MODEL_VERSION = "v20251119_market_adj"  # Use market-adjusted model
MODEL_PATH = "backend/models/avm/"

# Residential property types for AVM
RESIDENTIAL_TYPES = [
    'SingleFamily',
    'Condo',
    'Townhouse',
    'MultiFamily_2-4'
]

# Property type patterns for re-classification
PROPERTY_TYPE_PATTERNS = {
    'SingleFamily': [
        'single fam', 'single family', 'stateuse:100', 'stateuse:101', 'stateuse:1010',
        'sfr', 'single-family', 'singlefamily', 'residential'
    ],
    'Condo': [
        'condo', 'condominium', 'res. condo', 'residential condo'
    ],
    'Townhouse': [
        'townhouse', 'townhome', 'rowhouse', 'town house'
    ],
    'MultiFamily_2-4': [
        'two family', '2 family', 'stateuse:102', 'stateuse:1020',
        'three family', '3 family', 'stateuse:103', 'stateuse:1030',
        'four family', '4 family', 'stateuse:104', 'stateuse:1040',
        'duplex', 'triplex', 'quadplex'
    ]
}

# Exclude these property types
EXCLUDE_PATTERNS = [
    'commercial', 'industrial', 'office', 'retail', 'medical',
    'vacant', 'land', 'stateuse:200', 'stateuse:500',  # Removed stateuse:100 (it's residential!)
    'warehouse', 'mixed use', 'apartment'  # Large apartment complexes (5+ units)
]

# City prestige indices (based on median sale prices)
CITY_PRESTIGE_INDEX: Dict[str, float] = {
    'Darien': 1.85,
    'Greenwich': 1.75,
    'New Canaan': 1.65,
    'Westport': 1.60,
    'Weston': 1.50,
    'Wilton': 1.35,
    'Ridgefield': 1.35,
    'Fairfield': 1.20,
    'Easton': 1.15,
    'Redding': 1.15,
    'Stamford': 1.10,
    'Norwalk': 1.05,
    'Trumbull': 0.85,
    'Newtown': 0.85,
    'Shelton': 0.85,
    'Milford': 0.80,
    'Monroe': 0.75,
    'Danbury': 0.75,
    'Bridgeport': 0.65,
    'Stratford': 0.60,
}

# Luxury market cities (higher price caps for outlier detection)
LUXURY_CITIES = ['Greenwich', 'Darien', 'New Canaan', 'Westport', 'Weston']

# Price caps for outlier detection
LUXURY_MARKET_CAP = 75_000_000  # $75M for luxury cities
STANDARD_MARKET_CAP = 10_000_000  # $10M for other cities (will use IQR method)
MINIMUM_SALE_PRICE = 50_000  # $50K minimum to filter out $1 transfers

# Training data configuration
TRAINING_START_DATE = '2023-01-01'  # Use sales from 2023-2025
TRAINING_MONTHS = 24  # 24 months of sales data

# Feature engineering
FEATURE_COLUMNS = [
    # Property characteristics
    'square_feet',
    'bedrooms',
    'bathrooms',
    'baths_full',
    'baths_half',
    'year_built',
    'property_age',
    'lot_size_acres',
    'lot_size_sqft',
    'total_rooms',
    
    # Property type (encoded)
    'property_type_encoded',
    'property_type_target_encoded',
    
    # Location features (hierarchical)
    'location_median_price',
    'location_price_per_sqft',
    'location_sales_volume',
    'location_level',  # neighborhood/synthetic/zip/city
    
    # Neighborhood features (if available)
    'neighborhood_median_price',
    'neighborhood_price_per_sqft',
    'has_neighborhood',
    
    # ZIP code features (always available)
    'zip_median_price',
    'zip_price_per_sqft',
    'zip_sales_volume',
    
    # City features
    'city_median_price',
    'city_prestige_index',
    
    # Distance features
    'dist_to_train_station',
    'dist_to_water',
    'dist_to_downtown',
    'dist_to_highway',
    
    # Assessment features
    'assessment_total',
    'assessment_land',
    'assessment_building',
    'appraised_total',
    'appraised_land',
    'appraised_building',
    'assessment_to_appraisal_ratio',
    
    # Derived features
    'price_per_sqft_estimate',
    'bedroom_to_sqft_ratio',
    'land_to_building_ratio',
    'effective_age'
]

# Model hyperparameters
LIGHTGBM_PARAMS = {
    'objective': 'regression',
    'metric': 'mae',
    'boosting_type': 'gbdt',
    'n_estimators': 1000,
    'learning_rate': 0.05,
    'max_depth': 7,
    'num_leaves': 31,
    'min_child_samples': 20,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'reg_alpha': 0.1,  # L1 regularization
    'reg_lambda': 0.1,  # L2 regularization
    'random_state': 42,
    'n_jobs': -1,
    'verbose': -1
}

# Confidence scoring weights
CONFIDENCE_WEIGHTS = {
    'base': 0.60,
    'comparable_boost_max': 0.15,
    'data_completeness_boost_max': 0.15,
    'recent_sales_boost_max': 0.10,
    'outlier_penalty_max': 0.20
}

# Comparable properties configuration
COMPARABLE_CONFIG = {
    'max_distance_miles': 2.0,
    'max_sqft_diff_pct': 0.30,  # ±30%
    'max_bedroom_diff': 1,
    'max_price_diff_pct': 0.25,  # ±25%
    'max_age_months': 12,  # Sales within last 12 months
    'target_count': 6,  # Return top 6 comparables
    'max_count': 10  # Find up to 10 comparables
}

# Comparable adjustment factors
ADJUSTMENT_FACTORS = {
    'sqft_multiplier': 0.80,  # 80% of price/sqft difference
    'bedroom_value': 50_000,  # $50K per bedroom
    'bathroom_value': 25_000,  # $25K per bathroom
    'age_depreciation': 1_000  # $1K per year of age difference
}

# Historical tracking configuration
HISTORICAL_CONFIG = {
    'update_frequency_days': 30,  # Monthly AVM updates
    'retrain_frequency_months': 3,  # Quarterly model retraining
    'backfill_years': 5  # Backfill 5 years of historical values
}

# Performance targets
PERFORMANCE_TARGETS = {
    'mae_pct': 0.10,  # Mean Absolute Error < 10%
    'mape': 0.10,  # Mean Absolute Percentage Error < 10%
    'r2_score': 0.85,  # R-squared > 0.85
    'prediction_time_ms': 1000  # < 1 second per property
}


