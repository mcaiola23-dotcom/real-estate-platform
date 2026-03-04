"""
Fix users table schema for registration.
Makes clerk_user_id nullable (legacy column from Clerk auth).
"""

from app.db import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # First, check what columns exist
        result = conn.execute(text("""
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        """))
        
        print("Current users table schema:")
        columns = []
        for row in result:
            columns.append(row[0])
            nullable = "NULL" if row[1] == 'YES' else "NOT NULL"
            print(f"  {row[0]}: {row[2]} {nullable}")
        
        # Make clerk_user_id nullable if it exists
        if 'clerk_user_id' in columns:
            print("\nMaking clerk_user_id nullable...")
            conn.execute(text("ALTER TABLE users ALTER COLUMN clerk_user_id DROP NOT NULL"))
            print("Done: clerk_user_id is now nullable")
        
        conn.commit()
        print("\nMigration complete!")

if __name__ == "__main__":
    run_migration()
