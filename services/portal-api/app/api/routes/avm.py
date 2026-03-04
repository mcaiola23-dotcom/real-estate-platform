"""
AVM API endpoints - retrieve property valuations.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.avm.prediction import AvmPredictionService

router = APIRouter(prefix="/avm", tags=["avm"])


# Pydantic models for API responses
class AvmEstimate(BaseModel):
    """AVM valuation estimate."""
    model_config = ConfigDict(protected_namespaces=())

    parcel_id: str
    estimated_value: float
    confidence_score: float
    low_estimate: float
    high_estimate: float
    valuation_date: str
    model_version: str
    feature_importance: Optional[List[str]] = None


class AvmHistoryPoint(BaseModel):
    """Single point in AVM history."""
    valuation_date: str
    estimated_value: float
    confidence_score: float


class AvmHistory(BaseModel):
    """Historical AVM valuations for a property."""
    parcel_id: str
    valuations: List[AvmHistoryPoint]


class ModelInfo(BaseModel):
    """Information about the active AVM model."""
    version: str
    training_date: str
    mape: Optional[float]
    r2_score: Optional[float]
    training_samples: int


def _generate_feature_importance(parcel_data: dict) -> List[str]:
    """
    Generate top feature importance descriptions based on property characteristics.
    This provides user-friendly explanations without modifying the AVM model.
    """
    features = []
    
    # Location
    if parcel_data.get('city'):
        features.append(f"Location in {parcel_data['city']}")
    
    # Size
    if parcel_data.get('square_feet'):
        sqft = int(parcel_data['square_feet'])
        features.append(f"{sqft:,} square feet")
    
    # Bedrooms/Bathrooms
    beds = parcel_data.get('bedrooms')
    baths = parcel_data.get('bathrooms')
    if beds and baths:
        features.append(f"{beds} beds, {baths} baths")
    elif beds:
        features.append(f"{beds} bedrooms")
    
    # Year built / Age
    if parcel_data.get('year_built'):
        year = int(parcel_data['year_built'])
        age = 2026 - year
        if age < 10:
            features.append("Modern construction")
        elif age < 30:
            features.append(f"Built in {year}")
    
    # Property type
    if parcel_data.get('property_type'):
        ptype = parcel_data['property_type']
        if ptype not in ['SingleFamily', 'Single Family']:
            features.append(f"{ptype} property type")
    
    # Lot size
    if parcel_data.get('acres') and float(parcel_data['acres']) > 1:
        features.append(f"{parcel_data['acres']:.1f} acre lot")
    
    # Return top 3
    return features[:3]


@router.get("/estimate/{parcel_id:path}", response_model=AvmEstimate)
async def get_avm_estimate(parcel_id: str):
    """
    Get the latest AVM estimate for a specific parcel.
    
    Returns estimated value with confidence range and feature importance.
    Note: parcel_id uses :path to handle slashes in IDs (e.g., "12345/S")
    """
    from sqlalchemy import create_engine, text
    from app.core.config import settings
    
    service = AvmPredictionService()
    avm = service.get_latest_avm(parcel_id)
    
    if not avm:
        raise HTTPException(
            status_code=404,
            detail=f"No AVM valuation found for parcel {parcel_id}"
        )
    
    # Fetch parcel data to generate feature importance
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT city, square_feet, bedrooms, bathrooms, year_built, 
                       property_type, lot_size_acres
                FROM parcels
                WHERE parcel_id = :parcel_id
            """),
            {"parcel_id": parcel_id}
        )
        row = result.fetchone()
        
        if row:
            parcel_data = {
                'city': row[0],
                'square_feet': row[1],
                'bedrooms': row[2],
                'bathrooms': row[3],
                'year_built': row[4],
                'property_type': row[5],
                'acres': row[6]  # Using 'acres' key for backward compatibility with feature generation
            }
            avm['feature_importance'] = _generate_feature_importance(parcel_data)
    
    return avm


@router.get("/history/{parcel_id:path}", response_model=AvmHistory)
async def get_avm_history(
    parcel_id: str,
    months: int = Query(default=12, ge=1, le=60, description="Months of history to retrieve")
):
    """
    Get historical AVM valuations for a parcel.
    
    Returns timeline of estimated values over time (for Zillow-style chart).
    Note: parcel_id uses :path to handle slashes in IDs (e.g., "12345/S")
    """
    service = AvmPredictionService()
    history = service.get_avm_history(parcel_id, months=months)
    
    return {
        'parcel_id': parcel_id,
        'valuations': history
    }


class BatchAvmRequest(BaseModel):
    """Request body for batch AVM lookup."""
    parcel_ids: List[str]


@router.post("/batch")
async def get_batch_avms(request: BatchAvmRequest):
    """
    Get AVM estimates for multiple parcels at once.
    
    Useful for map markers - get AVMs for all visible parcels in one request.
    """
    if len(request.parcel_ids) > 100:
        raise HTTPException(
            status_code=400,
            detail="Maximum 100 parcels per batch request"
        )
    
    service = AvmPredictionService()
    avms = service.get_batch_avms(request.parcel_ids)
    
    return {
        'count': len(avms),
        'avms': avms
    }


@router.get("/model/info", response_model=ModelInfo)
async def get_model_info():
    """
    Get information about the active AVM model.
    
    Returns model version, accuracy metrics, and training details.
    """
    service = AvmPredictionService()
    model_info = service.get_model_info()
    
    if not model_info:
        raise HTTPException(
            status_code=404,
            detail="No active AVM model found"
        )
    
    return model_info


@router.get("/stats")
async def get_avm_stats():
    """
    Get overall AVM statistics.
    
    Returns count of valuations, value ranges, etc.
    """
    from sqlalchemy import create_engine, text
    from app.core.config import settings
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                COUNT(*) as total_avms,
                MIN(estimated_value) as min_value,
                MAX(estimated_value) as max_value,
                AVG(estimated_value) as avg_value,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY estimated_value) as median_value,
                COUNT(DISTINCT parcel_id) as unique_parcels
            FROM avm_valuations
        """))
        
        stats = result.fetchone()
        
        if not stats or stats[0] == 0:
            raise HTTPException(
                status_code=404,
                detail="No AVM valuations in database yet"
            )
        
        return {
            'total_avms': stats[0],
            'unique_parcels': stats[5],
            'min_value': float(stats[1]),
            'max_value': float(stats[2]),
            'avg_value': float(stats[3]),
            'median_value': float(stats[4])
        }
