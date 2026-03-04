"""
Create Phase 1 database tables for Property Detail Enhancement.

This migration creates the following tables:
- schools, school_districts, parcel_school_assignments
- water_bodies, parks_recreation
- transaction_history
- commute_cache
- users, user_favorites, user_alerts
- leads_activity
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from datetime import datetime
from app.core.config import settings

def create_phase1_tables():
    """Create all Phase 1 tables in database."""
    
    print("\n" + "="*80)
    print("CREATING PHASE 1 DATABASE TABLES")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    print()
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        
        # ===== SCHOOL TABLES =====
        print("Creating school-related tables...")
        
        # 1. School Districts table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS school_districts (
                district_id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                county VARCHAR(100),
                state VARCHAR(2) NOT NULL DEFAULT 'CT',
                overall_rating REAL,
                boundary GEOMETRY(MULTIPOLYGON, 4326),
                website VARCHAR(500),
                phone VARCHAR(20),
                updated_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_school_districts_boundary
            ON school_districts USING GIST (boundary)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_school_districts_name
            ON school_districts(name)
        """))
        
        print("  [OK] school_districts table created")
        
        # 2. Schools table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS schools (
                school_id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                school_type VARCHAR(20) NOT NULL,
                district_id INTEGER REFERENCES school_districts(district_id),
                address VARCHAR(255),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(2) NOT NULL DEFAULT 'CT',
                zip_code VARCHAR(10),
                latitude REAL,
                longitude REAL,
                location GEOMETRY(POINT, 4326),
                greatschools_rating REAL,
                enrollment INTEGER,
                student_teacher_ratio REAL,
                grades VARCHAR(50),
                website VARCHAR(500),
                phone VARCHAR(20),
                updated_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_schools_location
            ON schools USING GIST (location)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_schools_city
            ON schools(city)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_schools_type
            ON schools(school_type)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_schools_district
            ON schools(district_id)
        """))
        
        print("  [OK] schools table created")
        
        # 3. Parcel School Assignments table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS parcel_school_assignments (
                id SERIAL PRIMARY KEY,
                parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(parcel_id),
                elementary_school_id INTEGER REFERENCES schools(school_id),
                middle_school_id INTEGER REFERENCES schools(school_id),
                high_school_id INTEGER REFERENCES schools(school_id),
                district_id INTEGER REFERENCES school_districts(district_id),
                updated_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parcel_school_assignments_parcel
            ON parcel_school_assignments(parcel_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parcel_school_assignments_elementary
            ON parcel_school_assignments(elementary_school_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parcel_school_assignments_middle
            ON parcel_school_assignments(middle_school_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parcel_school_assignments_high
            ON parcel_school_assignments(high_school_id)
        """))
        
        print("  [OK] parcel_school_assignments table created")
        print()
        
        # ===== GEOGRAPHY TABLES =====
        print("Creating geography tables...")
        
        # 4. Water Bodies table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS water_bodies (
                water_body_id SERIAL PRIMARY KEY,
                name VARCHAR(200),
                water_type VARCHAR(50) NOT NULL,
                source VARCHAR(100),
                geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_water_bodies_geometry
            ON water_bodies USING GIST (geometry)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_water_bodies_type
            ON water_bodies(water_type)
        """))
        
        print("  [OK] water_bodies table created")
        
        # 5. Parks & Recreation table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS parks_recreation (
                park_id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                park_type VARCHAR(50) NOT NULL,
                address VARCHAR(255),
                city VARCHAR(100),
                amenities JSONB,
                geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parks_recreation_geometry
            ON parks_recreation USING GIST (geometry)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parks_recreation_type
            ON parks_recreation(park_type)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_parks_recreation_city
            ON parks_recreation(city)
        """))
        
        print("  [OK] parks_recreation table created")
        print()
        
        # ===== TRANSACTION HISTORY =====
        print("Creating transaction history table...")
        
        # 6. Transaction History table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS transaction_history (
                transaction_id SERIAL PRIMARY KEY,
                parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(parcel_id),
                event_type VARCHAR(50) NOT NULL,
                event_date DATE NOT NULL,
                price NUMERIC(12, 2),
                details JSONB,
                data_source VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_transaction_history_parcel
            ON transaction_history(parcel_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_transaction_history_date
            ON transaction_history(event_date)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_transaction_history_type
            ON transaction_history(event_type)
        """))
        
        print("  [OK] transaction_history table created")
        print()
        
        # ===== COMMUTE CACHE =====
        print("Creating commute cache table...")
        
        # 7. Commute Cache table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS commute_cache (
                cache_id SERIAL PRIMARY KEY,
                parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(parcel_id),
                destination_type VARCHAR(50) NOT NULL,
                destination_address VARCHAR(500),
                drive_time_min INTEGER,
                drive_time_peak_min INTEGER,
                transit_time_min INTEGER,
                distance_miles REAL,
                computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_commute_cache_parcel
            ON commute_cache(parcel_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_commute_cache_destination
            ON commute_cache(destination_type)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_commute_cache_expires
            ON commute_cache(expires_at)
        """))
        
        print("  [OK] commute_cache table created")
        print()
        
        # ===== USER & AUTHENTICATION TABLES =====
        print("Creating user-related tables...")
        
        # 8. Users table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                user_type VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                last_login_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_clerk_id
            ON users(clerk_user_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_email
            ON users(email)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_type
            ON users(user_type)
        """))
        
        print("  [OK] users table created")
        
        # 9. User Favorites table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_favorites (
                favorite_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                listing_id INTEGER REFERENCES listings(listing_id),
                parcel_id VARCHAR(50) REFERENCES parcels(parcel_id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_favorites_user
            ON user_favorites(user_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_favorites_listing
            ON user_favorites(listing_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_favorites_parcel
            ON user_favorites(parcel_id)
        """))
        
        print("  [OK] user_favorites table created")
        
        # 10. User Alerts table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_alerts (
                alert_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                alert_criteria TEXT NOT NULL,
                frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                last_sent_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_alerts_user
            ON user_alerts(user_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_alerts_active
            ON user_alerts(is_active)
        """))
        
        print("  [OK] user_alerts table created")
        print()
        
        # ===== LEAD ACTIVITY TRACKING =====
        print("Creating lead activity tracking table...")
        
        # 11. Lead Activity table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS leads_activity (
                activity_id SERIAL PRIMARY KEY,
                lead_id INTEGER REFERENCES leads(id),
                user_id INTEGER REFERENCES users(user_id),
                session_id VARCHAR(255),
                activity_type VARCHAR(50) NOT NULL,
                activity_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_leads_activity_lead
            ON leads_activity(lead_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_leads_activity_user
            ON leads_activity(user_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_leads_activity_session
            ON leads_activity(session_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_leads_activity_type
            ON leads_activity(activity_type)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_leads_activity_created
            ON leads_activity(created_at)
        """))
        
        print("  [OK] leads_activity table created")
        print()
        
        # Commit all changes
        conn.commit()
        
        # Verify all tables exist
        print("Verifying tables...")
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'school_districts', 'schools', 'parcel_school_assignments',
                'water_bodies', 'parks_recreation',
                'transaction_history', 'commute_cache',
                'users', 'user_favorites', 'user_alerts',
                'leads_activity'
            )
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        print(f"  [OK] Found {len(tables)} Phase 1 tables:")
        for table in tables:
            print(f"    - {table}")
        print()
        
        # Get row counts
        print("Current row counts:")
        for table in tables:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"  {table}: {count:,} rows")
        
        print()
        print("="*80)
        print("[SUCCESS] PHASE 1 TABLES CREATED SUCCESSFULLY")
        print("="*80)
        print()
        
        print("Next steps:")
        print("  1. Import schools data (Task 1.2)")
        print("  2. Import neighborhoods data (Task 1.3)")
        print("  3. Import water bodies & parks (Task 1.4)")
        print("  4. Setup Google Distance Matrix API (Task 1.5)")
        print("  5. Setup Clerk authentication (Task 1.6)")
        print("  6. Setup mortgage rates API (Task 1.7)")
        print()
        
        return True


if __name__ == "__main__":
    try:
        create_phase1_tables()
        sys.exit(0)
        
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

