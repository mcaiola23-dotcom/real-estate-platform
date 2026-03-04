import requests
import os
import zipfile
import io

# URL for CT 2020 Places (includes CDPs) - 500k resolution (good balance of detail/size)
DATA_URL = "https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_09_place_500k.zip"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../data/census_cdp')
OUTPUT_ZIP = os.path.join(OUTPUT_DIR, 'ct_cdp.zip')

def download_census_data():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Downloading Census data from {DATA_URL}...")
    try:
        response = requests.get(DATA_URL)
        response.raise_for_status()
        
        with open(OUTPUT_ZIP, 'wb') as f:
            f.write(response.content)
            
        print("Extracting zip...")
        with zipfile.ZipFile(OUTPUT_ZIP, 'r') as zip_ref:
            zip_ref.extractall(OUTPUT_DIR)
            
        print(f"✅ Data saved to {OUTPUT_DIR}")
        
        # List files
        print("Files:")
        for f in os.listdir(OUTPUT_DIR):
            print(f"  {f}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    download_census_data()
