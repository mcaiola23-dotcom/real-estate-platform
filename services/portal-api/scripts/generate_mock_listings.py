"""
Generate mock SimplyRETS listings that match real CT GIS parcels.

This script:
1. Queries the database for 100+ diverse parcels from Fairfield County
2. Generates realistic SimplyRETS-format mock data
3. Creates mock agents and offices
4. Imports everything into the database with proper relationships
"""

import sys
import os
from pathlib import Path
from datetime import datetime, date, timedelta
from decimal import Decimal
import random
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text, select
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models.parcel import Parcel
from app.models.listing import Listing
from app.models.agent import Agent
from app.models.office import Office


# Fairfield County towns with typical price multipliers
FAIRFIELD_TOWNS = {
    'Greenwich': 2.5,      # Very high-end
    'Darien': 2.3,
    'New Canaan': 2.2,
    'Westport': 2.1,
    'Wilton': 1.8,
    'Ridgefield': 1.7,
    'Weston': 2.0,
    'Fairfield': 1.6,
    'Easton': 1.7,
    'Stamford': 1.5,
    'Norwalk': 1.3,
    'Trumbull': 1.2,
    'Monroe': 1.1,
    'Shelton': 1.0,
    'Bridgeport': 0.7,
    'Stratford': 0.9,
}

# Realistic agent names for CT
AGENT_NAMES = [
    ("Jennifer", "Thompson"), ("Michael", "Sullivan"), ("Sarah", "Anderson"),
    ("Robert", "Martinez"), ("Emily", "Johnson"), ("David", "Williams"),
    ("Lisa", "Brown"), ("James", "Davis"), ("Maria", "Garcia"),
    ("Christopher", "Rodriguez"), ("Amanda", "Wilson"), ("Matthew", "Moore"),
    ("Jessica", "Taylor"), ("Daniel", "Thomas"), ("Ashley", "Jackson"),
    ("Joshua", "White"), ("Michelle", "Harris"), ("Andrew", "Martin"),
    ("Stephanie", "Lee"), ("Brian", "Clark"), ("Nicole", "Lewis"),
    ("Kevin", "Walker"), ("Elizabeth", "Hall"), ("Ryan", "Allen"),
    ("Rachel", "Young"), ("Justin", "King"), ("Melissa", "Wright"),
    ("Brandon", "Lopez"), ("Heather", "Hill"), ("Eric", "Green"),
]

# Realistic office names for CT
OFFICE_NAMES = [
    "William Raveis Real Estate",
    "Berkshire Hathaway HomeServices New England Properties",
    "Coldwell Banker Realty",
    "Compass Connecticut",
    "Halstead Real Estate",
    "Sotheby's International Realty",
    "ERA Key Realty Services",
    "Keller Williams Prestige Properties",
    "RE/MAX Right Choice",
    "Douglas Elliman Real Estate",
    "Higgins Group Private Brokerage",
    "Realty Seven",
    "David Barbour Real Estate",
    "Riverside Avenue Group",
    "Prominent Properties Sotheby's",
]

# Property descriptions templates
DESCRIPTION_TEMPLATES = {
    'SingleFamily': [
        "Stunning {style} home featuring {beds} bedrooms and {baths} bathrooms. Beautifully maintained with modern updates throughout. The spacious layout includes {features}. Perfect for families seeking quality and comfort in a prime location.",
        "Welcome to this exceptional {style} residence with {beds} bedrooms and {baths} bathrooms. This property offers {features}. Ideally located in desirable {town}, close to shopping, dining, and top-rated schools.",
        "Charming {style} home in the heart of {town}. Features {beds} bedrooms, {baths} bathrooms, and {features}. Move-in ready with recent updates. Don't miss this opportunity!",
        "Meticulously maintained {style} featuring {beds} bedrooms and {baths} bathrooms. Highlights include {features}. Situated on a lovely lot in a sought-after neighborhood.",
    ],
    'Condo': [
        "Luxurious {beds}-bedroom, {baths}-bathroom condominium with modern finishes and stunning views. Features include {features}. Building amenities and convenient location make this an ideal choice.",
        "Spacious and bright {beds}-bedroom condo in prime {town} location. This unit offers {features}. Low maintenance living with all the conveniences you need.",
        "Contemporary condo living at its finest! This {beds}-bedroom, {baths}-bathroom unit features {features}. Perfectly located near transportation and shopping.",
    ],
    'MultiFamily': [
        "Excellent investment opportunity! This {style} multi-family property features {units} units with strong rental history. Each unit includes {features}. Great cash flow potential.",
        "Well-maintained multi-family with {units} units. Perfect for owner-occupant or investor. Property includes {features}. Convenient location near amenities.",
    ],
    'Commercial': [
        "Prime commercial property in {town}! {sqft} sq ft of flexible space suitable for various uses. Features include {features}. High visibility location with excellent traffic.",
        "Exceptional commercial opportunity with {sqft} sq ft. Property offers {features}. Ideal for retail, office, or mixed-use. Don't miss this investment opportunity!",
    ],
}

