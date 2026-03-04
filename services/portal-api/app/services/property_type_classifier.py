"""
Property type classification service for CT GIS parcel data.

Standardizes property types across different towns that use different
classification systems (State_Use codes, Parcel_Type, State_Use_Description).
"""

import re
from typing import Optional, Tuple, Dict, Any

# Property type categories
PROPERTY_TYPE_SINGLE_FAMILY = "SingleFamily"
PROPERTY_TYPE_MULTI_FAMILY = "MultiFamily"
PROPERTY_TYPE_CONDO = "Condo"
PROPERTY_TYPE_COMMERCIAL = "Commercial"
PROPERTY_TYPE_RETAIL = "Retail"
PROPERTY_TYPE_MEDICAL = "Medical"
PROPERTY_TYPE_INDUSTRIAL = "Industrial"
PROPERTY_TYPE_OFFICE = "Office"
PROPERTY_TYPE_VACANT_LAND = "VacantLand"
PROPERTY_TYPE_MIXED_USE = "MixedUse"
PROPERTY_TYPE_OTHER = "Other"

# Multifamily subtypes
MULTIFAMILY_SUBTYPE_2FAMILY = "2Family"
MULTIFAMILY_SUBTYPE_3FAMILY = "3Family"
MULTIFAMILY_SUBTYPE_4FAMILY = "4Family"
MULTIFAMILY_SUBTYPE_5PLUS_FAMILY = "5+Family"

# Commercial subtypes
COMMERCIAL_SUBTYPE_OFFICE = "Office"
COMMERCIAL_SUBTYPE_RETAIL = "Retail"
COMMERCIAL_SUBTYPE_WAREHOUSE = "Warehouse"
COMMERCIAL_SUBTYPE_MEDICAL = "Medical"
COMMERCIAL_SUBTYPE_HOTEL = "Hotel"
COMMERCIAL_SUBTYPE_RESTAURANT = "Restaurant"
COMMERCIAL_SUBTYPE_BANK = "Bank"
COMMERCIAL_SUBTYPE_INDUSTRIAL = "Industrial"
COMMERCIAL_SUBTYPE_MIXED = "MixedUse"

# State Use Code patterns (CT Standard Assessment codes)
# Source: Connecticut State Use Code manual
STATE_USE_PATTERNS = {
    # Residential
    '101': PROPERTY_TYPE_SINGLE_FAMILY,  # Single Family
    '101A': PROPERTY_TYPE_SINGLE_FAMILY,  # Single Family (variant)
    '101W': PROPERTY_TYPE_SINGLE_FAMILY,  # Single Family (variant)
    '1010': PROPERTY_TYPE_SINGLE_FAMILY,  # Single Family (variant)
    '102': PROPERTY_TYPE_MULTI_FAMILY,  # Two Family
    '103': PROPERTY_TYPE_MULTI_FAMILY,  # Three Family
    '104': PROPERTY_TYPE_MULTI_FAMILY,  # Four Family
    '105': PROPERTY_TYPE_MULTI_FAMILY,  # Five or More Family
    '106': PROPERTY_TYPE_MULTI_FAMILY,  # Apartment House
    '107': PROPERTY_TYPE_MULTI_FAMILY,  # Multiple Dwellings
    '108': PROPERTY_TYPE_CONDO,  # Condominium
    '109': PROPERTY_TYPE_MULTI_FAMILY,  # Cooperative
    '110': PROPERTY_TYPE_MULTI_FAMILY,  # Rooming House
    '111': PROPERTY_TYPE_MULTI_FAMILY,  # Boarding House
    
    # Commercial
    '200': PROPERTY_TYPE_COMMERCIAL,  # Commercial
    '201': PROPERTY_TYPE_RETAIL,  # Retail Store
    '202': PROPERTY_TYPE_OFFICE,  # Office Building
    '203': PROPERTY_TYPE_COMMERCIAL,  # Bank
    '204': PROPERTY_TYPE_COMMERCIAL,  # Restaurant
    '205': PROPERTY_TYPE_COMMERCIAL,  # Hotel/Motel
    '206': PROPERTY_TYPE_COMMERCIAL,  # Theater
    '207': PROPERTY_TYPE_COMMERCIAL,  # Garage
    '208': PROPERTY_TYPE_COMMERCIAL,  # Parking Lot
    '209': PROPERTY_TYPE_COMMERCIAL,  # Shopping Center
    
    # Industrial
    '300': PROPERTY_TYPE_INDUSTRIAL,  # Industrial
    '301': PROPERTY_TYPE_INDUSTRIAL,  # Manufacturing
    '302': PROPERTY_TYPE_INDUSTRIAL,  # Warehouse
    '303': PROPERTY_TYPE_INDUSTRIAL,  # Utility
    
    # Medical
    '400': PROPERTY_TYPE_MEDICAL,  # Medical
    '401': PROPERTY_TYPE_MEDICAL,  # Hospital
    '402': PROPERTY_TYPE_MEDICAL,  # Nursing Home
    '403': PROPERTY_TYPE_MEDICAL,  # Clinic
    
    # Vacant Land
    '100': PROPERTY_TYPE_VACANT_LAND,  # Vacant Land
    '1002': PROPERTY_TYPE_VACANT_LAND,  # Vacant Land Unbuildable
}


