"""
Script to examine CT GIS GeoJSON fields across different towns.
This helps identify field variations and ensure consistent mapping.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def examine_file(file_path: Path):
    """Examine a single GeoJSON file and return field analysis."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    features = data.get('features', [])
    if not features:
        return None
    
    # Get all unique field names from first few features
    all_fields = set()
    sample_fields = defaultdict(list)
    
    for feature in features[:10]:  # Sample first 10 features
        props = feature.get('properties', {})
        all_fields.update(props.keys())
        
        # Collect samples of key fields
        for field in ['Parcel_Type', 'State_Use', 'State_Use_Description', 
                     'Zone', 'Land_Acres', 'Living_Area', 'Number_of_Bedroom',
                     'Number_of_Baths', 'Total_Rooms', 'Collection_year']:
            if field in props:
                sample_fields[field].append(props[field])
    
    return {
        'total_features': len(features),
        'all_fields': sorted(all_fields),
        'sample_values': {k: list(set(v))[:5] for k, v in sample_fields.items()}
    }

def main():
    data_dir = Path(r'C:\Users\19143\Projects\fairfield-realestate\backend\data\chunks')
    
    if not data_dir.exists():
        print(f"Data directory not found: {data_dir}")
        return
    
    geojson_files = sorted(data_dir.glob("*.geojson"))
    
    print(f"Examining {len(geojson_files)} GeoJSON files...\n")
    
    # Analyze each file
    field_variations = defaultdict(set)
    town_counts = {}
    
    for file_path in geojson_files:
        town = file_path.stem.replace('_parcels', '').title()
        print(f"\n{'='*80}")
        print(f"Town: {town}")
        print(f"{'='*80}")
        
        analysis = examine_file(file_path)
        if not analysis:
            print(f"  No features found in {file_path.name}")
            continue
        
        town_counts[town] = analysis['total_features']
        print(f"  Total parcels: {analysis['total_features']:,}")
        
        # Check for property type related fields
        property_fields = [f for f in analysis['all_fields'] 
                          if 'type' in f.lower() or 'use' in f.lower() or 'zone' in f.lower()]
        
        if property_fields:
            print(f"  Property type fields: {', '.join(property_fields)}")
            for field in property_fields:
                if field in analysis['sample_values']:
                    samples = analysis['sample_values'][field]
                    print(f"    {field}: {samples}")
        
        # Track all fields
        for field in analysis['all_fields']:
            field_variations[field].add(town)
    
    # Summary: Field consistency across towns
    print(f"\n{'='*80}")
    print("FIELD CONSISTENCY ANALYSIS")
    print(f"{'='*80}")
    
    # Find fields that exist in all towns
    all_towns = set(town_counts.keys())
    consistent_fields = [f for f, towns in field_variations.items() 
                       if towns == all_towns]
    
    print(f"\nFields present in ALL towns ({len(consistent_fields)}):")
    for field in sorted(consistent_fields)[:20]:
        print(f"  ✓ {field}")
    
    # Find fields that vary
    varying_fields = {f: towns for f, towns in field_variations.items() 
                     if len(towns) < len(all_towns) and len(towns) > 0}
    
    if varying_fields:
        print(f"\nFields that vary across towns ({len(varying_fields)}):")
        for field, towns in sorted(varying_fields.items(), key=lambda x: len(x[1])):
            missing = all_towns - towns
            print(f"  ⚠ {field}: present in {len(towns)}/{len(all_towns)} towns")
            if len(missing) <= 5:
                print(f"      Missing in: {', '.join(missing)}")
    
    # Parcel counts by town
    print(f"\n{'='*80}")
    print("PARCEL COUNTS BY TOWN")
    print(f"{'='*80}")
    for town, count in sorted(town_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {town:20s}: {count:7,} parcels")

if __name__ == '__main__':
    main()

