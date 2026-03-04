"""Test parcel detail endpoint with real data"""
from app.db import SessionLocal
from app.models.parcel import Parcel
import requests
import urllib.parse

db = SessionLocal()

# Get a few different parcels to test
parcels = db.query(Parcel.parcel_id, Parcel.address_full, Parcel.city).limit(5).all()

print('Testing parcel detail endpoints:')
print('=' * 80)

for p in parcels:
    # Test with URL encoding (for slashes)
    encoded_id = urllib.parse.quote(p.parcel_id, safe='')
    url = f'http://localhost:8000/api/map/parcels/{encoded_id}'
    
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            status = 'OK'
        else:
            status = f'ERROR {r.status_code}'
    except Exception as e:
        status = f'EXCEPTION: {str(e)[:40]}'
        r = None
    
    print(f'Parcel ID: {p.parcel_id:20} | City: {p.city:15} | Status: {status}')
    print(f'  URL: {url}')
    
    if r and r.status_code != 200:
        print(f'  Response: {r.text[:150]}')
    print()

db.close()

