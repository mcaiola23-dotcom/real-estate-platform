"""Quick test to verify database connection works."""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

print("Testing database connection...")
try:
    from app.db import SessionLocal
    db = SessionLocal()
    print("✅ Database connection successful")
    
    from sqlalchemy import text
    result = db.execute(text("SELECT COUNT(*) FROM parcels;"))
    count = result.fetchone()[0]
    print(f"✅ Current parcels in database: {count:,}")
    
    db.close()
    print("✅ Connection closed successfully")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

