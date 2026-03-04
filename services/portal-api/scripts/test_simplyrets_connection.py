"""Test SimplyRETS connection and fetch sample data."""
import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.simplyrets import SimplyRETSService

async def test_connection():
    """Test SimplyRETS API connection."""
    print("Testing SimplyRETS connection...")
    print("="*80)
    
    service = SimplyRETSService()
    
    try:
        # Fetch sample properties (try without state filter first)
        print("\n1. Fetching sample properties (all states)...")
        result_all = await service.get_properties(limit=10)
        
        properties_all = result_all.get('properties', [])
        total_all = result_all.get('total', 0)
        
        print(f"   ✅ Connection successful!")
        print(f"   📊 Total properties available (all states): {total_all:,}")
        print(f"   📋 Sample properties fetched: {len(properties_all)}")
        
        # Try with CT filter
        print("\n2. Fetching CT properties...")
        result_ct = await service.get_properties(limit=10, state='CT')
        properties_ct = result_ct.get('properties', [])
        total_ct = result_ct.get('total', 0)
        print(f"   📊 Total CT properties: {total_ct:,}")
        
        # Show sample property
        if properties_all:
            print("\n3. Sample property details (first available):")
            prop = properties_all[0]
            address = prop.get('address', {})
            print(f"   Address: {address.get('full', 'N/A')}")
            print(f"   City: {address.get('city', 'N/A')}, State: {address.get('state', 'N/A')}")
            print(f"   Price: ${prop.get('listPrice', 'N/A'):,}" if prop.get('listPrice') else "   Price: N/A")
            print(f"   Bedrooms: {prop.get('property', {}).get('bedrooms', 'N/A')}")
            print(f"   Bathrooms: {prop.get('property', {}).get('bathrooms', 'N/A')}")
        elif properties_ct:
            print("\n3. Sample CT property details:")
            prop = properties_ct[0]
            address = prop.get('address', {})
            print(f"   Address: {address.get('full', 'N/A')}")
            print(f"   City: {address.get('city', 'N/A')}")
            print(f"   Price: ${prop.get('listPrice', 'N/A'):,}" if prop.get('listPrice') else "   Price: N/A")
        
        print("\n" + "="*80)
        print("✅ SimplyRETS connection test PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)

