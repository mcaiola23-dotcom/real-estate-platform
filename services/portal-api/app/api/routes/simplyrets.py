"""
SimplyRETS API routes for fetching real MLS data.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from ...services.simplyrets import simplyrets_service
from ..schemas import Property, PaginatedPropertiesResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simplyrets", tags=["simplyrets"])

@router.get("/properties", response_model=PaginatedPropertiesResponse)
async def get_simplyrets_properties(
    limit: int = Query(20, ge=1, le=50, description="Number of properties to return"),
    offset: int = Query(0, ge=0, description="Number of properties to skip"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query("CT", description="Filter by state"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum list price"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum list price"),
    property_type: Optional[str] = Query(None, description="Type of property"),
    bedrooms: Optional[int] = Query(None, ge=0, description="Minimum bedrooms"),
    bathrooms: Optional[float] = Query(None, ge=0, description="Minimum bathrooms")
):
    """
    Fetch properties from SimplyRETS API with filters.
    
    This endpoint provides real MLS data from SmartMLS via SimplyRETS.
    """
    try:
        result = await simplyrets_service.get_properties(
            limit=limit,
            offset=offset,
            city=city,
            state=state,
            min_price=min_price,
            max_price=max_price,
            property_type=property_type,
            bedrooms=bedrooms,
            bathrooms=bathrooms
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return PaginatedPropertiesResponse(
            properties=result["properties"],
            total=result["total"],
            page=(offset // limit) + 1,
            page_size=limit,
            total_pages=(result["total"] + limit - 1) // limit
        )
        
    except Exception as e:
        logger.error(f"Error in SimplyRETS properties endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch properties: {str(e)}")

@router.get("/properties/{mls_id}", response_model=Property)
async def get_simplyrets_property(mls_id: str):
    """
    Fetch a specific property by MLS ID from SimplyRETS.
    """
    try:
        property_data = await simplyrets_service.get_property_by_mls_id(mls_id)
        
        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")
        
        return Property(**property_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching property {mls_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch property: {str(e)}")

@router.get("/health")
async def simplyrets_health():
    """
    Check SimplyRETS API health and connectivity.
    """
    try:
        health_data = await simplyrets_service.health_check()
        return health_data
    except Exception as e:
        logger.error(f"Error checking SimplyRETS health: {e}")
        return {
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}",
            "properties_available": False
        }
