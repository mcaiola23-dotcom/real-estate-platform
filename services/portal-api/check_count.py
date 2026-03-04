from app.db import SessionLocal
from app.models.property import Property

db = SessionLocal()
try:
    count = db.query(Property).count()
    print(f"Property count: {count}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
