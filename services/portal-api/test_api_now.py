"""Test API right now."""
import requests
import json
import time

time.sleep(2)  # Wait for server

try:
    response = requests.post(
        "http://localhost:8000/api/search/properties",
        json={
            "towns": ["Stamford"],
            "neighborhoods": ["Westover"],
            "status": ["Off-Market"],
            "page": 1,
            "page_size": 10
        },
        timeout=5
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total results: {data['summary']['total_results']}")
        print(f"First 3 cities: {[r.get('city', 'N/A') for r in data['results'][:3]]}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed: {e}")