# Description patterns for property type classification
DESCRIPTION_PATTERNS = {
    # Single Family
    'single family': PROPERTY_TYPE_SINGLE_FAMILY,
    'single fam': PROPERTY_TYPE_SINGLE_FAMILY,
    'sfr': PROPERTY_TYPE_SINGLE_FAMILY,
    'single': PROPERTY_TYPE_SINGLE_FAMILY,
    
    # Multi Family
    'two family': PROPERTY_TYPE_MULTI_FAMILY,
    '2 family': PROPERTY_TYPE_MULTI_FAMILY,
    'three family': PROPERTY_TYPE_MULTI_FAMILY,
    '3 family': PROPERTY_TYPE_MULTI_FAMILY,
    'four family': PROPERTY_TYPE_MULTI_FAMILY,
    '4 family': PROPERTY_TYPE_MULTI_FAMILY,
    'multi family': PROPERTY_TYPE_MULTI_FAMILY,
    'multiple dwelling': PROPERTY_TYPE_MULTI_FAMILY,
    'apartment': PROPERTY_TYPE_MULTI_FAMILY,
    
    # Condo
    'condo': PROPERTY_TYPE_CONDO,
    'condominium': PROPERTY_TYPE_CONDO,
    
    # Commercial
    'commercial': PROPERTY_TYPE_COMMERCIAL,
    'retail': PROPERTY_TYPE_RETAIL,
    'office': PROPERTY_TYPE_OFFICE,
    'business': PROPERTY_TYPE_COMMERCIAL,
    
    # Medical
    'medical': PROPERTY_TYPE_MEDICAL,
    'hospital': PROPERTY_TYPE_MEDICAL,
    'clinic': PROPERTY_TYPE_MEDICAL,
    
    # Industrial
    'industrial': PROPERTY_TYPE_INDUSTRIAL,
    'warehouse': PROPERTY_TYPE_INDUSTRIAL,
    'manufacturing': PROPERTY_TYPE_INDUSTRIAL,
    
    # Vacant
    'vacant': PROPERTY_TYPE_VACANT_LAND,
    'land': PROPERTY_TYPE_VACANT_LAND,
}