PROPERTY_FEATURES = [
    "hardwood floors, granite counters, stainless appliances",
    "open floor plan, chef's kitchen, master suite",
    "finished basement, deck, updated bathrooms",
    "central air, gas heat, attached garage",
    "fireplace, crown molding, built-ins",
    "landscaped yard, patio, shed",
    "eat-in kitchen, dining room, living room with fireplace",
    "walk-in closets, spa-like bathrooms, laundry room",
    "new windows, roof, HVAC system",
    "hardwood throughout, modern kitchen, luxurious master",
]

STYLES = [
    "Colonial", "Contemporary", "Ranch", "Cape Cod", "Victorian",
    "Tudor", "Split Level", "Craftsman", "Traditional", "Modern",
]


def generate_mls_id() -> str:
    """Generate a mock MLS ID."""
    return f"MOCK{random.randint(1000000, 9999999)}"


def generate_listing_dates(status: str) -> Dict[str, date]:
    """Generate realistic listing dates based on status."""
    today = date.today()
    
    if status == "Active":
        # Listed within last 90 days
        days_ago = random.randint(1, 90)
        list_date = today - timedelta(days=days_ago)
        return {
            'list_date': list_date,
            'contract_date': None,
            'sold_date': None,
            'days_on_market': days_ago,
        }
    elif status == "Pending":
        # Listed 30-120 days ago, went pending recently
        days_ago = random.randint(30, 120)
        list_date = today - timedelta(days=days_ago)
        contract_date = today - timedelta(days=random.randint(1, 14))
        return {
            'list_date': list_date,
            'contract_date': contract_date,
            'sold_date': None,
            'days_on_market': days_ago,
        }
    else:  # Sold
        # Listed and sold in past year
        days_ago = random.randint(90, 365)
        list_date = today - timedelta(days=days_ago)
        sold_date = list_date + timedelta(days=random.randint(14, 180))
        return {
            'list_date': list_date,
            'contract_date': sold_date - timedelta(days=random.randint(7, 21)),
            'sold_date': sold_date,
            'days_on_market': (sold_date - list_date).days,
        }


def calculate_realistic_price(parcel: Parcel, town_multiplier: float) -> Decimal:
    """Calculate realistic listing price based on parcel data."""
    base_price = 400000  # Base price for Fairfield County
    
    # Adjust by town
    price = base_price * town_multiplier
    
    # Adjust by square footage if available
    if parcel.square_feet:
        # $200-400 per sqft depending on town
        price_per_sqft = 200 + (town_multiplier * 50)
        price = parcel.square_feet * price_per_sqft
    
    # Adjust by bedrooms if available
    if parcel.bedrooms:
        price *= (1 + (parcel.bedrooms - 3) * 0.1)
    
    # Adjust by lot size
    if parcel.lot_size_acres:
        if parcel.lot_size_acres > 1:
            price *= (1 + (float(parcel.lot_size_acres) - 1) * 0.1)
    
    # Adjust by property type
    if parcel.property_type == 'Commercial':
        price *= 1.5
    elif parcel.property_type == 'MultiFamily':
        price *= 1.3
    elif parcel.property_type == 'Condo':
        price *= 0.8
    
    # Add some randomness (+/- 10%)
    price *= random.uniform(0.9, 1.1)
    
    # Round to nearest $10,000
    price = round(price / 10000) * 10000
    
    return Decimal(str(price))


def generate_property_description(parcel: Parcel, style: str, features: str) -> str:
    """Generate a realistic property description."""
    prop_type = parcel.property_type or 'SingleFamily'
    
    templates = DESCRIPTION_TEMPLATES.get(prop_type, DESCRIPTION_TEMPLATES['SingleFamily'])
    template = random.choice(templates)
    
    beds = parcel.bedrooms or random.randint(2, 5)
    baths = float(parcel.bathrooms) if parcel.bathrooms else random.uniform(1.5, 3.5)
    sqft = parcel.square_feet or random.randint(1500, 4000)
    units = parcel.units or 2
    
    description = template.format(
        style=style,
        beds=beds,
        baths=f"{baths:.1f}",
        features=features,
        town=parcel.city,
        sqft=f"{sqft:,}",
        units=units,
    )
    
    return description


