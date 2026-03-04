"""
Hierarchical location feature extraction for AVM.
Handles properties with and without formal neighborhood designations.
"""

from typing import Dict, Optional, Tuple
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from geoalchemy2 import Geometry
from shapely.geometry import Point
from sklearn.cluster import KMeans
from datetime import datetime, timedelta

from ..core.config import settings
from .config import CITY_PRESTIGE_INDEX


class LocationFeatureExtractor:
    """Extract hierarchical location features for AVM model."""
    
    def __init__(self, engine=None):
        """Initialize with database connection."""
        self.engine = engine or create_engine(settings.database_url)
        self.neighborhood_stats = None
        self.synthetic_neighborhood_stats = None
        self.zip_stats = None
        self.city_stats = None
        self.train_station_coords = None
        
    def extract_all_stats(self, df: pd.DataFrame) -> None:
        """
        Pre-compute all location statistics from training data.
        
        Args:
            df: Training DataFrame with recent sales
        """
        print("Extracting location features...")
        
        # 1. Neighborhood statistics (for properties with neighborhood_id)
        self._compute_neighborhood_stats(df)
        
        # 2. Create synthetic neighborhoods (for properties without neighborhood_id)
        self._create_synthetic_neighborhoods(df)
        
        # 3. ZIP code statistics (100% coverage)
        self._compute_zip_stats(df)
        
        # 4. City statistics (100% coverage)
        self._compute_city_stats(df)
        
        # 5. Load train station coordinates
        self._load_train_stations()
        
    def _compute_neighborhood_stats(self, df: pd.DataFrame) -> None:
        """Compute statistics for real neighborhoods."""
        df_with_neighborhood = df[df['neighborhood_id'].notna()].copy()
        
        if len(df_with_neighborhood) > 0:
            self.neighborhood_stats = df_with_neighborhood.groupby('neighborhood_id').agg({
                'last_sale_price': ['median', 'mean', 'std', 'count'],
                'square_feet': 'median'
            }).reset_index()
            
            self.neighborhood_stats.columns = ['neighborhood_id', 'median_price', 'mean_price', 
                                              'std_price', 'sales_count', 'median_sqft']
            
            self.neighborhood_stats['price_per_sqft'] = (
                self.neighborhood_stats['median_price'] / self.neighborhood_stats['median_sqft']
            )
            
            print(f"  OK: Neighborhood stats: {len(self.neighborhood_stats)} neighborhoods")
        else:
            self.neighborhood_stats = pd.DataFrame()
            print(f"  âš  No neighborhood data available")
    
    def _create_synthetic_neighborhoods(self, df: pd.DataFrame) -> None:
        """
        Create synthetic neighborhoods using K-means clustering for properties
        without formal neighborhood assignments.
        """
        df_no_neighborhood = df[df['neighborhood_id'].isna()].copy()
        
        if len(df_no_neighborhood) < 50:
            print(f"  âš  Insufficient data for synthetic neighborhoods ({len(df_no_neighborhood)} properties)")
            self.synthetic_neighborhood_stats = pd.DataFrame()
            return
        
        # Extract coordinates from centroid
        df_no_neighborhood['longitude'] = df_no_neighborhood['centroid'].apply(
            lambda geom: geom.coords[0][0] if geom else None
        )
        df_no_neighborhood['latitude'] = df_no_neighborhood['centroid'].apply(
            lambda geom: geom.coords[0][1] if geom else None
        )
        
        # Remove rows with missing coordinates
        df_no_neighborhood = df_no_neighborhood.dropna(subset=['longitude', 'latitude'])
        
        # City encoding for weighted clustering (avoid cross-city clusters)
        city_encoder = {city: idx for idx, city in enumerate(df_no_neighborhood['city'].unique())}
        df_no_neighborhood['city_encoded'] = df_no_neighborhood['city'].map(city_encoder)
        
        # K-means clustering (number of clusters based on data size)
        n_clusters = min(50, max(10, len(df_no_neighborhood) // 200))
        
        # Weight coordinates more heavily than city to prioritize geographic proximity
        X = df_no_neighborhood[['longitude', 'latitude', 'city_encoded']].values
        X_weighted = X * [10, 10, 1]  # Weight lat/lon 10x more than city
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        df_no_neighborhood['synthetic_neighborhood_id'] = 1000 + kmeans.fit_predict(X_weighted)
        
        # Compute statistics for synthetic neighborhoods
        self.synthetic_neighborhood_stats = df_no_neighborhood.groupby('synthetic_neighborhood_id').agg({
            'last_sale_price': ['median', 'mean', 'std', 'count'],
            'square_feet': 'median',
            'city': lambda x: x.mode()[0] if len(x) > 0 else None  # Most common city
        }).reset_index()
        
        self.synthetic_neighborhood_stats.columns = ['synthetic_neighborhood_id', 'median_price', 
                                                     'mean_price', 'std_price', 'sales_count', 
                                                     'median_sqft', 'primary_city']
        
        self.synthetic_neighborhood_stats['price_per_sqft'] = (
            self.synthetic_neighborhood_stats['median_price'] / 
            self.synthetic_neighborhood_stats['median_sqft']
        )
        
        # Store synthetic neighborhood assignments for future predictions
        self.synthetic_assignments = df_no_neighborhood[
            ['parcel_id', 'synthetic_neighborhood_id']
        ].set_index('parcel_id')['synthetic_neighborhood_id'].to_dict()
        
        print(f"  OK: Synthetic neighborhoods: {n_clusters} clusters created")
        print(f"  OK: Covering {len(df_no_neighborhood):,} properties without formal neighborhoods")
    
    def _compute_zip_stats(self, df: pd.DataFrame) -> None:
        """Compute statistics by ZIP code."""
        self.zip_stats = df.groupby('zip_code').agg({
            'last_sale_price': ['median', 'mean', 'count'],
            'square_feet': 'median'
        }).reset_index()
        
        self.zip_stats.columns = ['zip_code', 'median_price', 'mean_price', 'sales_count', 'median_sqft']
        self.zip_stats['price_per_sqft'] = self.zip_stats['median_price'] / self.zip_stats['median_sqft']
        
        print(f"  OK: ZIP code stats: {len(self.zip_stats)} ZIP codes")
    
    def _compute_city_stats(self, df: pd.DataFrame) -> None:
        """Compute statistics by city."""
        self.city_stats = df.groupby('city').agg({
            'last_sale_price': ['median', 'mean', 'count'],
            'square_feet': 'median'
        }).reset_index()
        
        self.city_stats.columns = ['city', 'median_price', 'mean_price', 'sales_count', 'median_sqft']
        self.city_stats['price_per_sqft'] = self.city_stats['median_price'] / self.city_stats['median_sqft']
        
        print(f"  OK: City stats: {len(self.city_stats)} cities")
    
    def _load_train_stations(self) -> None:
        """
        Load Metro-North train station coordinates for distance calculations.
        Major stations in Fairfield County.
        """
        # Major Metro-North stations in Fairfield County (lat, lon)
        self.train_station_coords = {
            'Stamford': (41.0465, -73.5420),
            'Greenwich': (41.0214, -73.6248),
            'Darien': (41.0787, -73.4693),
            'Norwalk': (41.1175, -73.4212),
            'Westport': (41.1190, -73.3580),
            'Fairfield': (41.1432, -73.2571),
            'Bridgeport': (41.1785, -73.1870),
            'Stratford': (41.1945, -73.1315),
            'Milford': (41.2234, -73.0578),
            'New Canaan': (41.1468, -73.4948),
            'Wilton': (41.1951, -73.4379),
            'Cannondale': (41.2304, -73.4257),
            'Redding': (41.2834, -73.3868),
            'Branchville': (41.2676, -73.4412),
            'Danbury': (41.3946, -73.4542),
        }
        
        print(f"  OK: Train stations: {len(self.train_station_coords)} stations loaded")
    
    def calculate_distance_miles(self, point1: Tuple[float, float], 
                                 point2: Tuple[float, float]) -> float:
        """
        Calculate distance between two points in miles using Haversine formula.
        
        Args:
            point1: (latitude, longitude)
            point2: (latitude, longitude)
        
        Returns:
            Distance in miles
        """
        lat1, lon1 = point1
        lat2, lon2 = point2
        
        # Haversine formula
        R = 3959  # Earth's radius in miles
        
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        
        a = (np.sin(dlat / 2) ** 2 + 
             np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2)
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        
        return R * c
    
    def extract_features(self, row: pd.Series) -> Dict[str, float]:
        """
        Extract all location features for a single property using hierarchical strategy.
        
        Args:
            row: Property data
        
        Returns:
            Dictionary of location features
        """
        features = {}
        
        # Extract coordinates
        if row.get('centroid'):
            lon, lat = row['centroid'].coords[0]
        else:
            lon, lat = None, None
        
        # Level 1: Neighborhood features (if available)
        if pd.notna(row.get('neighborhood_id')) and self.neighborhood_stats is not None:
            neighborhood_id = row['neighborhood_id']
            neighborhood_row = self.neighborhood_stats[
                self.neighborhood_stats['neighborhood_id'] == neighborhood_id
            ]
            
            if len(neighborhood_row) > 0:
                features['neighborhood_median_price'] = float(neighborhood_row['median_price'].iloc[0])
                features['neighborhood_price_per_sqft'] = float(neighborhood_row['price_per_sqft'].iloc[0])
                features['neighborhood_sales_volume'] = int(neighborhood_row['sales_count'].iloc[0])
                features['has_neighborhood'] = 1
                features['location_level'] = 1  # Real neighborhood
                features['location_median_price'] = features['neighborhood_median_price']
                features['location_price_per_sqft'] = features['neighborhood_price_per_sqft']
                features['location_sales_volume'] = features['neighborhood_sales_volume']
            else:
                features['has_neighborhood'] = 0
        else:
            features['has_neighborhood'] = 0
        
        # Level 2: Synthetic neighborhood (if no real neighborhood)
        if features.get('has_neighborhood') == 0 and self.synthetic_neighborhood_stats is not None:
            # Try to find synthetic neighborhood assignment
            parcel_id = row.get('parcel_id')
            if parcel_id and parcel_id in self.synthetic_assignments:
                synthetic_id = self.synthetic_assignments[parcel_id]
                synthetic_row = self.synthetic_neighborhood_stats[
                    self.synthetic_neighborhood_stats['synthetic_neighborhood_id'] == synthetic_id
                ]
                
                if len(synthetic_row) > 0:
                    features['location_median_price'] = float(synthetic_row['median_price'].iloc[0])
                    features['location_price_per_sqft'] = float(synthetic_row['price_per_sqft'].iloc[0])
                    features['location_sales_volume'] = int(synthetic_row['sales_count'].iloc[0])
                    features['location_level'] = 2  # Synthetic neighborhood
        
        # Level 3: ZIP code (if no neighborhood features yet)
        if 'location_median_price' not in features and pd.notna(row.get('zip_code')):
            zip_code = row['zip_code']
            zip_row = self.zip_stats[self.zip_stats['zip_code'] == zip_code]
            
            if len(zip_row) > 0:
                features['location_median_price'] = float(zip_row['median_price'].iloc[0])
                features['location_price_per_sqft'] = float(zip_row['price_per_sqft'].iloc[0])
                features['location_sales_volume'] = int(zip_row['sales_count'].iloc[0])
                features['location_level'] = 3  # ZIP code
        
        # Level 4: City (fallback)
        if 'location_median_price' not in features:
            city = row.get('city')
            if city:
                city_row = self.city_stats[self.city_stats['city'] == city]
                
                if len(city_row) > 0:
                    features['location_median_price'] = float(city_row['median_price'].iloc[0])
                    features['location_price_per_sqft'] = float(city_row['price_per_sqft'].iloc[0])
                    features['location_sales_volume'] = int(city_row['sales_count'].iloc[0])
                    features['location_level'] = 4  # City only
        
        # Always include ZIP code features separately (if available)
        if pd.notna(row.get('zip_code')):
            zip_code = row['zip_code']
            zip_row = self.zip_stats[self.zip_stats['zip_code'] == zip_code]
            if len(zip_row) > 0:
                features['zip_median_price'] = float(zip_row['median_price'].iloc[0])
                features['zip_price_per_sqft'] = float(zip_row['price_per_sqft'].iloc[0])
                features['zip_sales_volume'] = int(zip_row['sales_count'].iloc[0])
        
        # Always include city features
        city = row.get('city')
        if city:
            city_row = self.city_stats[self.city_stats['city'] == city]
            if len(city_row) > 0:
                features['city_median_price'] = float(city_row['median_price'].iloc[0])
            
            features['city_prestige_index'] = CITY_PRESTIGE_INDEX.get(city, 1.0)
        
        # Distance features (if coordinates available)
        if lat and lon:
            # Distance to nearest train station
            min_dist = float('inf')
            for station, (station_lat, station_lon) in self.train_station_coords.items():
                dist = self.calculate_distance_miles((lat, lon), (station_lat, station_lon))
                min_dist = min(min_dist, dist)
            features['dist_to_train_station'] = min_dist
            
            # Distance to Long Island Sound (approximate southern border at lat ~41.0)
            features['dist_to_water'] = abs(lat - 41.0) * 69  # 1 degree lat â‰ˆ 69 miles
            
            # Distance to downtown (city-specific)
            downtown_coords = {
                'Stamford': (41.0534, -73.5387),
                'Greenwich': (41.0265, -73.6282),
                'Norwalk': (41.1176, -73.4079),
                'Bridgeport': (41.1865, -73.1952),
                'Danbury': (41.3948, -73.4540),
            }
            
            if city in downtown_coords:
                features['dist_to_downtown'] = self.calculate_distance_miles(
                    (lat, lon), downtown_coords[city]
                )
            else:
                features['dist_to_downtown'] = 5.0  # Default 5 miles
            
            # Distance to I-95 (approximate path at lon ~-73.5 to -73.2)
            # Simple approximation
            features['dist_to_highway'] = min(abs(lon - (-73.5)), abs(lon - (-73.2))) * 50  # 1 degree lon â‰ˆ 50 miles
        
        return features
    
    def extract_features_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract location features for entire dataframe.
        
        Args:
            df: DataFrame with property data
        
        Returns:
            DataFrame with added location feature columns
        """
        print("Extracting location features for all properties...")
        
        features_list = []
        for idx, row in df.iterrows():
            features = self.extract_features(row)
            features_list.append(features)
        
        features_df = pd.DataFrame(features_list, index=df.index)
        
        # Merge with original dataframe
        df_with_features = pd.concat([df, features_df], axis=1)
        
        # Fill missing values with medians
        for col in features_df.columns:
            if features_df[col].dtype in [np.float64, np.int64]:
                median_val = features_df[col].median()
                df_with_features[col].fillna(median_val, inplace=True)
        
        print(f"  OK: Location features extracted for {len(df)} properties")
        print(f"  OK: Location level distribution:")
        if 'location_level' in df_with_features.columns:
            level_counts = df_with_features['location_level'].value_counts().sort_index()
            level_names = {1: 'Real Neighborhood', 2: 'Synthetic Neighborhood', 3: 'ZIP Code', 4: 'City Only'}
            for level, count in level_counts.items():
                level_name = level_names.get(level, 'Unknown')
                print(f"      {level_name}: {count:,} ({count/len(df)*100:.1f}%)")
        
        return df_with_features



