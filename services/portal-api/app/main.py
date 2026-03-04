from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.sentry import init_sentry
from .core.logging import setup_logging, RequestIDMiddleware
from .api.routes import (
    health_router,
    properties_router,
    leads_router,
    avm_router,
    map_router,
    search_router,
    listings_router,
    cities_router,
    ai_search_router,
    commute_router,
    places_router,
    comps_router,
    mortgage_router,
    transaction_history_router,
    auth_router,
    saved_searches_router,
    favorites_router,
    users_router,
    market_router,
)
from .api.routes.locations import router as locations_router
from .api.routes.neighborhoods import router as neighborhoods_router
from .api.routes.autocomplete import router as autocomplete_router
from .api.routes.alerts import router as alerts_router
from .db import create_tables
from . import models  # Ensure all models are registered before create_tables

settings.validate_runtime_settings()

# Initialize Sentry BEFORE app creation (to capture startup errors)
init_sentry()

# Setup structured logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add Request ID middleware (first, so it wraps all requests)
app.add_middleware(RequestIDMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(properties_router, prefix="/api")
app.include_router(leads_router)
app.include_router(avm_router, prefix="/api")
app.include_router(map_router)
app.include_router(search_router)
app.include_router(listings_router)
app.include_router(cities_router)
app.include_router(neighborhoods_router, prefix="/api")
app.include_router(autocomplete_router, prefix="/api")
app.include_router(ai_search_router)  # AI Natural Language Search
app.include_router(commute_router, prefix="/api")  # Commute calculations
app.include_router(places_router, prefix="/api")  # Google Places proxy (secure)
app.include_router(comps_router)  # Comparable properties
app.include_router(mortgage_router)  # Mortgage rates and calculator
app.include_router(transaction_history_router)  # Transaction history
app.include_router(auth_router, prefix="/api")  # Authentication
app.include_router(saved_searches_router, prefix="/api")  # Saved searches
app.include_router(favorites_router, prefix="/api")  # User favorites
app.include_router(users_router, prefix="/api")  # User profile management
app.include_router(locations_router)  # User saved locations
app.include_router(alerts_router, prefix="/api")  # Search alerts
app.include_router(market_router)  # Market statistics

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SmartMLS AI Platform API",
        "version": settings.api_version,
        "docs": "/docs"
    }


# Test Sentry integration (remove in production)
@app.get("/test-sentry")
async def test_sentry():
    """Deliberately raise an error to test Sentry integration."""
    if settings.environment != "local":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found",
        )
    raise Exception("Test Sentry integration - this error should appear in Sentry dashboard")
