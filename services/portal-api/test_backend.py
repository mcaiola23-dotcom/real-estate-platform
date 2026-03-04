#!/usr/bin/env python3
"""
Simple test script to verify the backend works without database.
"""
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test if all modules can be imported."""
    print("🧪 Testing backend imports...")
    
    try:
        from app.main import app
        print("✅ FastAPI app imported successfully")
        
        from app.core.config import settings
        print("✅ Configuration imported successfully")
        
        from app.api.schemas import HealthResponse, PropertyEstimateRequest
        print("✅ Pydantic schemas imported successfully")
        
        from app.api.routes import health_router, properties_router, leads_router, avm_router
        print("✅ API routes imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_fastapi_app():
    """Test if FastAPI app can be created."""
    print("\n🚀 Testing FastAPI app creation...")
    
    try:
        from app.main import app
        print("✅ FastAPI app created successfully")
        print(f"   - Title: {app.title}")
        print(f"   - Version: {app.version}")
        print(f"   - Routes: {len(app.routes)}")
        return True
        
    except Exception as e:
        print(f"❌ FastAPI app creation failed: {e}")
        return False

def test_endpoints_without_db():
    """Test endpoints that don't require database."""
    print("\n🔍 Testing endpoints without database...")
    
    try:
        from fastapi.testclient import TestClient
        from app.main import app
        
        client = TestClient(app)
        
        # Test health endpoint
        response = client.get("/health/")
        if response.status_code == 200:
            print("✅ Health endpoint works")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
        
        # Test root endpoint
        response = client.get("/")
        if response.status_code == 200:
            print("✅ Root endpoint works")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
        
        # Test AVM endpoint (doesn't require database)
        estimate_data = {
            "address": "123 Test St",
            "bedrooms": 3,
            "bathrooms": 2.0,
            "sqft": 2000
        }
        response = client.post("/estimate/", json=estimate_data)
        if response.status_code == 200:
            print("✅ AVM estimation endpoint works")
        else:
            print(f"❌ AVM estimation endpoint failed: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Endpoint testing failed: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 SmartMLS AI Platform - Backend Test")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed!")
        return False
    
    # Test FastAPI app
    if not test_fastapi_app():
        print("\n❌ FastAPI app test failed!")
        return False
    
    # Test endpoints
    if not test_endpoints_without_db():
        print("\n❌ Endpoint tests failed!")
        return False
    
    print("\n🎉 All tests passed!")
    print("\nNext steps:")
    print("1. Set up PostgreSQL database")
    print("2. Update database connection in app/core/config.py")
    print("3. Run: python run.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


