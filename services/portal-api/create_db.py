#!/usr/bin/env python3
"""
Simple script to create the PostgreSQL database for SmartMLS AI Platform.
"""
import psycopg2
from psycopg2 import sql
import sys

def create_database():
    """Create the smartmls_db database."""
    # Try different password combinations
    passwords = ["user", "User", "postgres", "admin", ""]
    
    for password in passwords:
        try:
            print(f"Trying password: {'(empty)' if password == '' else password}")
            
            # Connect to default postgres database
            conn = psycopg2.connect(
                host="localhost",
                port="5432",
                user="postgres",
                password=password,
                database="postgres"
            )
            
            print("✅ Successfully connected to PostgreSQL!")
            
            # Create database if it doesn't exist
            conn.autocommit = True
            cursor = conn.cursor()
            
            # Check if database exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = 'smartmls_db'"
            )
            exists = cursor.fetchone()
            
            if not exists:
                print("Creating database 'smartmls_db'...")
                cursor.execute(sql.SQL("CREATE DATABASE smartmls_db"))
                print("✅ Database 'smartmls_db' created successfully!")
            else:
                print("✅ Database 'smartmls_db' already exists!")
            
            cursor.close()
            conn.close()
            
            print("\n🎉 Database setup complete!")
            print("You can now run: python run.py")
            return True
            
        except psycopg2.OperationalError as e:
            print(f"❌ Connection failed with password '{password}': {e}")
            continue
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            continue
    
    print("\n❌ Could not connect to PostgreSQL with any of the tried passwords.")
    print("\nPlease check:")
    print("1. PostgreSQL is running")
    print("2. The correct password for user 'postgres'")
    print("3. PostgreSQL is listening on localhost:5432")
    
    return False

if __name__ == "__main__":
    success = create_database()
    sys.exit(0 if success else 1)


