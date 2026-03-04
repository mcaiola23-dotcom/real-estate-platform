#!/usr/bin/env python3
"""
Data seeding script for SmartMLS AI Platform.
This script adds sample properties and leads to the database.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db import SessionLocal, create_tables
from app.models.property import Property
from app.models.lead import Lead
from datetime import datetime

def seed_properties():
    """Add sample properties to the database."""
    db = SessionLocal()
    
    # Sample properties for Fairfield County, CT
    sample_properties = [
        {
            "mls_id": "FC001",
            "address": "123 Main Street",
            "city": "Fairfield",
            "state": "CT",
            "zip_code": "06824",
            "bedrooms": 4,
            "bathrooms": 2.5,
            "square_feet": 2500,
            "lot_size": 0.5,
            "list_price": 750000.0,
            "estimated_value": 720000.0,
            "property_type": "Residential",
            "status": "Active",
            "description": "Beautiful colonial home in the heart of Fairfield. Features updated kitchen, hardwood floors, and a spacious backyard perfect for entertaining.",
            "year_built": 1995,
            "garage_spaces": 2
        },
        {
            "mls_id": "FC002",
            "address": "456 Oak Avenue",
            "city": "Westport",
            "state": "CT",
            "zip_code": "06880",
            "bedrooms": 3,
            "bathrooms": 2.0,
            "square_feet": 1800,
            "lot_size": 0.3,
            "list_price": 650000.0,
            "estimated_value": 680000.0,
            "property_type": "Residential",
            "status": "Active",
            "description": "Charming ranch-style home with modern updates. Close to Westport's vibrant downtown and train station.",
            "year_built": 1985,
            "garage_spaces": 1
        },
        {
            "mls_id": "FC003",
            "address": "789 Elm Street",
            "city": "Stamford",
            "state": "CT",
            "zip_code": "06901",
            "bedrooms": 5,
            "bathrooms": 3.0,
            "square_feet": 3200,
            "lot_size": 0.75,
            "list_price": 950000.0,
            "estimated_value": 920000.0,
            "property_type": "Residential",
            "status": "Active",
            "description": "Luxury home with modern amenities, gourmet kitchen, and master suite with walk-in closet. Perfect for growing families.",
            "year_built": 2010,
            "garage_spaces": 3
        },
        {
            "mls_id": "FC004",
            "address": "321 Pine Road",
            "city": "Norwalk",
            "state": "CT",
            "zip_code": "06850",
            "bedrooms": 2,
            "bathrooms": 1.5,
            "square_feet": 1200,
            "lot_size": 0.2,
            "list_price": 450000.0,
            "estimated_value": 465000.0,
            "property_type": "Condo",
            "status": "Active",
            "description": "Modern condo with open floor plan, updated appliances, and access to community amenities.",
            "year_built": 2005,
            "garage_spaces": 1
        },
        {
            "mls_id": "FC005",
            "address": "654 Maple Drive",
            "city": "Fairfield",
            "state": "CT",
            "zip_code": "06824",
            "bedrooms": 6,
            "bathrooms": 4.0,
            "square_feet": 4200,
            "lot_size": 1.2,
            "list_price": 1200000.0,
            "estimated_value": 1180000.0,
            "property_type": "Residential",
            "status": "Active",
            "description": "Stunning waterfront property with panoramic views. Features include a chef's kitchen, home office, and private dock.",
            "year_built": 2000,
            "garage_spaces": 3
        },
        {
            "mls_id": "FC006",
            "address": "987 Cedar Lane",
            "city": "Westport",
            "state": "CT",
            "zip_code": "06880",
            "bedrooms": 3,
            "bathrooms": 2.5,
            "square_feet": 2200,
            "lot_size": 0.4,
            "list_price": 780000.0,
            "estimated_value": 795000.0,
            "property_type": "Townhouse",
            "status": "Active",
            "description": "Elegant townhouse in desirable Westport location. Features include a finished basement and private patio.",
            "year_built": 1990,
            "garage_spaces": 2
        }
    ]
    
    try:
        # Clear existing properties
        db.query(Property).delete()
        
        # Add sample properties
        for prop_data in sample_properties:
            property = Property(**prop_data)
            db.add(property)
        
        db.commit()
        print(f"✅ Added {len(sample_properties)} sample properties")
        
    except Exception as e:
        print(f"❌ Error seeding properties: {e}")
        db.rollback()
    finally:
        db.close()

def seed_leads():
    """Add sample leads to the database."""
    db = SessionLocal()
    
    sample_leads = [
        {
            "name": "John Smith",
            "email": "john.smith@email.com",
            "phone": "555-0123",
            "message": "Interested in waterfront properties in Fairfield County",
            "source": "website",
            "status": "new",
            "lead_score": 85,
            "created_at": datetime.now()
        },
        {
            "name": "Sarah Johnson",
            "email": "sarah.j@email.com",
            "phone": "555-0456",
            "message": "Looking for a family home in Westport with good schools",
            "source": "property_detail",
            "status": "contacted",
            "lead_score": 92,
            "created_at": datetime.now()
        },
        {
            "name": "Mike Chen",
            "email": "mike.chen@email.com",
            "phone": "555-0789",
            "message": "First-time homebuyer interested in condos under $500k",
            "source": "estimate_tool",
            "status": "new",
            "lead_score": 78,
            "created_at": datetime.now()
        }
    ]
    
    try:
        # Clear existing leads
        db.query(Lead).delete()
        
        # Add sample leads
        for lead_data in sample_leads:
            lead = Lead(**lead_data)
            db.add(lead)
        
        db.commit()
        print(f"✅ Added {len(sample_leads)} sample leads")
        
    except Exception as e:
        print(f"❌ Error seeding leads: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main seeding function."""
    print("🌱 Seeding SmartMLS AI Platform database...")
    print("=" * 50)
    
    # Create tables if they don't exist
    create_tables()
    print("✅ Database tables created/verified")
    
    # Seed data
    seed_properties()
    seed_leads()
    
    print("\n🎉 Database seeding complete!")
    print("Your SmartMLS AI Platform now has sample data to work with.")

if __name__ == "__main__":
    main()
