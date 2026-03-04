"""
Property type standardization and classification for AVM.
Handles inconsistencies across towns and data sources.
"""

from typing import Optional
import pandas as pd
from .config import PROPERTY_TYPE_PATTERNS, EXCLUDE_PATTERNS, RESIDENTIAL_TYPES


def standardize_property_type(row: pd.Series) -> Optional[str]:
    """
    Dynamically re-classify properties based on property_type_detail.
    
    Args:
        row: Pandas Series with columns:
            - property_type: Current classification
            - property_type_detail: Raw classification from GIS
            - units: Number of units (for multi-family)
    
    Returns:
        str: Standardized property type ('SingleFamily', 'Condo', 'Townhouse', 'MultiFamily_2-4')
        None: Property should be excluded (commercial, land, etc.)
    """
    # Extract fields (handle missing data)
    detail = str(row.get('property_type_detail', '')).lower()
    prop_type = str(row.get('property_type', '')).lower()
    units = row.get('units', 1)
    
    # STEP 1: Exclude non-residential properties
    for exclude_pattern in EXCLUDE_PATTERNS:
        if exclude_pattern in detail or exclude_pattern in prop_type:
            return None
    
    # STEP 2: Classify based on property_type_detail patterns
    
    # Single Family
    for pattern in PROPERTY_TYPE_PATTERNS['SingleFamily']:
        if pattern in detail:
            return 'SingleFamily'
    
    # Condo
    for pattern in PROPERTY_TYPE_PATTERNS['Condo']:
        if pattern in detail:
            return 'Condo'
    
    # Townhouse
    for pattern in PROPERTY_TYPE_PATTERNS['Townhouse']:
        if pattern in detail:
            return 'Townhouse'
    
    # Multi-family (2-4 units)
    for pattern in PROPERTY_TYPE_PATTERNS['MultiFamily_2-4']:
        if pattern in detail:
            return 'MultiFamily_2-4'
    
    # STEP 3: Use units column if available
    if pd.notna(units):
        if units >= 2 and units <= 4:
            return 'MultiFamily_2-4'
        elif units >= 5:
            # Large multi-family (5+ units) = commercial investment property
            return None
    
    # STEP 4: Check "multiple dwelling" patterns
    if 'multi' in detail or 'multiple dwelling' in detail:
        if units and units <= 4:
            return 'MultiFamily_2-4'
        else:
            # Unknown unit count or 5+ units - exclude
            return None
    
    # STEP 5: Fallback to original property_type (cleaned)
    prop_type_clean = prop_type.replace(' ', '').replace('-', '').replace('_', '')
    
    if 'singlefamily' in prop_type_clean or prop_type == 'residential':
        return 'SingleFamily'
    elif 'condo' in prop_type_clean:
        return 'Condo'
    elif 'townhouse' in prop_type_clean:
        return 'Townhouse'
    elif 'multifamily' in prop_type_clean:
        # Check units to ensure 2-4 only
        if units and units <= 4:
            return 'MultiFamily_2-4'
        else:
            return None
    
    # STEP 6: Unclassifiable - exclude to maintain data quality
    return None


def classify_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply property type standardization to entire dataframe.
    
    Args:
        df: DataFrame with property data
    
    Returns:
        DataFrame: Filtered to residential properties only with 'property_type_clean' column
    """
    # Apply standardization
    df['property_type_clean'] = df.apply(standardize_property_type, axis=1)
    
    # Filter to residential only
    df_residential = df[df['property_type_clean'].notna()].copy()
    
    # Log classification results
    total = len(df)
    residential = len(df_residential)
    excluded = total - residential
    
    print(f"Property Classification Results:")
    print(f"  Total Properties: {total:,}")
    print(f"  Residential (kept): {residential:,} ({residential/total*100:.1f}%)")
    print(f"  Excluded: {excluded:,} ({excluded/total*100:.1f}%)")
    print(f"\nBreakdown by Type:")
    
    type_counts = df_residential['property_type_clean'].value_counts()
    for prop_type, count in type_counts.items():
        print(f"  {prop_type}: {count:,} ({count/residential*100:.1f}%)")
    
    return df_residential


def encode_property_type(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode property type as features for ML model.
    
    Uses target encoding (median price per property type) which works better
    than one-hot encoding for categories with limited data (like Condo with 53 sales).
    
    Args:
        df: DataFrame with 'property_type_clean' and 'last_sale_price' columns
    
    Returns:
        DataFrame: With added 'property_type_encoded' and 'property_type_target_encoded' columns
    """
    # Label encoding (for tree-based models)
    property_type_map = {
        'SingleFamily': 1,
        'Condo': 2,
        'Townhouse': 3,
        'MultiFamily_2-4': 4
    }
    df['property_type_encoded'] = df['property_type_clean'].map(property_type_map)
    
    # Target encoding (median price per property type)
    property_type_medians = df.groupby('property_type_clean')['last_sale_price'].median()
    df['property_type_target_encoded'] = df['property_type_clean'].map(property_type_medians)
    
    print(f"\nProperty Type Target Encoding (Median Prices):")
    for prop_type, median in property_type_medians.items():
        print(f"  {prop_type}: ${median:,.0f}")
    
    return df


