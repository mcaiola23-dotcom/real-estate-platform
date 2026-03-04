"""
Test Google Street View API directly for specific parcels
"""

import requests
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

API_KEY = "AIzaSyB1nXOuazIvXiZo8zRkWTW0iL-nawfFLFo"

def test_street_view():
    """Test Street View for specific parcels."""
    db = SessionLocal()
    
    parcels = [
        ("73070-S 006 5208", "53 London Lane, Stamford"),
        ("CT-161-66", "415 Belden Hill Rd, Wilton"),
        ("CT-161-72013", "109 Highfield Rd, Wilton"),
        ("39/41/163", "36 Rilling Ridge, New Canaan (364 Smith Ridge Rd)"),
        ("44/109/144", "34 Braeburn Dr, New Canaan"),
        ("26/22/7", "94 Dabney Rd, New Canaan (194 Greenley Rd)"),
    ]
    
    try:
        for parcel_id, desc in parcels:
            print("=" * 70)
            print(f"{desc}")
            print("=" * 70)
            
            # Get parcel data
            result = db.execute(text("""
                SELECT 
                    address_full,
                    city,
                    state,
                    ST_X(centroid) as lng,
                    ST_Y(centroid) as lat
                FROM parcels
                WHERE parcel_id = :pid
            """), {"pid": parcel_id})
            
            row = result.fetchone()
            if not row:
                print(f"Parcel not found!")
                continue
            
            address_full = row[0]
            city = row[1]
            state = row[2]
            lng = row[3]
            lat = row[4]
            
            # Test with COORDINATES
            print(f"\n1. Testing with COORDINATES: {lat:.6f}, {lng:.6f}")
            metadata_url = f"https://maps.googleapis.com/maps/api/streetview/metadata?location={lat},{lng}&radius=50&key={API_KEY}"
            
            try:
                response = requests.get(metadata_url, timeout=5)
                data = response.json()
                status = data.get("status")
                print(f"   Status: {status}")
                
                if status == "OK":
                    pano_loc = data.get("location", {})
                    heading = pano_loc.get("heading", 0)
                    pano_lat = pano_loc.get("lat")
                    pano_lng = pano_loc.get("lng")
                    print(f"   Pano Location: {pano_lat:.6f}, {pano_lng:.6f}")
                    print(f"   Heading: {heading}")
                    print(f"   ** STREET VIEW AVAILABLE **")
                else:
                    print(f"   ** NOT AVAILABLE (reason: {status}) **")
            except Exception as e:
                print(f"   Error: {e}")
            
            # Test with ADDRESS
            if address_full and city and state:
                full_address = f"{address_full}, {city}, {state}"
                print(f"\n2. Testing with ADDRESS: {full_address}")
                metadata_url = f"https://maps.googleapis.com/maps/api/streetview/metadata?location={full_address}&radius=50&key={API_KEY}"
                
                try:
                    response = requests.get(metadata_url, timeout=5)
                    data = response.json()
                    status = data.get("status")
                    print(f"   Status: {status}")
                    
                    if status == "OK":
                        pano_loc = data.get("location", {})
                        heading = pano_loc.get("heading", 0)
                        pano_lat = pano_loc.get("lat")
                        pano_lng = pano_loc.get("lng")
                        print(f"   Pano Location: {pano_lat:.6f}, {pano_lng:.6f}")
                        print(f"   Heading: {heading}")
                        print(f"   ** STREET VIEW AVAILABLE **")
                    else:
                        print(f"   ** NOT AVAILABLE (reason: {status}) **")
                except Exception as e:
                    print(f"   Error: {e}")
            
            print()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_street_view()















