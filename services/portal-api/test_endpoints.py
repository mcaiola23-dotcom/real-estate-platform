import requests
import time

time.sleep(2)  # Wait for server

print("Testing endpoints...")

# Test health
r = requests.get('http://localhost:8000/health')
print(f"Health: {r.status_code}")

# Test cities
r = requests.get('http://localhost:8000/api/cities/list')
print(f"Cities endpoint: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"  Found {len(data['cities'])} cities")
    print(f"  Sample: {data['cities'][:2]}")
else:
    print(f"  Error: {r.text}")

# Test parcel detail  
r = requests.get('http://localhost:8000/api/map/parcels/0101-0001')
print(f"Parcel endpoint: {r.status_code}")

print("\nDone!")

