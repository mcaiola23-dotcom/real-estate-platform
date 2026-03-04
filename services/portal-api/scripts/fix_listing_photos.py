"""
Fix listing photos to use reliable Unsplash images instead of placeholder.com
"""

from app.db import SessionLocal
from app.models.listing import Listing

# Real estate photos from Unsplash (free, high-quality)
UNSPLASH_PHOTOS = [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop&q=80",  # Modern home exterior
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop&q=80",  # Living room
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&q=80",  # Kitchen
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&q=80",  # Bedroom
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop&q=80",  # Bathroom
    "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200&h=800&fit=crop&q=80",  # Dining room
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop&q=80",  # Home office
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop&q=80",  # Backyard
]

def fix_listing_photos():
    """Update all listing photos to use reliable Unsplash images."""
    db = SessionLocal()
    
    try:
        print("Updating listing photos...")
        
        # Get all listings
        listings = db.query(Listing).all()
        
        count = 0
        for listing in listings:
            listing.photos = UNSPLASH_PHOTOS
            count += 1
        
        db.commit()
        
        print(f"✓ Updated {count} listings with new photos")
        print(f"✓ Using {len(UNSPLASH_PHOTOS)} high-quality Unsplash images per listing")
        
    finally:
        db.close()

if __name__ == "__main__":
    fix_listing_photos()

