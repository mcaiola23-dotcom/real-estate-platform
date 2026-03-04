"""Quick test of the fixed API."""
import requests
import json
import time

# Wait for server to start
print("Waiting for backend to start...")
time.sleep(5)

API_BASE = "http://localhost:8000"

print("\n" + "="*60)
print("TESTING WESTOVER OFF-MARKET SEARCH")
print("="*60)

payload = {
    "towns": ["Stamford"],
    "neighborhoods": ["Westover"],
    "status": ["Off-Market"],
    "page": 1,
    "page_size": 10
}

try:
    response = requests.post(
        f"{API_BASE}/api/search/properties",
        json=payload,
        timeout=10
    )
    
    print(f"\n✓ Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        total = data['summary']['total_results']
        print(f"✓ Total results: {total}")
        
        if total > 0:
            print(f"✓ First 3 results:")
            for i, prop in enumerate(data['results'][:3]):
                print(f"   {i+1}. {prop.get('address_full', 'N/A')} - {prop.get('city', 'N/A')}")
            
            if data['results'][0].get('city') == 'Stamford':
                print("\n🎉 SUCCESS! Results are from Stamford!")
            else:
                print(f"\n❌ FAIL! Results are from {data['results'][0].get('city')}, not Stamford!")
        else:
            print("\n❌ FAIL! No results returned!")
    else:
        print(f"❌ Error: {response.text}")
        
except Exception as e:
    print(f"❌ Connection error: {e}")
    print("   Make sure backend is running!")

print("="*60)

