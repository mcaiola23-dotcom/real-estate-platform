import json
import os

GEOJSON_FILE = os.path.join(os.path.dirname(__file__), '../data/zillow_neighborhoods_ct.geojson')

def list_zillow_neighborhoods():
    with open(GEOJSON_FILE, 'r') as f:
        data = json.load(f)
    
    print(f"Total Features: {len(data['features'])}")
    print("City | Name")
    print("-" * 30)
    for f in data['features']:
        p = f['properties']
        print(f"{p.get('CITY')} | {p.get('NAME')}")

if __name__ == "__main__":
    list_zillow_neighborhoods()