def classify_property_type(
    state_use_code: Optional[str] = None,
    state_use_description: Optional[str] = None,
    parcel_type: Optional[str] = None,
    unit_type: Optional[str] = None,
    occupancy: Optional[int] = None,
    square_feet: Optional[int] = None,
    bedrooms: Optional[int] = None
) -> Tuple[str, Optional[str], str, Optional[int]]:
    """
    Classify property type based on CT GIS data.
    
    Args:
        state_use_code: State Use code (e.g., '101', '102', '108')
        state_use_description: State Use description (e.g., 'Single Family', 'Condo')
        parcel_type: Parcel type field (varies by town)
        unit_type: Unit type (for condos)
        occupancy: Occupancy field (may indicate units)
        square_feet: Building square footage
        bedrooms: Number of bedrooms
        
    Returns:
        Tuple of (standardized_property_type, property_subtype, property_type_detail, units)
        - standardized_property_type: Standard category (SingleFamily, MultiFamily, etc.)
        - property_subtype: Subtype (e.g., "2Family", "3Family", "Office", "Retail")
        - property_type_detail: Original description for reference
        - units: Number of units (for multifamily/commercial properties)
    """
    # Normalize inputs
    state_use_code = str(state_use_code).strip() if state_use_code else None
    state_use_description = (state_use_description or '').strip().lower() if state_use_description else ''
    parcel_type = (parcel_type or '').strip().lower() if parcel_type else ''
    unit_type = (unit_type or '').strip().lower() if unit_type else ''
    
    # Build detail string
    detail_parts = []
    if state_use_code:
        detail_parts.append(f"StateUse:{state_use_code}")
    if state_use_description:
        detail_parts.append(state_use_description)
    if parcel_type:
        detail_parts.append(f"ParcelType:{parcel_type}")
    property_type_detail = " | ".join(detail_parts) if detail_parts else None
    
    # Priority 1: Check State Use Code
    if state_use_code:
        # Try exact match first
        if state_use_code in STATE_USE_PATTERNS:
            prop_type = STATE_USE_PATTERNS[state_use_code]
            units, subtype = _extract_units_and_subtype_from_code(
                state_use_code, state_use_description, occupancy, bedrooms, square_feet, prop_type
            )
            return prop_type, subtype, property_type_detail, units
        
        # Try pattern matching (e.g., '101.0' -> '101')
        code_base = re.sub(r'[^0-9]', '', state_use_code)
        if code_base and code_base in STATE_USE_PATTERNS:
            prop_type = STATE_USE_PATTERNS[code_base]
            units, subtype = _extract_units_and_subtype_from_code(
                code_base, state_use_description, occupancy, bedrooms, square_feet, prop_type
            )
            return prop_type, subtype, property_type_detail, units
    
    # Priority 2: Check State Use Description
    if state_use_description:
        description_lower = state_use_description.lower()
        for pattern, prop_type in DESCRIPTION_PATTERNS.items():
            if pattern in description_lower:
                units, subtype = _extract_units_and_subtype_from_description(
                    description_lower, occupancy, bedrooms, square_feet, prop_type
                )
                return prop_type, subtype, property_type_detail, units
    
    # Priority 3: Check Parcel Type (less reliable, varies by town)
    if parcel_type:
        if 'condo' in parcel_type or 'condominium' in parcel_type:
            return PROPERTY_TYPE_CONDO, None, property_type_detail, 1
        if 'single' in parcel_type:
            return PROPERTY_TYPE_SINGLE_FAMILY, None, property_type_detail, None
        if 'multi' in parcel_type or 'multiple' in parcel_type:
            units, subtype = _extract_units_and_subtype_from_description(
                parcel_type, occupancy, bedrooms, square_feet, PROPERTY_TYPE_MULTI_FAMILY
            )
            return PROPERTY_TYPE_MULTI_FAMILY, subtype, property_type_detail, units
    
    # Priority 4: Check Unit Type (for condos)
    if unit_type:
        if 'condo' in unit_type or 'unit' in unit_type:
            return PROPERTY_TYPE_CONDO, None, property_type_detail, 1
    
    # Priority 5: Heuristics based on building characteristics
    if square_feet and bedrooms:
        # Large building with many bedrooms might be multifamily
        if square_feet > 5000 and bedrooms > 5:
            units, subtype = _determine_multifamily_subtype(None, bedrooms, square_feet)
            return PROPERTY_TYPE_MULTI_FAMILY, subtype, property_type_detail, units
        # Small building is likely single family
        if square_feet < 3000 and bedrooms <= 4:
            return PROPERTY_TYPE_SINGLE_FAMILY, None, property_type_detail, None
    
    # Default: Other
    return PROPERTY_TYPE_OTHER, None, property_type_detail, None


def _extract_units_and_subtype_from_code(
    code: str,
    description: str,
    occupancy: Optional[int],
    bedrooms: Optional[int],
    square_feet: Optional[int],
    property_type: str
) -> Tuple[Optional[int], Optional[str]]:
    """Extract number of units and subtype from State Use code."""
    units = None
    subtype = None
    
    # Multi-family codes
    if code == '102':
        units = 2
        subtype = MULTIFAMILY_SUBTYPE_2FAMILY
    elif code == '103':
        units = 3
        subtype = MULTIFAMILY_SUBTYPE_3FAMILY
    elif code == '104':
        units = 4
        subtype = MULTIFAMILY_SUBTYPE_4FAMILY
    elif code in ['105', '106', '107', '109']:
        # Five or more - try to extract from description/occupancy
        units, subtype = _extract_multifamily_details(
            description, occupancy, bedrooms, square_feet
        )
    elif code == '108':
        # Condo
        units = 1
        subtype = None
    
    # Commercial codes - determine subtype
    elif property_type in [PROPERTY_TYPE_COMMERCIAL, PROPERTY_TYPE_RETAIL, 
                          PROPERTY_TYPE_OFFICE, PROPERTY_TYPE_INDUSTRIAL, PROPERTY_TYPE_MEDICAL]:
        subtype = _classify_commercial_subtype(code, description)
        units = occupancy if occupancy and occupancy > 1 else None
    
    return units, subtype


