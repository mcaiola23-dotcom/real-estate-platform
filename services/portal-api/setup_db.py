#!/usr/bin/env python3
"""
Database setup script for SmartMLS AI Platform.
This script will test the PostgreSQL connection and create the database if needed.
"""
import sys
import psycopg2
from psycopg2 import sql
from app.core.config import settings

def test_connection():
    """Test PostgreSQL connection."""
    try:
        # Try to connect to the default postgres database first
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            user="postgres",
            password="user",
            database="postgres"
        )
        print("✅ Successfully connected to PostgreSQL!")
        return conn
    except psycopg2.OperationalError as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check if the password is correct")
        print("3. Verify the connection details")
        return None

def create_database(conn):
    """Create the smartmls_db database if it doesn't exist."""
    try:
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
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def test_app_connection():
    """Test connection using the app's database URL."""
    try:
        conn = psycopg2.connect(settings.database_url)
        print("✅ App database connection successful!")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ App database connection failed: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 Setting up SmartMLS AI Platform Database...")
    print("=" * 50)
    
    # Test basic connection
    conn = test_connection()
    if not conn:
        sys.exit(1)
    
    # Create database
    if not create_database(conn):
        sys.exit(1)
    
    conn.close()
    
    # Test app connection
    if not test_app_connection():
        sys.exit(1)
    
    print("\n🎉 Database setup complete!")
    print("You can now run: python run.py")

if __name__ == "__main__":
    main()


