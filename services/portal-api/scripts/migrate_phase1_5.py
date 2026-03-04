"""
Run Phase 1.5 database migrations using SQLAlchemy.
"""
import sys
sys.path.insert(0, '.')

from app.db import engine
from app.models.user import User, UserFavorite, SavedSearch, UserAlert, UserLocation

def run_migration():
    """Create all user-related tables if they don't exist."""
    from app.db import Base
    
    # Import all models to ensure they're registered
    from app.models.user import User, UserFavorite, SavedSearch, UserAlert, UserLocation
    
    # Create tables that don't exist
    Base.metadata.create_all(bind=engine)
    
    print("Migration complete! Created/verified tables:")
    print("  - users")
    print("  - user_favorites")
    print("  - saved_searches")
    print("  - user_alerts")
    print("  - user_locations")

if __name__ == "__main__":
    run_migration()
