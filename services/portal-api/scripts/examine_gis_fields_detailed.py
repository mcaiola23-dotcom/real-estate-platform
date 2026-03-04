"""
Detailed examination of CT GIS fields, especially for:
- Occupancy/unit count fields
- Commercial property details
- Property subtypes
"""

import json
import sys
from pathlib import Path
from collections import defaultdict, Counter

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def examine_field_samples(file_path: Path, fields_of_interest: list, sample_size: int = 50):
    """Examine specific fields with samples."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    features = data.get('features', [])
    if not features:
        return None
    
    samples = defaultdict(list)
    field_counts = Counter()
    
    # Sample up to sample_size features
    for feature in features[:sample_size]:
        props = feature.get('properties', {})
        
        for field in fields_of_interest:
            if field in props:
                value = props[field]
                if value not in [None, '', ' ', 'None']:
                    samples[field].append(value)
                    field_counts[field] += 1
    
    # Get unique values for each field
    unique_values = {}
    for field in fields_of_interest:
        if field in samples:
            unique_values[field] = sorted(list(set(samples[field])))[:20]  # Top 20 unique values
    
    return {
        'total_features': len(features),
        'field_counts': dict(field_counts),
        'unique_values': unique_values,
        'all_fields': sorted(set(features[0].get('properties', {}).keys()) if features else [])
    }

def main():
    data_dir = Path(r'C:\Users\19143\Projects\fairfield-realestate\backend\data\chunks')
    
    # Fields of interest
    fields_to_check = [
        'Occupancy',
        'Occupancy_Type',
        'Units',
        'Number_of_Units',
        'Unit_Count',
        'Total_Units',
        'Dwelling_Units',
        'Residential_Units',
        'Commercial_Units',
        'Property_Subtype',
        'Building_Type',
        'Use_Code',
        'Use_Type',
        'Commercial_Type',
        'Retail',
        'Office',
        'Industrial',
        'Medical',
        'Warehouse',
        'State_Use',
        'State_Use_Description',
        'Parcel_Type',
        'Unit_Type'
    ]
    
    print("="*80)
    print("DETAILED FIELD EXAMINATION")
    print("="*80)
    
    # Check a few representative towns
    towns_to_check = ['Bridgeport', 'Stamford', 'Norwalk', 'Danbury', 'Greenwich', 'Fairfield']
    
    for town_file in sorted(data_dir.glob("*.geojson")):
        town = town_file.stem.replace('_parcels', '').title()
        if town not in towns_to_check:
            continue
        
        print(f"\n{'='*80}")
        print(f"Town: {town}")
        print(f"{'='*80}")
        
        analysis = examine_field_samples(town_file, fields_to_check, sample_size=100)
        
        if not analysis:
            continue
        
        print(f"Total parcels: {analysis['total_features']:,}")
        
        # Show which fields exist
        print(f"\nFields found in sample:")
        for field in fields_to_check:
            if field in analysis['field_counts']:
                count = analysis['field_counts'][field]
                unique_count = len(analysis['unique_values'].get(field, []))
                print(f"  [FOUND] {field}: {count} parcels have this field, {unique_count} unique values")
                if unique_count <= 10:
                    print(f"    Values: {analysis['unique_values'][field]}")
        
        # Show all fields for one town (to see what else we might be missing)
        if town == 'Bridgeport':
            print(f"\nAll available fields in {town} ({len(analysis['all_fields'])} total):")
            for field in analysis['all_fields'][:30]:  # Show first 30
                print(f"  - {field}")
            if len(analysis['all_fields']) > 30:
                print(f"  ... and {len(analysis['all_fields']) - 30} more fields")
        
        # Check for commercial property details
        print(f"\nCommercial property details:")
        if 'State_Use' in analysis['unique_values']:
            commercial_codes = [c for c in analysis['unique_values']['State_Use'] 
                              if c and str(c).startswith(('2', '3', '4', '5', '6', '7', '8', '9'))]
            if commercial_codes:
                print(f"  Commercial/Industrial codes found: {commercial_codes[:10]}")
        
        if 'State_Use_Description' in analysis['unique_values']:
            commercial_descs = [d for d in analysis['unique_values']['State_Use_Description'] 
                               if d and any(word in str(d).lower() for word in 
                                          ['commercial', 'retail', 'office', 'warehouse', 'industrial', 
                                           'medical', 'hospital', 'restaurant', 'hotel', 'bank'])]
            if commercial_descs:
                print(f"  Commercial descriptions found: {commercial_descs[:10]}")

if __name__ == '__main__':
    main()

