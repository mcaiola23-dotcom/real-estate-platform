"""Check expected parcel counts from source GeoJSON files."""
import json
from pathlib import Path

data_dir = Path(r'C:\Users\19143\Projects\fairfield-realestate\backend\data\chunks')

towns_to_check = ['weston', 'westport', 'wilton', 'shelton', 'stratford', 'trumbull']

print("Expected parcel counts from source files:")
print("="*80)

for town in towns_to_check:
    file_path = data_dir / f"{town}_parcels.geojson"
    if file_path.exists():
        with open(file_path, 'r') as f:
            data = json.load(f)
            count = len(data.get('features', []))
            print(f"{town.title():20s}: {count:7,} parcels")
    else:
        print(f"{town.title():20s}: File not found")


