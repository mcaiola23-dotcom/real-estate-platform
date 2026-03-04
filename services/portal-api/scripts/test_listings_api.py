"""
Test the listings API endpoints.
"""

import requests
import json
from time import sleep

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint."""
    print("\n" + "=" * 80)
    print("🏥 Testing Health Endpoint")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_listings():
    """Test get listings endpoint."""
    print("\n" + "=" * 80)
    print("📋 Testing GET /listings")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/listings", params={
            "page": 1,
            "page_size": 5
        })
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nTotal Listings: {data['total']}")
            print(f"Page: {data['page']}/{data['total_pages']}")
            print(f"\nSample Listings:")
            
            for listing in data['listings'][:3]:
                print(f"\n  {listing['listing_id_str']}:")
                print(f"    Address: {listing['address_full']}, {listing['city']}")
                print(f"    Status: {listing['status']}")
                print(f"    Price: ${listing['list_price']:,.0f}")
                print(f"    Beds/Baths: {listing['bedrooms']}BR / {listing['bathrooms']}BA")
                print(f"    Sqft: {listing['square_feet']}")
        else:
            print(f"Response: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_listing_by_id():
    """Test get single listing endpoint."""
    print("\n" + "=" * 80)
    print("🏠 Testing GET /listings/{id}")
    print("=" * 80)
    
    try:
        # First get a listing ID
        response = requests.get(f"{BASE_URL}/listings", params={"page": 1, "page_size": 1})
        if response.status_code != 200:
            print("❌ Could not fetch listings")
            return False
        
        listing_id = response.json()['listings'][0]['listing_id']
        
        # Now get the full listing
        response = requests.get(f"{BASE_URL}/listings/{listing_id}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            listing = response.json()
            print(f"\n✓ Listing Details:")
            print(f"  MLS ID: {listing['listing_id_str']}")
            print(f"  Address: {listing['address_full']}, {listing['city']}, {listing['state']} {listing['zip_code']}")
            print(f"  Status: {listing['status']}")
            print(f"  Price: ${listing['list_price']:,.0f}")
            print(f"  Property Type: {listing['property_type']}")
            print(f"  Beds/Baths: {listing['bedrooms']}BR / {listing['bathrooms']}BA")
            print(f"  Square Feet: {listing['square_feet']:,}")
            print(f"  Lot Size: {listing['lot_size']}")
            print(f"  Year Built: {listing['year_built']}")
            print(f"  Photos: {len(listing['photos'])} photos")
            
            if listing.get('agent'):
                agent = listing['agent']
                print(f"\n  Agent: {agent['first_name']} {agent['last_name']}")
                print(f"  Email: {agent['email']}")
                print(f"  Phone: {agent['office_phone']}")
            
            if listing.get('office'):
                office = listing['office']
                print(f"\n  Office: {office['name']}")
            
            if listing.get('public_remarks'):
                print(f"\n  Description:")
                print(f"  {listing['public_remarks'][:200]}...")
        else:
            print(f"Response: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_filter_by_city():
    """Test filtering by city."""
    print("\n" + "=" * 80)
    print("🌆 Testing Filter by City")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/listings", params={
            "city": "Greenwich",
            "page_size": 5
        })
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nGreenwich Listings: {data['total']}")
            
            for listing in data['listings'][:3]:
                print(f"  - {listing['address_full']}, {listing['city']} - ${listing['list_price']:,.0f}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_stats():
    """Test stats endpoint."""
    print("\n" + "=" * 80)
    print("📊 Testing Stats Endpoint")
    print("=" * 80)
    
    try:
        response = requests.get(f"{BASE_URL}/listings/stats/summary")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"\n✓ Statistics:")
            print(f"  Total Listings: {stats['total_listings']}")
            print(f"  Active: {stats['active_listings']}")
            print(f"  Pending: {stats['pending_listings']}")
            print(f"  Sold: {stats['sold_listings']}")
            
            price_stats = stats['price_stats']
            print(f"\n  Price Range (Active):")
            print(f"    Min: ${price_stats['min']:,.0f}")
            print(f"    Max: ${price_stats['max']:,.0f}")
            print(f"    Avg: ${price_stats['avg']:,.0f}")
            
            print(f"\n  Top Cities:")
            for city in stats['top_cities'][:5]:
                print(f"    {city['city']}: {city['count']} listings")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 80)
    print("🧪 LISTINGS API TEST SUITE")
    print("=" * 80)
    print("\nWaiting for server to start...")
    sleep(3)
    
    tests = [
        ("Health Check", test_health),
        ("Get Listings", test_get_listings),
        ("Get Single Listing", test_get_listing_by_id),
        ("Filter by City", test_filter_by_city),
        ("Statistics", test_stats),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {status}: {test_name}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✨ All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} tests failed")


if __name__ == "__main__":
    main()

