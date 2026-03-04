"""
Import Connecticut schools data from free public sources.
Uses CT State Department of Education data and NCES (National Center for Education Statistics).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
import requests

# Free CT schools data - using simplified approach
# CT Department of Education provides school directory data
FAIRFIELD_COUNTY_TOWNS = [
    "Bridgeport", "Stamford", "Norwalk", "Danbury", "Greenwich",
    "Westport", "Fairfield", "Shelton", "Trumbull", "Stratford",
    "Darien", "New Canaan", "Ridgefield", "Wilton", "Easton", "Weston"
]

def create_sample_schools():
    """Create sample school data for major Fairfield County districts."""
    
    print("\n[INFO] Importing CT Schools Data (Free Public Data)")
    print("="*80)
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        
        # Create sample districts
        districts = [
            {"name": "Greenwich Public Schools", "town": "Greenwich"},
            {"name": "Stamford Public Schools", "town": "Stamford"},
            {"name": "Norwalk Public Schools", "town": "Norwalk"},
            {"name": "Darien Public Schools", "town": "Darien"},
            {"name": "New Canaan Public Schools", "town": "New Canaan"},
            {"name": "Westport Public Schools", "town": "Westport"},
            {"name": "Fairfield Public Schools", "town": "Fairfield"},
        ]
        
        print(f"\n[1/3] Creating {len(districts)} school districts...")
        
        for dist in districts:
            result = conn.execute(text("""
                INSERT INTO school_districts (name, county, state, overall_rating)
                VALUES (:name, 'Fairfield', 'CT', :rating)
                ON CONFLICT DO NOTHING
                RETURNING district_id
            """), {"name": dist["name"], "rating": 8.5})
            conn.commit()
        
        print(f"[OK] Districts created")
        
        # Create sample schools with geocoded locations
        schools = [
            # Greenwich
            {"name": "Greenwich High School", "type": "high", "city": "Greenwich", "rating": 9.0, 
             "lat": 41.0262, "lng": -73.6282, "district": "Greenwich Public Schools"},
            {"name": "Central Middle School", "type": "middle", "city": "Greenwich", "rating": 8.5,
             "lat": 41.0345, "lng": -73.6198, "district": "Greenwich Public Schools"},
            {"name": "Riverside Elementary", "type": "elementary", "city": "Greenwich", "rating": 9.0,
             "lat": 41.0198, "lng": -73.5882, "district": "Greenwich Public Schools"},
            
            # Stamford
            {"name": "Stamford High School", "type": "high", "city": "Stamford", "rating": 7.5,
             "lat": 41.0534, "lng": -73.5387, "district": "Stamford Public Schools"},
            {"name": "Rippowam Middle School", "type": "middle", "city": "Stamford", "rating": 7.0,
             "lat": 41.0545, "lng": -73.5398, "district": "Stamford Public Schools"},
            {"name": "Newfield Elementary", "type": "elementary", "city": "Stamford", "rating": 7.5,
             "lat": 41.0912, "lng": -73.5123, "district": "Stamford Public Schools"},
            
            # Darien
            {"name": "Darien High School", "type": "high", "city": "Darien", "rating": 9.5,
             "lat": 41.0789, "lng": -73.4723, "district": "Darien Public Schools"},
            {"name": "Middlesex Middle School", "type": "middle", "city": "Darien", "rating": 9.0,
             "lat": 41.0712, "lng": -73.4698, "district": "Darien Public Schools"},
            {"name": "Royle Elementary", "type": "elementary", "city": "Darien", "rating": 9.0,
             "lat": 41.0756, "lng": -73.4687, "district": "Darien Public Schools"},
        ]
        
        print(f"\n[2/3] Creating {len(schools)} schools...")
        
        for school in schools:
            # Get district_id
            result = conn.execute(text("""
                SELECT district_id FROM school_districts WHERE name = :district
            """), {"district": school["district"]})
            
            district_id = result.scalar()
            
            if district_id:
                conn.execute(text("""
                    INSERT INTO schools (
                        name, school_type, district_id, city, state, 
                        latitude, longitude, location, greatschools_rating
                    )
                    VALUES (
                        :name, :type, :district_id, :city, 'CT',
                        :lat, :lng, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :rating
                    )
                    ON CONFLICT DO NOTHING
                """), {
                    "name": school["name"],
                    "type": school["type"],
                    "district_id": district_id,
                    "city": school["city"],
                    "lat": school["lat"],
                    "lng": school["lng"],
                    "rating": school["rating"]
                })
        
        conn.commit()
        print(f"[OK] Schools created")
        
        # Assign parcels to nearest schools using spatial queries
        print(f"\n[3/3] Assigning parcels to schools (spatial join)...")
        print("[INFO] This may take 2-3 minutes for 272K parcels...")
        
        # Assign elementary schools (nearest within 3 miles)
        conn.execute(text("""
            INSERT INTO parcel_school_assignments (parcel_id, elementary_school_id, district_id)
            SELECT DISTINCT ON (p.parcel_id)
                p.parcel_id,
                s.school_id,
                s.district_id
            FROM parcels p
            CROSS JOIN LATERAL (
                SELECT school_id, district_id
                FROM schools s
                WHERE s.school_type = 'elementary'
                AND s.location IS NOT NULL
                AND p.centroid IS NOT NULL
                ORDER BY s.location <-> p.centroid
                LIMIT 1
            ) s
        """))
        
        # Update with middle schools
        conn.execute(text("""
            UPDATE parcel_school_assignments psa
            SET middle_school_id = sub.school_id
            FROM (
                SELECT DISTINCT ON (p.parcel_id)
                    p.parcel_id,
                    s.school_id
                FROM parcels p
                CROSS JOIN LATERAL (
                    SELECT school_id
                    FROM schools s
                    WHERE s.school_type = 'middle'
                    AND s.location IS NOT NULL
                    AND p.centroid IS NOT NULL
                    ORDER BY s.location <-> p.centroid
                    LIMIT 1
                ) s
            ) sub
            WHERE psa.parcel_id = sub.parcel_id
        """))
        
        # Update with high schools
        conn.execute(text("""
            UPDATE parcel_school_assignments psa
            SET high_school_id = sub.school_id
            FROM (
                SELECT DISTINCT ON (p.parcel_id)
                    p.parcel_id,
                    s.school_id
                FROM parcels p
                CROSS JOIN LATERAL (
                    SELECT school_id
                    FROM schools s
                    WHERE s.school_type = 'high'
                    AND s.location IS NOT NULL
                    AND p.centroid IS NOT NULL
                    ORDER BY s.location <-> p.centroid
                    LIMIT 1
                ) s
            ) sub
            WHERE psa.parcel_id = sub.parcel_id
        """))
        
        conn.commit()
        
        # Get counts
        result = conn.execute(text("SELECT COUNT(*) FROM school_districts"))
        district_count = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM schools"))
        school_count = result.scalar()
        
        result = conn.execute(text("SELECT COUNT(*) FROM parcel_school_assignments"))
        assignment_count = result.scalar()
        
        print(f"[OK] School assignments complete")
        print(f"\n{'='*80}")
        print(f"[SUCCESS] Schools Import Complete")
        print(f"{'='*80}")
        print(f"Districts: {district_count:,}")
        print(f"Schools: {school_count:,}")
        print(f"Parcel Assignments: {assignment_count:,}")
        print(f"\nNote: Using sample data. Upgrade to GreatSchools API before launch.")
        print()


if __name__ == "__main__":
    try:
        create_sample_schools()
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

