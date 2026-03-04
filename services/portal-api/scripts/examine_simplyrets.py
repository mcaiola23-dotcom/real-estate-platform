"""
Script to examine SimplyRETS API response structure.
This will help us understand all available fields before designing the schema.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.simplyrets import SimplyRETSService

async def examine_simplyrets_response():
    """Fetch sample properties and examine the response structure."""
    service = SimplyRETSService()
    
    print("=" * 80)
    print("SIMPLYRETS API RESPONSE EXAMINATION")
    print("=" * 80)
    print("\nFetching sample properties from SimplyRETS sandbox...\n")
    
    try:
        # Fetch a few properties to see variety
        print("Attempting API call...")
        raw_response = await service._make_request("/properties", {"limit": 3})
        
        if not raw_response:
            print("❌ No data returned from API")
            print("Response type:", type(raw_response))
            print("Response value:", raw_response)
            return
        
        if not isinstance(raw_response, list):
            print(f"⚠️  Unexpected response type: {type(raw_response)}")
            print(f"Response: {raw_response}")
            return
        
        print(f"✅ Successfully fetched {len(raw_response)} properties\n")
        print("=" * 80)
        print("FULL RAW RESPONSE STRUCTURE (First Property)")
        print("=" * 80)
        
        # Print first property with all fields
        if raw_response:
            first_prop = raw_response[0]
            print("\nComplete JSON structure:")
            print(json.dumps(first_prop, indent=2, default=str))
            
            print("\n" + "=" * 80)
            print("FIELD ANALYSIS")
            print("=" * 80)
            
            # Analyze structure
            print("\n1. TOP-LEVEL FIELDS:")
            for key in sorted(first_prop.keys()):
                value = first_prop[key]
                value_type = type(value).__name__
                if isinstance(value, dict):
                    print(f"   - {key}: {dict} (has {len(value)} sub-fields)")
                elif isinstance(value, list):
                    print(f"   - {key}: {list} (length: {len(value)})")
                else:
                    print(f"   - {key}: {value_type} = {repr(value)[:100]}")
            
            # Analyze nested objects
            if "address" in first_prop:
                print("\n2. ADDRESS OBJECT:")
                for key in sorted(first_prop["address"].keys()):
                    print(f"   - address.{key}: {type(first_prop['address'][key]).__name__} = {repr(first_prop['address'][key])}")
            
            if "geo" in first_prop:
                print("\n3. GEO OBJECT:")
                for key in sorted(first_prop["geo"].keys()):
                    print(f"   - geo.{key}: {type(first_prop['geo'][key]).__name__} = {repr(first_prop['geo'][key])}")
            
            if "property" in first_prop:
                print("\n4. PROPERTY OBJECT:")
                for key in sorted(first_prop["property"].keys()):
                    value = first_prop["property"][key]
                    print(f"   - property.{key}: {type(value).__name__} = {repr(value)}")
            
            if "listAgent" in first_prop:
                print("\n5. LIST AGENT OBJECT:")
                for key in sorted(first_prop["listAgent"].keys()):
                    print(f"   - listAgent.{key}: {type(first_prop['listAgent'][key]).__name__} = {repr(first_prop['listAgent'][key])}")
            
            if "listOffice" in first_prop:
                print("\n6. LIST OFFICE OBJECT:")
                for key in sorted(first_prop["listOffice"].keys()):
                    print(f"   - listOffice.{key}: {type(first_prop['listOffice'][key]).__name__} = {repr(first_prop['listOffice'][key])}")
            
            if "coAgent" in first_prop:
                print("\n7. CO-AGENT OBJECT:")
                for key in sorted(first_prop.get("coAgent", {}).keys()):
                    print(f"   - coAgent.{key}: {type(first_prop['coAgent'][key]).__name__} = {repr(first_prop['coAgent'][key])}")
            
            if "coOffice" in first_prop:
                print("\n8. CO-OFFICE OBJECT:")
                for key in sorted(first_prop.get("coOffice", {}).keys()):
                    print(f"   - coOffice.{key}: {type(first_prop['coOffice'][key]).__name__} = {repr(first_prop['coOffice'][key])}")
            
            if "mls" in first_prop:
                print("\n10. MLS OBJECT:")
                for key in sorted(first_prop["mls"].keys()):
                    print(f"   - mls.{key}: {type(first_prop['mls'][key]).__name__} = {repr(first_prop['mls'][key])}")
            
            if "sales" in first_prop:
                print("\n11. SALES OBJECT:")
                for key in sorted(first_prop["sales"].keys()):
                    value = first_prop["sales"][key]
                    if isinstance(value, dict):
                        print(f"   - sales.{key}: dict with keys: {list(value.keys())}")
                    else:
                        print(f"   - sales.{key}: {type(value).__name__} = {repr(value)}")
            
            if "school" in first_prop:
                print("\n12. SCHOOL OBJECT:")
                for key in sorted(first_prop["school"].keys()):
                    print(f"   - school.{key}: {type(first_prop['school'][key]).__name__} = {repr(first_prop['school'][key])}")
            
            if "tax" in first_prop:
                print("\n13. TAX OBJECT:")
                for key in sorted(first_prop["tax"].keys()):
                    print(f"   - tax.{key}: {type(first_prop['tax'][key]).__name__} = {repr(first_prop['tax'][key])}")
            
            if "association" in first_prop:
                print("\n14. ASSOCIATION OBJECT:")
                for key in sorted(first_prop["association"].keys()):
                    print(f"   - association.{key}: {type(first_prop['association'][key]).__name__} = {repr(first_prop['association'][key])}")
            
            if "parking" in first_prop.get("property", {}):
                print("\n15. PARKING OBJECT (nested in property):")
                parking = first_prop["property"]["parking"]
                for key in sorted(parking.keys()):
                    print(f"   - property.parking.{key}: {type(parking[key]).__name__} = {repr(parking[key])}")
            
            # Check for other nested structures
            other_keys = [k for k in first_prop.keys() if k not in ["address", "geo", "property", "listAgent", "listOffice", "coAgent", "coOffice"]]
            if other_keys:
                print("\n9. OTHER FIELDS:")
                for key in sorted(other_keys):
                    value = first_prop[key]
                    if isinstance(value, (dict, list)):
                        print(f"   - {key}: {type(value).__name__} (complex structure)")
                    else:
                        print(f"   - {key}: {type(value).__name__} = {repr(value)}")
            
            # Show sample of all properties to check for variations
            print("\n" + "=" * 80)
            print("VARIATION ANALYSIS (Checking all fetched properties)")
            print("=" * 80)
            
            all_keys = set()
            for prop in raw_response:
                all_keys.update(prop.keys())
            
            print(f"\nTotal unique top-level fields across all properties: {len(all_keys)}")
            print("\nFields present in all properties:")
            common_keys = set(raw_response[0].keys())
            for prop in raw_response[1:]:
                common_keys &= set(prop.keys())
            for key in sorted(common_keys):
                print(f"   ✓ {key}")
            
            print("\nFields that vary (may be missing in some properties):")
            varying_keys = all_keys - common_keys
            for key in sorted(varying_keys):
                present_count = sum(1 for p in raw_response if key in p)
                print(f"   ⚠ {key} (present in {present_count}/{len(raw_response)} properties)")
        
        print("\n" + "=" * 80)
        print("EXAMINATION COMPLETE")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Error examining SimplyRETS response: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(examine_simplyrets_response())

