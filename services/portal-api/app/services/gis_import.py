"""
CT GIS Data Import Service
Handles importing GeoJSON parcel data from CT GIS into PostgreSQL with PostGIS.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import re

from sqlalchemy import text
from sqlalchemy.orm import Session
from shapely.geometry import shape, Point, Polygon, mapping
from shapely.validation import make_valid
from shapely.errors import GEOSException

from .property_type_classifier import classify_from_properties

logger = logging.getLogger(__name__)


class GISImportService:
    """Service for importing CT GIS GeoJSON parcel data."""
    
    # Fairfield County bounds (approximate)
    FAIRFIELD_COUNTY_BOUNDS = {
        'min_lat': 41.0,
        'max_lat': 41.4,
        'min_lng': -73.7,
        'max_lng': -73.1
    }
    
    def __init__(self, db_session: Session):
        """
        Initialize the GIS import service.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
    
    def import_geojson_file(
        self,
        file_path: Path,
        town_name: Optional[str] = None,
        batch_size: int = 1000,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Import a GeoJSON file containing parcel data.
        
        Args:
            file_path: Path to GeoJSON file
            town_name: Optional town name override (otherwise extracted from filename)
            batch_size: Number of parcels to process before committing
            dry_run: If True, validate but don't import
            
        Returns:
            Dictionary with import statistics
        """
        if not file_path.exists():
            raise FileNotFoundError(f"GeoJSON file not found: {file_path}")
        
        # Extract town name from filename if not provided
        if not town_name:
            town_name = self._extract_town_name(file_path)
        
        logger.info(f"Starting import of {file_path.name} for town: {town_name}")
        
        # Load GeoJSON
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                geojson_data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid GeoJSON file: {e}")
        
        if geojson_data.get('type') != 'FeatureCollection':
            raise ValueError(f"Expected FeatureCollection, got {geojson_data.get('type')}")
        
        features = geojson_data.get('features', [])
        total_features = len(features)
        
        logger.info(f"Found {total_features} features in {file_path.name}")
        
        # Statistics
        stats = {
            'total': total_features,
            'imported': 0,
            'skipped': 0,
            'errors': 0,
            'errors_detail': []
        }
        
        if dry_run:
            logger.info("DRY RUN MODE - No data will be imported")
        
        # Process in batches
        batch = []
        for idx, feature in enumerate(features, 1):
            try:
                parcel_data = self._transform_feature(feature, town_name)
                
                if parcel_data:
                    batch.append(parcel_data)
                    
                    # Commit batch
                    if len(batch) >= batch_size:
                        if not dry_run:
                            self._insert_batch(batch)
                        stats['imported'] += len(batch)
                        batch = []
                        logger.info(f"Processed {idx}/{total_features} parcels...")
                else:
                    stats['skipped'] += 1
                    
            except Exception as e:
                stats['errors'] += 1
                error_msg = f"Error processing feature {idx}: {str(e)}"
                stats['errors_detail'].append(error_msg)
                logger.error(error_msg)
        
        # Insert remaining batch
        if batch:
            if not dry_run:
                self._insert_batch(batch)
            stats['imported'] += len(batch)
        
        logger.info(f"Import complete: {stats['imported']} imported, {stats['skipped']} skipped, {stats['errors']} errors")
        
        return stats
    
    def _extract_town_name(self, file_path: Path) -> str:
        """
        Extract town name from filename (e.g., 'bethel_parcels.geojson' -> 'Bethel').
        Handles special cases like 'new_canaan' -> 'New Canaan'.
        """
        filename = file_path.stem  # Remove extension
        # Remove '_parcels' suffix
        town_name = filename.replace('_parcels', '')
        # Replace underscores with spaces and title case
        town_name = town_name.replace('_', ' ').title()
        # Special case: "New Canaan" (not "New canaan")
        if town_name.lower() == 'new canaan':
            town_name = 'New Canaan'
        return town_name
    
    def _transform_feature(self, feature: Dict[str, Any], town_name: str) -> Optional[Dict[str, Any]]:
        """
        Transform a GeoJSON feature into our database schema format.
        
        Args:
            feature: GeoJSON feature object
            town_name: Town name for the parcel
            
        Returns:
            Dictionary with parcel data ready for database insertion
        """
        properties = feature.get('properties', {})
        geometry_data = feature.get('geometry')
        
        # Extract parcel ID (primary identifier)
        parcel_id = properties.get('Parcel_ID') or properties.get('CAMA_Link')
        if not parcel_id:
            logger.warning(f"Feature missing Parcel_ID and CAMA_Link, skipping")
            return None
        
        # Parse and validate geometry
        try:
            geometry = self._parse_geometry(geometry_data)
            if not geometry:
                logger.warning(f"Invalid geometry for parcel {parcel_id}, skipping")
                return None
            
            # Calculate centroid
            centroid = self._calculate_centroid(geometry)
            
        except Exception as e:
            logger.error(f"Geometry error for parcel {parcel_id}: {e}")
            return None
        
        # Parse address - handle towns with Location vs Location_1 field
        # Some towns (Stamford, Norwalk, Danbury, Westport, Ridgefield, Redding) use Location_1
        location = properties.get('Location') or properties.get('Location_1', '')
        address_data = self._parse_address(location)
        
        # Extract and transform data
        parcel_data = {
            'parcel_id': str(parcel_id),
            'cama_link': properties.get('CAMA_Link'),
            'object_id': self._safe_int(properties.get('OBJECTID')),
            'town_name': properties.get('Town_Name') or town_name,
            'address_full': location.strip() if location else None,
            'address_number': address_data.get('number'),
            'street_name': address_data.get('street'),
            'city': properties.get('Property_City') or town_name,
            'state': 'CT',
            'zip_code': properties.get('Property_Zip'),
            'geometry': geometry,  # Will be converted to PostGIS format
            'centroid': centroid,  # Will be converted to PostGIS format
            'lot_size_acres': self._safe_decimal(properties.get('Land_Acres')),
            'lot_size_sqft': self._calculate_lot_size_sqft(properties.get('Land_Acres')),
            'zoning': properties.get('Zone'),
            'land_use': properties.get('State_Use'),
            'land_use_description': properties.get('State_Use_Description'),
            'assessment_total': self._safe_decimal(properties.get('Assessed_Total')),
            'assessment_land': self._safe_decimal(properties.get('Assessed_Land')),
            'assessment_building': self._safe_decimal(properties.get('Assessed_Building')),
            'appraised_land': self._safe_decimal(properties.get('Appraised_Land')),
            'appraised_building': self._safe_decimal(properties.get('Appraised_Building')),
            'tax_year': self._safe_int(properties.get('Valuation_Year')),
            'year_built': self._safe_int(properties.get('EYB')) or self._safe_int(properties.get('AYB')),
            'square_feet': self._safe_int(properties.get('Living_Area')),
            'effective_area': self._safe_int(properties.get('Effective_Area')),
            'bedrooms': self._safe_int(properties.get('Number_of_Bedroom')),
            'baths_full': self._safe_int(properties.get('Number_of_Baths')),
            'baths_half': self._safe_int(properties.get('Number_of_Half_Baths')),
            'total_rooms': self._safe_int(properties.get('Total_Rooms')),
            'condition': properties.get('Condition'),
            'model': properties.get('Model'),
            'last_sale_price': self._safe_decimal(properties.get('Sale_Price')),
            'last_sale_date': self._parse_date(properties.get('Sale_Date')),
            'prior_sale_price': self._safe_decimal(properties.get('Prior_Sale_Price')),
            'prior_sale_date': self._parse_date(properties.get('Prior_Sale_Date')),
            'collection_year': properties.get('Collection_year'),
            'fips_code': properties.get('FIPS'),
            'cog': properties.get('COG'),
            'shape_area': self._safe_decimal(properties.get('Shape__Area')),
            'shape_length': self._safe_decimal(properties.get('Shape__Length')),
        }
        
        # Calculate derived fields
        parcel_data['appraised_total'] = self._calculate_appraised_total(
            parcel_data['appraised_land'],
            parcel_data['appraised_building']
        )
        
        parcel_data['bathrooms'] = self._calculate_total_bathrooms(
            parcel_data['baths_full'],
            parcel_data['baths_half']
        )
        
        # Classify property type using standardized classifier
        standardized_type, subtype, type_detail, units = classify_from_properties(properties)
        parcel_data['property_type'] = standardized_type
        parcel_data['property_type_detail'] = type_detail
        parcel_data['property_subtype'] = subtype
        parcel_data['units'] = units
        
        return parcel_data
    
    def _parse_geometry(self, geometry_data: Dict[str, Any]) -> Optional[Polygon]:
        """
        Parse and validate GeoJSON geometry.
        
        Args:
            geometry_data: GeoJSON geometry object
            
        Returns:
            Shapely Polygon object or None if invalid
        """
        if not geometry_data:
            return None
        
        try:
            # Create Shapely geometry from GeoJSON
            geom = shape(geometry_data)
            
            # Ensure it's a Polygon (or MultiPolygon)
            if geom.geom_type == 'Polygon':
                # Validate and fix if needed
                if not geom.is_valid:
                    geom = make_valid(geom)
                    # If fix resulted in MultiPolygon, take first polygon
                    if geom.geom_type == 'MultiPolygon':
                        geom = geom.geoms[0]
                
                # Validate bounds (should be within Fairfield County)
                bounds = geom.bounds
                if not self._validate_bounds(bounds):
                    logger.warning(f"Geometry bounds outside Fairfield County: {bounds}")
                    # Don't reject, but log warning
                
                return geom
            elif geom.geom_type == 'MultiPolygon':
                # Take first polygon from multipolygon
                if len(geom.geoms) > 0:
                    first_poly = geom.geoms[0]
                    if not first_poly.is_valid:
                        first_poly = make_valid(first_poly)
                    return first_poly
            else:
                logger.warning(f"Unexpected geometry type: {geom.geom_type}")
                return None
                
        except (GEOSException, ValueError, KeyError) as e:
            logger.error(f"Geometry parsing error: {e}")
            return None
    
    def _calculate_centroid(self, geometry: Polygon) -> Point:
        """Calculate centroid point from polygon."""
        try:
            centroid = geometry.centroid
            return centroid
        except Exception as e:
            logger.error(f"Centroid calculation error: {e}")
            # Fallback to bounds center
            bounds = geometry.bounds
            return Point(
                (bounds[0] + bounds[2]) / 2,
                (bounds[1] + bounds[3]) / 2
            )
    
    def _parse_address(self, location: str) -> Dict[str, Optional[str]]:
        """
        Parse address from Location field.
        
        Examples:
        - " RESEARCH DRIVE" -> {number: None, street: "Research Drive"}
        - "123 MAIN STREET" -> {number: "123", street: "Main Street"}
        - "0 VALLEY FORGE ROAD" -> {number: "0", street: "Valley Forge Road"}
        """
        if not location:
            return {'number': None, 'street': None}
        
        location = location.strip()
        
        # Pattern to match street number at start
        # Matches: "123", "123A", "123-125", etc.
        match = re.match(r'^(\d+[A-Za-z]?[-]?\d*[A-Za-z]?)\s+(.+)$', location)
        
        if match:
            number = match.group(1)
            street = match.group(2).strip()
        else:
            # No number found, entire string is street
            number = None
            street = location
        
        # Normalize street name (title case, standardize abbreviations)
        if street:
            street = self._normalize_street_name(street)
        
        return {'number': number, 'street': street}
    
    def _normalize_street_name(self, street: str) -> str:
        """Normalize street name (title case, standardize abbreviations)."""
        # Standardize common abbreviations
        abbreviations = {
            'ST': 'Street',
            'ST.': 'Street',
            'AVE': 'Avenue',
            'AVE.': 'Avenue',
            'AV': 'Avenue',
            'RD': 'Road',
            'RD.': 'Road',
            'DR': 'Drive',
            'DR.': 'Drive',
            'LN': 'Lane',
            'LN.': 'Lane',
            'CT': 'Court',
            'CT.': 'Court',
            'PL': 'Place',
            'PL.': 'Place',
            'BLVD': 'Boulevard',
            'BLVD.': 'Boulevard',
            'PKWY': 'Parkway',
            'PKWY.': 'Parkway',
            'CIR': 'Circle',
            'CIR.': 'Circle',
        }
        
        # Split into words
        words = street.upper().split()
        
        # Replace abbreviations
        normalized_words = []
        for word in words:
            if word in abbreviations:
                normalized_words.append(abbreviations[word])
            else:
                normalized_words.append(word.title())
        
        return ' '.join(normalized_words)
    
    def _validate_bounds(self, bounds: Tuple[float, float, float, float]) -> bool:
        """Validate that bounds are within Fairfield County."""
        minx, miny, maxx, maxy = bounds
        return (
            self.FAIRFIELD_COUNTY_BOUNDS['min_lng'] <= minx <= self.FAIRFIELD_COUNTY_BOUNDS['max_lng'] and
            self.FAIRFIELD_COUNTY_BOUNDS['min_lat'] <= miny <= self.FAIRFIELD_COUNTY_BOUNDS['max_lat'] and
            self.FAIRFIELD_COUNTY_BOUNDS['min_lng'] <= maxx <= self.FAIRFIELD_COUNTY_BOUNDS['max_lng'] and
            self.FAIRFIELD_COUNTY_BOUNDS['min_lat'] <= maxy <= self.FAIRFIELD_COUNTY_BOUNDS['max_lat']
        )
    
    def _insert_batch(self, batch: List[Dict[str, Any]]) -> None:
        """
        Insert a batch of parcels into the database.
        
        Note: This uses raw SQL with PostGIS functions. The `parcels` table must exist
        before running imports. This will be updated in Task 8 when we create the
        Parcel SQLAlchemy model, but for now raw SQL allows us to test the import
        pipeline independently.
        """
        if not batch:
            return
        
        # Build SQL insert statement
        # Note: This is temporary until we have the Parcel model
        # We'll use raw SQL with PostGIS functions
        
        insert_sql = """
        INSERT INTO parcels (
            parcel_id, cama_link, object_id, town_name,
            address_full, address_number, street_name, city, state, zip_code,
            geometry, centroid,
            lot_size_acres, lot_size_sqft, zoning, land_use, land_use_description,
            assessment_total, assessment_land, assessment_building,
            appraised_land, appraised_building, appraised_total,
            tax_year, year_built, square_feet, effective_area,
            bedrooms, bathrooms, baths_full, baths_half, total_rooms,
            property_type, property_subtype, property_type_detail, units, condition, model,
            last_sale_price, last_sale_date, prior_sale_price, prior_sale_date,
            collection_year, fips_code, cog, shape_area, shape_length,
            created_at, updated_at
        ) VALUES (
            :parcel_id, :cama_link, :object_id, :town_name,
            :address_full, :address_number, :street_name, :city, :state, :zip_code,
            ST_GeomFromGeoJSON(:geometry), ST_GeomFromGeoJSON(:centroid),
            :lot_size_acres, :lot_size_sqft, :zoning, :land_use, :land_use_description,
            :assessment_total, :assessment_land, :assessment_building,
            :appraised_land, :appraised_building, :appraised_total,
            :tax_year, :year_built, :square_feet, :effective_area,
            :bedrooms, :bathrooms, :baths_full, :baths_half, :total_rooms,
            :property_type, :property_subtype, :property_type_detail, :units, :condition, :model,
            :last_sale_price, :last_sale_date, :prior_sale_price, :prior_sale_date,
            :collection_year, :fips_code, :cog, :shape_area, :shape_length,
            NOW(), NOW()
        )
        ON CONFLICT (parcel_id) DO UPDATE SET
            updated_at = NOW(),
            cama_link = EXCLUDED.cama_link,
            object_id = EXCLUDED.object_id,
            town_name = EXCLUDED.town_name,
            address_full = EXCLUDED.address_full,
            address_number = EXCLUDED.address_number,
            street_name = EXCLUDED.street_name,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            zip_code = EXCLUDED.zip_code,
            geometry = EXCLUDED.geometry,
            centroid = EXCLUDED.centroid,
            lot_size_acres = EXCLUDED.lot_size_acres,
            lot_size_sqft = EXCLUDED.lot_size_sqft,
            zoning = EXCLUDED.zoning,
            land_use = EXCLUDED.land_use,
            land_use_description = EXCLUDED.land_use_description,
            assessment_total = EXCLUDED.assessment_total,
            assessment_land = EXCLUDED.assessment_land,
            assessment_building = EXCLUDED.assessment_building,
            appraised_land = EXCLUDED.appraised_land,
            appraised_building = EXCLUDED.appraised_building,
            appraised_total = EXCLUDED.appraised_total,
            tax_year = EXCLUDED.tax_year,
            year_built = EXCLUDED.year_built,
            square_feet = EXCLUDED.square_feet,
            effective_area = EXCLUDED.effective_area,
            bedrooms = EXCLUDED.bedrooms,
            bathrooms = EXCLUDED.bathrooms,
            baths_full = EXCLUDED.baths_full,
            baths_half = EXCLUDED.baths_half,
            total_rooms = EXCLUDED.total_rooms,
            property_type = EXCLUDED.property_type,
            property_subtype = EXCLUDED.property_subtype,
            property_type_detail = EXCLUDED.property_type_detail,
            units = EXCLUDED.units,
            condition = EXCLUDED.condition,
            model = EXCLUDED.model,
            last_sale_price = EXCLUDED.last_sale_price,
            last_sale_date = EXCLUDED.last_sale_date,
            prior_sale_price = EXCLUDED.prior_sale_price,
            prior_sale_date = EXCLUDED.prior_sale_date,
            collection_year = EXCLUDED.collection_year,
            fips_code = EXCLUDED.fips_code,
            cog = EXCLUDED.cog,
            shape_area = EXCLUDED.shape_area,
            shape_length = EXCLUDED.shape_length
        """
        
        # Execute batch insert
        try:
            # Prepare all parcels for batch insert
            prepared_batch = []
            for parcel in batch:
                # Convert Shapely geometry to GeoJSON string for PostGIS
                geom_json = None
                centroid_json = None
                
                if parcel.get('geometry'):
                    if hasattr(parcel['geometry'], '__geo_interface__'):
                        # Shapely geometry - convert to GeoJSON
                        geom_json = json.dumps(mapping(parcel['geometry']))
                    elif isinstance(parcel['geometry'], str):
                        # Already a JSON string
                        geom_json = parcel['geometry']
                    else:
                        # Try to convert
                        geom_json = json.dumps(mapping(parcel['geometry']))
                
                if parcel.get('centroid'):
                    if hasattr(parcel['centroid'], '__geo_interface__'):
                        # Shapely Point - convert to GeoJSON
                        centroid_json = json.dumps(mapping(parcel['centroid']))
                    elif isinstance(parcel['centroid'], str):
                        # Already a JSON string
                        centroid_json = parcel['centroid']
                    else:
                        # Try to convert
                        centroid_json = json.dumps(mapping(parcel['centroid']))
                
                # Prepare parameters
                params = {k: v for k, v in parcel.items() if k not in ['geometry', 'centroid']}
                params['geometry'] = geom_json
                params['centroid'] = centroid_json
                prepared_batch.append(params)
            
            # Use execute_batch for better performance, but we need to do it one at a time
            # due to PostGIS function requirements
            # Use savepoints to handle individual parcel failures without aborting the entire batch
            for params in prepared_batch:
                try:
                    self.db.execute(text(insert_sql), params)
                    self.db.commit()  # Commit each parcel individually to avoid transaction abort issues
                except Exception as e:
                    # Rollback the failed insert
                    self.db.rollback()
                    # Log the specific parcel that failed but continue with others
                    parcel_id = params.get('parcel_id', 'unknown')
                    logger.warning(f"Failed to insert parcel {parcel_id}: {e}")
                    # Continue with next parcel instead of failing entire batch
                    continue
            logger.debug(f"Successfully inserted batch of {len(prepared_batch)} parcels")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Batch insert error: {e}")
            # Log first parcel for debugging
            if batch:
                logger.error(f"First parcel in batch: {batch[0].get('parcel_id')}")
                logger.error(f"Geometry type: {type(batch[0].get('geometry'))}")
            raise
    
    # Helper methods for data transformation
    def _safe_int(self, value: Any) -> Optional[int]:
        """Safely convert value to integer."""
        if value is None or value == '':
            return None
        try:
            return int(float(value))  # Handle string numbers
        except (ValueError, TypeError):
            return None
    
    def _safe_decimal(self, value: Any) -> Optional[float]:
        """Safely convert value to decimal/float."""
        if value is None or value == '':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def _parse_date(self, value: Any) -> Optional[datetime]:
        """Parse date string to datetime object."""
        if not value:
            return None
        try:
            if isinstance(value, str):
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']:
                    try:
                        return datetime.strptime(value.split()[0], fmt)
                    except ValueError:
                        continue
            return None
        except Exception:
            return None
    
    def _calculate_lot_size_sqft(self, acres: Optional[float]) -> Optional[int]:
        """Calculate lot size in square feet from acres."""
        if acres is None:
            return None
        try:
            return int(acres * 43560)  # 1 acre = 43,560 sq ft
        except (ValueError, TypeError):
            return None
    
    def _calculate_appraised_total(
        self,
        appraised_land: Optional[float],
        appraised_building: Optional[float]
    ) -> Optional[float]:
        """Calculate total appraised value."""
        if appraised_land is None and appraised_building is None:
            return None
        total = (appraised_land or 0) + (appraised_building or 0)
        return total if total > 0 else None
    
    def _calculate_total_bathrooms(
        self,
        baths_full: Optional[int],
        baths_half: Optional[int]
    ) -> Optional[float]:
        """Calculate total bathrooms (full + 0.5 * half)."""
        if baths_full is None and baths_half is None:
            return None
        total = (baths_full or 0) + (baths_half or 0) * 0.5
        return total if total > 0 else None

