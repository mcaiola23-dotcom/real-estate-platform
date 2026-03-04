import requests
import json

OVERPASS_URL = "http://overpass-api.de/api/interpreter"

def check_osm():
    # Query for neighborhoods in Fairfield County (approx bbox)
    # Fairfield County: 41.0, -73.7 to 41.6, -73.0
    query = """
    [out:json][timeout:25];
    (
      node["place"="neighbourhood"](41.0,-73.74,41.36,-73.05);
      way["place"="neighbourhood"](41.0,-73.74,41.36,-73.05);
      relation["place"="neighbourhood"](41.0,-73.74,41.36,-73.05);
      
      node["place"="suburb"](41.0,-73.74,41.36,-73.05);
      way["place"="suburb"](41.0,-73.74,41.36,-73.05);
      relation["place"="suburb"](41.0,-73.74,41.36,-73.05);
    );
    out body;
    >;
    out skel qt;
    """
    
    try:
        response = requests.post(OVERPASS_URL, data=query)
        response.raise_for_status()
        data = response.json()
        
        elements = data.get('elements', [])
        print(f"Found {len(elements)} OSM elements (nodes/ways/relations).")
        
        neighborhoods = []
        for el in elements:
            if 'tags' in el and 'name' in el['tags']:
                neighborhoods.append(f"{el['tags']['name']} ({el['tags'].get('place')}) - {el['type']}")
        
        print("\nNamed Neighborhoods found:")
        for n in sorted(list(set(neighborhoods))):
            print(n)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_osm()
