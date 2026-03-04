"""
AI Natural Language Search API Endpoint

Provides intelligent property search using natural language queries.
Example: "4 bedroom homes under $800k in Stamford with a pool"
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...db import get_db
from ...services.ai_search import ai_search_service
from ...services.search_builder import get_search_builder
from ..schemas import (
    AISearchRequest,
    AISearchResponse,
    AISearchResultItem,
    AISearchUsage,
    ParsedSearchFilters,
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/search", tags=["ai-search"])


@router.post("/ai", response_model=AISearchResponse)
async def ai_search(
    request: AISearchRequest,
    db: Session = Depends(get_db)
) -> AISearchResponse:
    """
    Search for properties using natural language.
    
    This endpoint parses natural language queries into structured filters
    and returns matching properties from the database.
    
    **Examples:**
    - "4 bedroom homes under $800k in Stamford"
    - "Condos in Greenwich with water views"
    - "Affordable 3BR houses in Darien"
    - "Luxury properties over 3000 sqft"
    
    **Response includes:**
    - Parsed filters (what the AI understood)
    - Matching properties (listings + off-market with AVM estimates)
    - Human-readable explanation
    - Performance metrics
    """
    start_time = datetime.now()
    
    logger.info(f"[AI Search] Query: {request.query}")
    
    # Step 1: Parse the natural language query with AI
    parse_result = ai_search_service.parse_query(request.query)
    
    if not parse_result["success"]:
        logger.error(f"[AI Search] Parse failed: {parse_result.get('error')}")
        return AISearchResponse(
            success=False,
            original_query=request.query,
            parsed_filters=ParsedSearchFilters(),
            explanation="Unable to understand the search query. Please try rephrasing.",
            error=parse_result.get("error", "Unknown parsing error"),
            results=[],
            total_results=0,
            page=request.page,
            page_size=request.page_size,
            total_pages=0,
            parse_time_ms=parse_result.get("parse_time_ms", 0),
            query_time_ms=0,
            total_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
        )
    
    # Convert parsed filters to schema
    filters = ParsedSearchFilters(**parse_result["filters"])
    parse_time_ms = parse_result.get("parse_time_ms", 0)
    
    # Determine include_off_market:
    # 1. If request explicitly sets it, use that value
    # 2. Otherwise, use the AI-parsed value (defaults to False)
    if request.include_off_market is not None:
        include_off_market = request.include_off_market
    else:
        include_off_market = filters.include_off_market or False
    
    logger.info(f"[AI Search] Parsed filters: {parse_result['filters']}")
    logger.info(f"[AI Search] Include off-market: {include_off_market}")
    
    # Step 2: Build and execute the database query
    query_start = datetime.now()
    
    try:
        search_builder = get_search_builder(db)
        results_raw, total_count = search_builder.build_query(
            filters=filters,
            include_off_market=include_off_market,
            page=request.page,
            page_size=request.page_size
        )
        
        query_time_ms = int((datetime.now() - query_start).total_seconds() * 1000)
        
    except Exception as e:
        logger.error(f"[AI Search] Query execution failed: {e}")
        return AISearchResponse(
            success=False,
            original_query=request.query,
            parsed_filters=filters,
            explanation="An error occurred while searching. Please try again.",
            error=str(e),
            results=[],
            total_results=0,
            page=request.page,
            page_size=request.page_size,
            total_pages=0,
            parse_time_ms=parse_time_ms,
            query_time_ms=0,
            total_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
        )
    
    # Step 3: Transform results to response schema
    results: List[AISearchResultItem] = []
    
    for row in results_raw:
        # Compute relevance score and highlights
        relevance_score, match_highlights = search_builder.compute_relevance_score(row, filters)
        
        # Determine price source
        if row.list_price:
            price = float(row.list_price)
            price_source = "listing"
        elif row.avm_estimate:
            price = float(row.avm_estimate)
            price_source = "avm"
        else:
            price = None
            price_source = "unknown"
        
        # Determine status
        if row.listing_status:
            status = row.listing_status
        else:
            status = "Off-Market"
        
        # Get thumbnail
        thumbnail_url = None
        photo_count = 0
        if row.photos:
            photos = row.photos if isinstance(row.photos, list) else []
            photo_count = len(photos)
            if photos:
                thumbnail_url = photos[0]
        
        result_item = AISearchResultItem(
            parcel_id=row.parcel_id,
            listing_id=row.listing_id,
            address=row.address or "",
            city=row.city or "",
            state=row.state or "CT",
            zip_code=row.zip_code,
            bedrooms=row.bedrooms,
            bathrooms=float(row.bathrooms) if row.bathrooms else None,
            square_feet=row.square_feet,
            lot_acres=float(row.lot_size_acres) if row.lot_size_acres else None,
            year_built=row.year_built,
            property_type=row.property_type,
            list_price=float(row.list_price) if row.list_price else None,
            avm_estimate=float(row.avm_estimate) if row.avm_estimate else None,
            price_source=price_source,
            status=status,
            thumbnail_url=thumbnail_url,
            photo_count=photo_count,
            latitude=float(row.latitude) if row.latitude else None,
            longitude=float(row.longitude) if row.longitude else None,
            relevance_score=relevance_score,
            match_highlights=match_highlights,
        )
        results.append(result_item)
    
    # Step 4: Generate explanation
    explanation = ai_search_service.generate_explanation(
        parse_result["filters"], 
        total_count
    )
    
    # Calculate pagination
    total_pages = (total_count + request.page_size - 1) // request.page_size if total_count > 0 else 0
    total_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
    
    # Build usage info if available
    usage = None
    if "usage" in parse_result:
        usage_data = parse_result["usage"]
        # Estimate cost: GPT-4o-mini pricing
        # Input: $0.150/1M tokens, Output: $0.600/1M tokens
        estimated_cost = (
            usage_data.get("prompt_tokens", 0) * 0.00015 +
            usage_data.get("completion_tokens", 0) * 0.0006
        ) * 100  # Convert to cents
        
        usage = AISearchUsage(
            prompt_tokens=usage_data.get("prompt_tokens", 0),
            completion_tokens=usage_data.get("completion_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
            estimated_cost_cents=round(estimated_cost, 4)
        )
    
    logger.info(
        f"[AI Search] Complete: {total_count} results in {total_time_ms}ms "
        f"(parse: {parse_time_ms}ms, query: {query_time_ms}ms)"
    )
    
    return AISearchResponse(
        success=True,
        original_query=request.query,
        parsed_filters=filters,
        explanation=explanation,
        results=results,
        total_results=total_count,
        page=request.page,
        page_size=request.page_size,
        total_pages=total_pages,
        parse_time_ms=parse_time_ms,
        query_time_ms=query_time_ms,
        total_time_ms=total_time_ms,
        ai_model=parse_result.get("model"),
        usage=usage,
    )


@router.get("/ai/health")
async def ai_search_health():
    """Check if the AI search service is available."""
    return {
        "service": "ai-search",
        "available": ai_search_service.is_available(),
        "model": ai_search_service.model if ai_search_service.is_available() else None,
    }




