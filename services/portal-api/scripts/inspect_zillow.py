import requests
import json
import os

DATA_URL = "https://raw.githubusercontent.com/AlexMotz/us-neighborhood-geojson/master/neighborhood-GeoJSON/ZillowNeighborhoods-CT.geojson"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../data/zillow_neighborhoods_ct.geojson')

def download_and_inspect():
    print(f"Downloading data from {DATA_URL}...")
    try:
        response = requests.get(DATA_URL)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Downloaded {len(data['features'])} features.")
        
        # Save to file
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(data, f)
        print(f"Saved to {OUTPUT_FILE}")
        
        # Inspect first feature
        if data['features']:
            props = data['features'][0]['properties']
            print("\nSample Properties:")
            for k, v in props.items():
                print(f"  {k}: {v}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    download_and_inspect()