def create_mock_agents_and_offices(db: Session) -> tuple[List[Agent], List[Office]]:
    """Create mock agents and offices."""
    print("\n🏢 Creating mock agents and offices...")
    
    # Create offices
    offices = []
    for i, office_name in enumerate(OFFICE_NAMES, 1):
        office = Office(
            office_id=f"OFF{i:03d}",
            name=office_name,
            serving_name=office_name,
            email=f"info@{office_name.lower().replace(' ', '').replace('.', '')}office.com",
            office_phone=f"203-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
        )
        offices.append(office)
        db.add(office)
    
    # Create agents
    agents = []
    for i, (first_name, last_name) in enumerate(AGENT_NAMES, 1):
        office = random.choice(offices)
        agent = Agent(
            agent_id=f"AGT{i:03d}",
            first_name=first_name,
            last_name=last_name,
            office_mls_id=office.office_id,
            email=f"{first_name.lower()}.{last_name.lower()}@{office.name.lower().replace(' ', '').replace('.', '')}realty.com",
            office_phone=office.office_phone,
            cell_phone=f"203-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
        )
        agents.append(agent)
        db.add(agent)
    
    db.commit()
    print(f"✅ Created {len(agents)} agents and {len(offices)} offices")
    
    return agents, offices


def get_diverse_parcels(db: Session, target_count: int = 120) -> List[Parcel]:
    """Query database for diverse parcels with realistic property type distribution."""
    print(f"\n🔍 Querying database for {target_count} diverse parcels...")
    
    parcels = []
    
    # First, check which towns actually have data
    result = db.execute(text("""
        SELECT DISTINCT city 
        FROM parcels 
        WHERE address_full IS NOT NULL 
        AND address_full != ''
        ORDER BY city
    """))
    available_towns = [row[0] for row in result if row[0] in FAIRFIELD_TOWNS]
    
    print(f"  Found {len(available_towns)} available towns")
    
    # Define realistic property type distribution
    property_type_targets = {
        'SingleFamily': int(target_count * 0.70),  # 70% - 84 listings
        'Condo': int(target_count * 0.10),         # 10% - 12 listings
        'MultiFamily': int(target_count * 0.08),   # 8%  - 10 listings
        'Commercial': int(target_count * 0.08),    # 8%  - 10 listings
        'VacantLand': int(target_count * 0.03),    # 3%  - 4 listings
    }
    
    print(f"\n  Target distribution:")
    for ptype, count in property_type_targets.items():
        print(f"    {ptype}: {count} listings")
    
    # Get parcels for each property type across all towns
    for property_type, count in property_type_targets.items():
        per_town = max(1, count // len(available_towns))
        
        for town in available_towns:
            if len([p for p in parcels if p.property_type == property_type]) >= count:
                break  # Already have enough of this type
            
            # Build query based on property type
            query = select(Parcel).where(Parcel.city == town)
            query = query.where(Parcel.address_full.isnot(None))
            query = query.where(Parcel.address_full != '')
            
            if property_type == 'VacantLand':
                # For vacant land, look for parcels without buildings
                query = query.where(
                    (Parcel.square_feet.is_(None)) | (Parcel.square_feet == 0)
                )
                query = query.where(Parcel.property_type.in_(['VacantLand', 'Other']))
            else:
                # For all other types, require building data
                query = query.where(Parcel.square_feet.isnot(None))
                query = query.where(Parcel.square_feet > 500)
                
                if property_type == 'SingleFamily':
                    query = query.where(Parcel.property_type == 'SingleFamily')
                elif property_type == 'Condo':
                    query = query.where(Parcel.property_type == 'Condo')
                elif property_type == 'MultiFamily':
                    query = query.where(Parcel.property_type == 'MultiFamily')
                elif property_type == 'Commercial':
                    query = query.where(Parcel.property_type.in_(['Commercial', 'Retail', 'Industrial', 'Office']))
            
            query = query.order_by(Parcel.parcel_id).limit(per_town)
            
            town_parcels = db.execute(query).scalars().all()
            parcels.extend(town_parcels)
            
            if len(town_parcels) > 0:
                print(f"  📍 {town}: +{len(town_parcels)} {property_type}")
    
    # Shuffle to mix towns
    random.shuffle(parcels)
    
    # Verify we have enough, if not fill with SingleFamily
    if len(parcels) < target_count:
        print(f"\n  ⚠️  Only found {len(parcels)} parcels, filling remaining with SingleFamily...")
        needed = target_count - len(parcels)
        
        for town in available_towns:
            if len(parcels) >= target_count:
                break
            
            query = (
                select(Parcel)
                .where(Parcel.city == town)
                .where(Parcel.address_full.isnot(None))
                .where(Parcel.address_full != '')
                .where(Parcel.square_feet.isnot(None))
                .where(Parcel.square_feet > 500)
                .where(Parcel.property_type == 'SingleFamily')
                .order_by(Parcel.parcel_id)
                .limit(needed // len(available_towns) + 1)
            )
            
            extra = db.execute(query).scalars().all()
            parcels.extend(extra)
    
    # Take first target_count
    parcels = parcels[:target_count]
    
    # Report actual distribution
    print(f"\n✅ Selected {len(parcels)} parcels")
    print(f"\n  Actual distribution:")
    type_counts = {}
    for p in parcels:
        ptype = p.property_type or 'Unknown'
        type_counts[ptype] = type_counts.get(ptype, 0) + 1
    
    for ptype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(parcels)) * 100
        print(f"    {ptype}: {count} ({percentage:.1f}%)")
    
    return parcels


def create_mock_listing(
    parcel: Parcel,
    agents: List[Agent],
    offices: List[Office],
    listing_num: int,
) -> Listing:
    """Create a mock listing from a parcel."""
    
    # Get town multiplier
    town_multiplier = FAIRFIELD_TOWNS.get(parcel.city, 1.0)
    
    # Generate MLS identifiers
    mls_id = listing_num
    listing_id_str = generate_mls_id()
    
    # Determine status (mostly Active for testing)
    status_weights = [('Active', 70), ('Pending', 15), ('Sold', 15)]
    status = random.choices(
        [s[0] for s in status_weights],
        weights=[s[1] for s in status_weights]
    )[0]
    
    # Generate dates
    dates = generate_listing_dates(status)
    
    # Calculate prices
    list_price = calculate_realistic_price(parcel, town_multiplier)
    original_list_price = list_price * Decimal(random.uniform(0.98, 1.05))
    
    sold_price = None
    if status == "Sold":
        # Sold price typically 95-102% of list price
        sold_price = list_price * Decimal(random.uniform(0.95, 1.02))
    
    # Select random agent and office
    agent = random.choice(agents)
    office = random.choice(offices)
    
    # Generate property details
    style = random.choice(STYLES)
    features = random.choice(PROPERTY_FEATURES)
    description = generate_property_description(parcel, style, features)
    
    # Use parcel data or generate realistic values
    bedrooms = parcel.bedrooms or random.randint(2, 5)
    
    if parcel.bathrooms:
        bathrooms = float(parcel.bathrooms)
        baths_full = int(bathrooms)
        baths_half = 1 if bathrooms % 1 >= 0.5 else 0
    else:
        baths_full = random.randint(1, 3)
        baths_half = random.choice([0, 1])
        bathrooms = baths_full + (baths_half * 0.5)
    
    square_feet = parcel.square_feet or random.randint(1200, 4500)
    year_built = parcel.year_built or random.randint(1950, 2020)
    
    # Lot size
    lot_size_acres = float(parcel.lot_size_acres) if parcel.lot_size_acres else random.uniform(0.2, 2.0)
    lot_size_sqft = int(lot_size_acres * 43560)
    
    # Generate mock photo URLs (placeholders)
    num_photos = random.randint(10, 30)
    photos = [
        f"https://via.placeholder.com/1200x800?text=Photo+{i+1}" 
        for i in range(num_photos)
    ]
    
    # Extract latitude and longitude from parcel centroid
    # Note: We'll need to extract this from the PostGIS POINT
    # For now, we'll use approximate coordinates for Fairfield County
    lat = Decimal("41.2") + Decimal(random.uniform(-0.3, 0.3))
    lon = Decimal("-73.4") + Decimal(random.uniform(-0.3, 0.3))
    
    # Create listing
    listing = Listing(
        listing_id=listing_num,
        parcel_id=parcel.parcel_id,
        mls_id=mls_id,
        listing_id_str=listing_id_str,
        
        # Status
        status=status,
        status_text=status,
        
        # Pricing
        list_price=list_price,
        original_list_price=original_list_price,
        sold_price=sold_price,
        sold_date=dates['sold_date'],
        contract_date=dates['contract_date'],
        list_date=dates['list_date'],
        days_on_market=dates['days_on_market'],
        
        # Address (from parcel)
        address_full=parcel.address_full,
        address_number=parcel.address_number,
        street_name=parcel.street_name,
        city=parcel.city,
        state=parcel.state,
        zip_code=parcel.zip_code,
        
        # Coordinates
        latitude=lat,
        longitude=lon,
        county="Fairfield",
        
        # Property details
        property_type=parcel.property_type or 'Residential',
        property_subtype=parcel.property_subtype,
        bedrooms=bedrooms,
        bathrooms=Decimal(str(bathrooms)),
        baths_full=baths_full,
        baths_half=baths_half,
        square_feet=square_feet,
        lot_size=f"{lot_size_acres:.2f} acres",
        lot_size_area=Decimal(str(lot_size_sqft)),
        lot_size_area_units="sqft",
        acres=Decimal(str(lot_size_acres)),
        year_built=year_built,
        stories=random.randint(1, 2),
        garage_spaces=Decimal(str(random.randint(1, 3))),
        style=style,
        
        # Media
        photos=photos,
        
        # Content
        public_remarks=description,
        
        # Tax information
        tax_id=parcel.parcel_id,
        tax_year=2024,
        tax_annual_amount=list_price * Decimal("0.015"),  # ~1.5% property tax
        
        # Agent and office
        listing_agent_id=agent.agent_id,
        listing_office_id=office.office_id,
        
        # System
        modified=datetime.now(),
    )
    
    return listing


def main():
    """Main execution function."""
    print("=" * 80)
    print("🏘️  MOCK SIMPLYRETS LISTING GENERATOR")
    print("=" * 80)
    
    db = SessionLocal()
    
    try:
        # Check database connection
        print("\n🔌 Testing database connection...")
        result = db.execute(text("SELECT COUNT(*) FROM parcels"))
        parcel_count = result.fetchone()[0]
        print(f"✅ Connected to database with {parcel_count:,} parcels")
        
        # Create agents and offices
        agents, offices = create_mock_agents_and_offices(db)
        
        # Get diverse parcels
        parcels = get_diverse_parcels(db, target_count=120)
        
        if not parcels:
            print("❌ No parcels found! Check database.")
            return
        
        # Generate mock listings
        print(f"\n📝 Generating mock listings...")
        listings_created = 0
        
        for i, parcel in enumerate(parcels, 1):
            try:
                listing = create_mock_listing(parcel, agents, offices, i)
                db.add(listing)
                listings_created += 1
                
                if i % 20 == 0:
                    db.commit()
                    print(f"  ✓ Created {i} listings...")
            
            except Exception as e:
                print(f"  ⚠️  Error creating listing for {parcel.address_full}: {e}")
                continue
        
        # Final commit
        db.commit()
        
        print(f"\n✅ Successfully created {listings_created} mock listings!")
        
        # Verify results
        print("\n📊 Verification:")
        result = db.execute(text("SELECT COUNT(*) FROM listings"))
        total_listings = result.fetchone()[0]
        print(f"  Total listings in database: {total_listings}")
        
        result = db.execute(text("SELECT COUNT(*) FROM listings WHERE status = 'Active'"))
        active_listings = result.fetchone()[0]
        print(f"  Active listings: {active_listings}")
        
        result = db.execute(text("SELECT COUNT(*) FROM listings WHERE parcel_id IS NOT NULL"))
        matched_listings = result.fetchone()[0]
        print(f"  Listings matched to parcels: {matched_listings}")
        
        # Show sample listings
        print("\n📋 Sample listings:")
        result = db.execute(text("""
            SELECT l.listing_id_str, l.address_full, l.city, l.status, l.list_price,
                   l.bedrooms, l.bathrooms, l.square_feet
            FROM listings l
            ORDER BY l.listing_id
            LIMIT 5
        """))
        
        for row in result:
            print(f"  {row[0]}: {row[1]}, {row[2]} - {row[3]} - ${row[4]:,.0f} - {row[5]}BR/{row[6]}BA - {row[7]} sqft")
        
        print("\n" + "=" * 80)
        print("✨ Mock listing generation complete!")
        print("=" * 80)
        print("\nNext steps:")
        print("  1. Verify listings in database")
        print("  2. Test querying listings by parcel_id")
        print("  3. Test API endpoints")
        print("  4. Build property detail page")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

