"""
Randomize Listing Photos

Creates photo variety across all 120 sample listings by:
1. Using a pool of 30 high-quality Unsplash real estate photos
2. Randomly assigning 6-10 photos to each listing
3. Ensuring first photo is usually an exterior shot
"""

import sys
import os
import random
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.db import SessionLocal

# Pool of 30 high-quality Unsplash real estate photos
# Format: (url, type) where type is 'exterior' or 'interior'

PHOTO_POOL = [
    # EXTERIORS (10 photos) - Modern houses
    ('https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&h=800&fit=crop&q=80', 'exterior'),
    ('https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=1200&h=800&fit=crop&q=80', 'exterior'),
    
    # LIVING ROOMS (4 photos)
    ('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1615529162924-f6c8ef9d3281?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=800&fit=crop&q=80', 'interior'),
    
    # KITCHENS (4 photos)
    ('https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop&q=80', 'interior'),
    
    # BEDROOMS (4 photos)
    ('https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=800&fit=crop&q=80', 'interior'),
    
    # BATHROOMS (3 photos)
    ('https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop&q=80', 'interior'),
    
    # OUTDOOR SPACES (3 photos)
    ('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&h=800&fit=crop&q=80', 'interior'),
    
    # DINING ROOMS (2 photos)
    ('https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&h=800&fit=crop&q=80', 'interior'),
    ('https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1200&h=800&fit=crop&q=80', 'interior'),
]

def randomize_photos():
    """Randomize photos for all listings."""
    db = SessionLocal()
    
    try:
        # Get all listings with photos
        result = db.execute(text("""
            SELECT listing_id, mls_id 
            FROM listings 
            WHERE photos IS NOT NULL
            ORDER BY listing_id
        """))
        listings = result.fetchall()
        
        print(f"Found {len(listings)} listings to update")
        
        if len(listings) == 0:
            print("No listings found!")
            return
        
        # Get exterior and interior photos separately
        exteriors = [url for url, type in PHOTO_POOL if type == 'exterior']
        interiors = [url for url, type in PHOTO_POOL if type == 'interior']
        
        print(f"Photo pool: {len(exteriors)} exteriors, {len(interiors)} interiors")
        
        updated_count = 0
        
        for listing_id, mls_id in listings:
            # Randomly decide how many photos (6-10)
            num_photos = random.randint(6, 10)
            
            # 80% chance first photo is an exterior, 20% interior
            if random.random() < 0.8:
                # Start with a random exterior
                first_photo = random.choice(exteriors)
                remaining_exteriors = [e for e in exteriors if e != first_photo]
                
                # Select remaining photos (mix of exteriors and interiors)
                num_remaining = num_photos - 1
                num_more_exteriors = random.randint(0, min(2, num_remaining))  # 0-2 more exteriors
                num_interiors = num_remaining - num_more_exteriors
                
                more_exteriors = random.sample(remaining_exteriors, min(num_more_exteriors, len(remaining_exteriors)))
                selected_interiors = random.sample(interiors, min(num_interiors, len(interiors)))
                
                # Combine and shuffle (except first photo)
                remaining_photos = more_exteriors + selected_interiors
                random.shuffle(remaining_photos)
                
                photos = [first_photo] + remaining_photos
            else:
                # Start with an interior (rare case)
                photos = random.sample(exteriors + interiors, num_photos)
            
            # Convert to JSON array
            photos_json = json.dumps(photos)
            
            # Update listing - cast the parameter in SQL
            db.execute(text("""
                UPDATE listings
                SET photos = CAST(:photos AS jsonb)
                WHERE listing_id = :listing_id
            """), {"photos": photos_json, "listing_id": listing_id})
            
            updated_count += 1
            
            if updated_count % 20 == 0:
                print(f"  Updated {updated_count}/{len(listings)} listings...")
        
        db.commit()
        print(f"SUCCESS: Updated {updated_count} listings with randomized photos")
        print(f"Each listing now has 6-10 unique photos from a pool of {len(PHOTO_POOL)}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Randomize Listing Photos")
    print("=" * 60)
    
    response = input("This will update all listing photos. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled")
        exit(0)
    
    randomize_photos()