def _extract_units_and_subtype_from_description(
    description: str,
    occupancy: Optional[int],
    bedrooms: Optional[int],
    square_feet: Optional[int],
    property_type: str
) -> Tuple[Optional[int], Optional[str]]:
    """Extract number of units and subtype from description text."""
    if property_type not in [PROPERTY_TYPE_MULTI_FAMILY, PROPERTY_TYPE_CONDO, 
                            PROPERTY_TYPE_COMMERCIAL, PROPERTY_TYPE_RETAIL]:
        return None, None
    
    description_lower = description.lower()
    
    # Extract explicit numbers (e.g., "2 family", "3-family", "4 unit")
    unit_patterns = [
        (r'(\d+)\s*family', lambda n: _determine_multifamily_subtype(int(n), bedrooms, square_feet)),
        (r'(\d+)\s*unit', lambda n: _determine_multifamily_subtype(int(n), bedrooms, square_feet)),
        (r'(\d+)\s*apartment', lambda n: _determine_multifamily_subtype(int(n), bedrooms, square_feet)),
        (r'(\d+)\s*dwelling', lambda n: _determine_multifamily_subtype(int(n), bedrooms, square_feet)),
    ]
    
    for pattern, subtype_func in unit_patterns:
        match = re.search(pattern, description_lower)
        if match:
            units_count = int(match.group(1))
            if 1 <= units_count <= 100:  # Reasonable range
                units, subtype = subtype_func(units_count)
                return units, subtype
    
    # Use occupancy field if available
    if occupancy and occupancy > 1:
        if property_type == PROPERTY_TYPE_MULTI_FAMILY:
            units, subtype = _determine_multifamily_subtype(occupancy, bedrooms, square_feet)
            return units, subtype
    
    # Estimate from bedrooms/square footage for large multifamily
    if property_type == PROPERTY_TYPE_MULTI_FAMILY:
        if bedrooms and bedrooms > 10:
            # Estimate: ~2-3 bedrooms per unit
            estimated_units = max(2, bedrooms // 3)
            units = min(estimated_units, 50)
            _, subtype = _determine_multifamily_subtype(units, bedrooms, square_feet)
            return units, subtype
        if square_feet and square_feet > 10000:
            # Large building, estimate units
            estimated_units = max(2, square_feet // 1000)
            units = min(estimated_units, 50)
            _, subtype = _determine_multifamily_subtype(units, bedrooms, square_feet)
            return units, subtype
    
    # Commercial property subtypes
    if property_type in [PROPERTY_TYPE_COMMERCIAL, PROPERTY_TYPE_RETAIL]:
        subtype = _classify_commercial_subtype(None, description)
        return occupancy if occupancy and occupancy > 1 else None, subtype
    
    return None, None


def _determine_multifamily_subtype(
    units: Optional[int],
    bedrooms: Optional[int],
    square_feet: Optional[int]
) -> Tuple[Optional[int], Optional[str]]:
    """Determine multifamily subtype and units."""
    if not units:
        return None, None
    
    if units == 2:
        return 2, MULTIFAMILY_SUBTYPE_2FAMILY
    elif units == 3:
        return 3, MULTIFAMILY_SUBTYPE_3FAMILY
    elif units == 4:
        return 4, MULTIFAMILY_SUBTYPE_4FAMILY
    elif units >= 5:
        return units, MULTIFAMILY_SUBTYPE_5PLUS_FAMILY
    else:
        return units, None


def _extract_multifamily_details(
    description: str,
    occupancy: Optional[int],
    bedrooms: Optional[int],
    square_feet: Optional[int]
) -> Tuple[Optional[int], Optional[str]]:
    """Extract multifamily details from description and occupancy."""
    description_lower = (description or '').lower()
    
    # Try to extract from description
    unit_patterns = [
        r'(\d+)\s*family',
        r'(\d+)\s*unit',
        r'(\d+)\s*apartment',
        r'(\d+)\s*dwelling',
    ]
    
    for pattern in unit_patterns:
        match = re.search(pattern, description_lower)
        if match:
            units = int(match.group(1))
            if 2 <= units <= 100:
                _, subtype = _determine_multifamily_subtype(units, bedrooms, square_feet)
                return units, subtype
    
    # Use occupancy if available
    if occupancy and occupancy >= 2:
        _, subtype = _determine_multifamily_subtype(occupancy, bedrooms, square_feet)
        return occupancy, subtype
    
    # Estimate from building characteristics
    if bedrooms and bedrooms > 10:
        estimated_units = max(5, bedrooms // 3)
        _, subtype = _determine_multifamily_subtype(estimated_units, bedrooms, square_feet)
        return estimated_units, subtype
    
    if square_feet and square_feet > 10000:
        estimated_units = max(5, square_feet // 1200)  # Rough estimate
        _, subtype = _determine_multifamily_subtype(estimated_units, bedrooms, square_feet)
        return estimated_units, subtype
    
    # Default to 5+ if we can't determine
    return None, MULTIFAMILY_SUBTYPE_5PLUS_FAMILY


def _classify_commercial_subtype(
    code: Optional[str],
    description: Optional[str]
) -> Optional[str]:
    """Classify commercial property subtype."""
    if not description:
        description = ''
    
    description_lower = description.lower()
    
    # Check description patterns first (more specific)
    if any(word in description_lower for word in ['office', 'offices', 'professional']):
        return COMMERCIAL_SUBTYPE_OFFICE
    if any(word in description_lower for word in ['retail', 'store', 'shop', 'shopping']):
        return COMMERCIAL_SUBTYPE_RETAIL
    if any(word in description_lower for word in ['warehouse', 'storage', 'distribution']):
        return COMMERCIAL_SUBTYPE_WAREHOUSE
    if any(word in description_lower for word in ['medical', 'hospital', 'clinic', 'health']):
        return COMMERCIAL_SUBTYPE_MEDICAL
    if any(word in description_lower for word in ['hotel', 'motel', 'lodging']):
        return COMMERCIAL_SUBTYPE_HOTEL
    if any(word in description_lower for word in ['restaurant', 'dining', 'cafe', 'food']):
        return COMMERCIAL_SUBTYPE_RESTAURANT
    if any(word in description_lower for word in ['bank', 'financial', 'credit union']):
        return COMMERCIAL_SUBTYPE_BANK
    if any(word in description_lower for word in ['industrial', 'manufacturing', 'factory']):
        return COMMERCIAL_SUBTYPE_INDUSTRIAL
    
    # Check State Use codes
    if code:
        code_base = re.sub(r'[^0-9]', '', str(code))
        if code_base.startswith('20'):
            if code_base in ['201', '201V']:
                return COMMERCIAL_SUBTYPE_RETAIL
            elif code_base == '202':
                return COMMERCIAL_SUBTYPE_OFFICE
            elif code_base == '203':
                return COMMERCIAL_SUBTYPE_BANK
            elif code_base == '204':
                return COMMERCIAL_SUBTYPE_RESTAURANT
            elif code_base == '205':
                return COMMERCIAL_SUBTYPE_HOTEL
            elif code_base == '209':
                return COMMERCIAL_SUBTYPE_RETAIL  # Shopping center
        elif code_base.startswith('30'):
            if code_base == '302':
                return COMMERCIAL_SUBTYPE_WAREHOUSE
            else:
                return COMMERCIAL_SUBTYPE_INDUSTRIAL
        elif code_base.startswith('40'):
            return COMMERCIAL_SUBTYPE_MEDICAL
    
    return None  # No specific subtype identified


def classify_from_properties(properties: Dict[str, Any]) -> Tuple[str, Optional[str], str, Optional[int]]:
    """
    Convenience method to classify from a properties dictionary.
    
    Args:
        properties: Dictionary with CT GIS property fields
        
    Returns:
        Tuple of (standardized_property_type, property_subtype, property_type_detail, units)
    """
    return classify_property_type(
        state_use_code=properties.get('State_Use'),
        state_use_description=properties.get('State_Use_Description'),
        parcel_type=properties.get('Parcel_Type'),
        unit_type=properties.get('Unit_Type'),
        occupancy=properties.get('Occupancy'),
        square_feet=properties.get('Living_Area'),
        bedrooms=properties.get('Number_of_Bedroom')
    )

