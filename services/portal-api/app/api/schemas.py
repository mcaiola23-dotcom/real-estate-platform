from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime


# Base schemas
class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str


# Property schemas
class PropertyBase(BaseModel):
    """Base property schema."""
    mls_id: str
    address: str
    city: str
    state: str = "CT"
    zip_code: str
    bedrooms: int
    bathrooms: float
    square_feet: Optional[int] = None
    lot_size: Optional[float] = None
    list_price: Optional[float] = None
    property_type: str = "Residential"
    status: str = "Active"
    description: Optional[str] = None
    year_built: Optional[int] = None
    garage_spaces: Optional[int] = None


class PropertyCreate(PropertyBase):
    """Schema for creating a property."""
    pass


class PropertyUpdate(BaseModel):
    """Schema for updating a property."""
    address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    lot_size: Optional[float] = None
    list_price: Optional[float] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    year_built: Optional[int] = None
    garage_spaces: Optional[int] = None


class Property(PropertyBase):
    """Property response schema."""
    id: int
    estimated_value: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class PropertyList(BaseModel):
    """Paginated property list response."""
    properties: List[Property]
    total: int
    page: int
    page_size: int
    total_pages: int


# Lead schemas
class LeadBase(BaseModel):
    """Base lead schema."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    message: Optional[str] = None
    source: Optional[str] = "website"
    interested_property_id: Optional[int] = None
    property_address: Optional[str] = None
    parcel_id: Optional[str] = None
    listing_id_str: Optional[str] = None
    intent: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None


class LeadCreate(LeadBase):
    """Schema for creating a lead."""
    pass


class LeadResponse(BaseModel):
    """Lead response schema."""
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    status: str
    source: Optional[str] = None
    lead_score: Optional[int] = None
    interested_property_id: Optional[int] = None
    property_address: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class LeadSubmissionResponse(BaseModel):
    """Response schema for lead submission."""
    status: str = "received"


# AVM/Estimation schemas
class PropertyEstimateRequest(BaseModel):
    """Schema for property value estimation request."""
    address: str = Field(..., min_length=1, max_length=255)
    bedrooms: int = Field(..., ge=0, le=20)
    bathrooms: float = Field(..., ge=0, le=20)
    sqft: int = Field(..., ge=100, le=50000)
    city: Optional[str] = None
    state: Optional[str] = "CT"
    zip_code: Optional[str] = None


class PropertyEstimateResponse(BaseModel):
    """Schema for property value estimation response."""
    estimated_value: float
    confidence_score: Optional[float] = None
    comparable_properties: Optional[int] = None
    market_trend: Optional[str] = None


# Parcel schemas for map integration
class PropertyDetails(BaseModel):
    square_feet: int
    bedrooms: int
    bathrooms: float
    acreage: float
    year_built: int
    property_type: str

class TransactionRecord(BaseModel):
    sale_date: str
    sale_price: float
    seller_name: Optional[str] = None
    buyer_name: Optional[str] = None
    transaction_type: str  # "Sale", "Transfer", "Foreclosure", etc.
    deed_type: Optional[str] = None
    financing: Optional[str] = None
    price_per_sqft: float

class MarketData(BaseModel):
    estimated_value: float
    last_sale_price: float
    last_sale_date: str
    price_per_sqft: float
    transaction_history: List[TransactionRecord] = []
    market_trend: Optional[str] = None  # "Rising", "Stable", "Declining"
    days_on_market: Optional[int] = None

class ZoningInfo(BaseModel):
    zone: str
    use_restrictions: List[str]

class OwnershipInfo(BaseModel):
    owner_name: str
    owner_address: str
    ownership_type: str

class Coordinates(BaseModel):
    lat: float
    lng: float

class ParcelResponse(BaseModel):
    parcel_id: str
    mls_id: str
    address: str
    city: str
    state: str
    zip_code: str
    coordinates: Coordinates
    boundary: dict  # GeoJSON Polygon
    property_details: PropertyDetails
    market_data: MarketData
    zoning: ZoningInfo
    ownership: Optional[OwnershipInfo] = None
    listing_details: Optional[dict] = None

    class Config:
        from_attributes = True

class ParcelListResponse(BaseModel):
    parcels: List[ParcelResponse]
    total: int
    limit: int
    offset: int

    class Config:
        from_attributes = True


class PaginatedPropertiesResponse(BaseModel):
    """Paginated properties response schema."""
    properties: List[Property]
    total: int
    page: int
    page_size: int
    total_pages: int


# Search schemas

class PriceRange(BaseModel):
    """Price range filter (kept for backward compatibility)."""
    min: Optional[float] = None
    max: Optional[float] = None


class RangeFilter(BaseModel):
    """Generic range filter for numeric values (min/max)."""
    min: Optional[float] = None
    max: Optional[float] = None


class PropertySearchFilters(BaseModel):
    """Enhanced property search filters with comprehensive options."""
    
    # Location filters
    towns: Optional[List[str]] = None  # Multi-select cities/towns
    neighborhoods: Optional[List[str]] = None  # Multi-select neighborhood NAMES (not IDs)
    neighborhood_id: Optional[int] = None  # Filter by specific neighborhood ID
    bbox: Optional[str] = None  # Bounding box for map queries
    
    # Status filters
    status: Optional[List[str]] = None  # Active, Pending, Sold, Off-Market
    sold_years: Optional[float] = Field(default=2.0, ge=0.1, le=10.0)  # Years back for Sold filter
    
    # Price filters
    price: Optional[PriceRange] = None  # Legacy support
    price_min: Optional[float] = None  # New: Direct price min
    price_max: Optional[float] = None  # New: Direct price max
    
    # Property characteristics - Range filters
    bedrooms: Optional[RangeFilter] = None  # Min/max bedrooms
    bathrooms: Optional[RangeFilter] = None  # Min/max bathrooms (supports decimals)
    square_feet: Optional[RangeFilter] = None  # Min/max square footage
    lot_size_acres: Optional[RangeFilter] = None  # Min/max lot size in acres
    year_built: Optional[RangeFilter] = None  # Min/max year built
    
    # Property type filters
    property_types: Optional[List[str]] = None  # Multi-select property types


class SortOption(BaseModel):
    field: str
    direction: Literal["asc", "desc"] = "asc"


class PropertySearchRequest(BaseModel):
    query: Optional[str] = None
    filters: Optional[PropertySearchFilters] = None
    sort: Optional[SortOption] = None
    page: int = 1
    page_size: int = 25
    include: Optional[List[str]] = None


class PropertySearchResult(BaseModel):
    parcel_id: str
    listing_id: Optional[int] = None
    listing_id_str: Optional[str] = None
    address: str
    city: str
    state: str
    zip_code: Optional[str] = None
    status: Optional[str] = None
    list_price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    property_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    highlight_state: str = "primary"
    centroid: Optional[List[float]] = None


class PropertySearchSummary(BaseModel):
    total_results: int
    page: int
    page_size: int
    filter_hash: str


class MapCallToAction(BaseModel):
    endpoint: str
    params: Dict[str, str]


class MapViewState(BaseModel):
    center: List[float]
    zoom: float
    bounds: List[List[float]]


class MapHighlightBlock(BaseModel):
    highlight_ids: List[str]
    selected_id: Optional[str] = None
    bbox: Optional[List[float]] = None
    view: Optional[MapViewState] = None
    call_to_action: Optional[MapCallToAction] = None
    clusters: Optional[List[Dict[str, Any]]] = None


class PropertySearchResponse(BaseModel):
    summary: PropertySearchSummary
    results: List[PropertySearchResult]
    map: MapHighlightBlock


# City/Town schemas

class CityInfo(BaseModel):
    """City/town information with property count."""
    name: str
    property_count: int
    active_listing_count: int
    
    class Config:
        from_attributes = True


class CityListResponse(BaseModel):
    """List of cities/towns with counts."""
    cities: List[CityInfo]
    total_cities: int


# Autocomplete schemas

class AutocompleteSuggestion(BaseModel):
    """Single autocomplete suggestion."""
    text: str  # Display text (e.g., "123 Main St, Stamford, CT 06902")
    type: Literal["address", "city", "neighborhood", "zip"]  # Suggestion type
    parcel_id: Optional[str] = None  # If address match
    neighborhood_id: Optional[int] = None  # If neighborhood match
    match_score: float  # Relevance score 0.0-1.0
    highlight: Optional[str] = None  # HTML with <mark> tags for matching portions
    metadata: Optional[Dict[str, Any]] = None  # Additional context (property count, etc.)


class AutocompleteResponse(BaseModel):
    """Autocomplete suggestions response."""
    suggestions: List[AutocompleteSuggestion]
    query: str
    total_matches: int


# Neighborhood schemas

class NeighborhoodInfo(BaseModel):
    """Basic neighborhood information."""
    neighborhood_id: int
    name: str
    town_name: str
    property_count: int
    active_listing_count: int
    avg_price: Optional[float] = None
    
    class Config:
        from_attributes = True


class NeighborhoodListResponse(BaseModel):
    """List of neighborhoods for selected cities."""
    neighborhoods: List[NeighborhoodInfo]
    total_neighborhoods: int


class NeighborhoodBoundary(BaseModel):
    """Neighborhood boundary GeoJSON."""
    neighborhood_id: int
    name: str
    town_name: str
    geometry: Dict[str, Any]  # GeoJSON geometry
    bbox: List[float]  # [minLon, minLat, maxLon, maxLat]
    
    class Config:
        from_attributes = True


# AI Natural Language Search Schemas

class AISearchRequest(BaseModel):
    """Request schema for AI-powered natural language search."""
    query: str = Field(
        ..., 
        min_length=3, 
        max_length=500,
        description="Natural language search query (e.g., '4 bedroom homes under $800k in Stamford')"
    )
    session_id: Optional[str] = Field(
        None,
        description="Optional session ID for conversational context"
    )
    include_off_market: Optional[bool] = Field(
        default=None,
        description="Override for off-market inclusion. If None, AI determines from query. Default behavior shows only active/pending listings."
    )
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=25, ge=1, le=100, description="Results per page")


class ParsedSearchFilters(BaseModel):
    """Structured filters parsed from natural language query by AI."""
    price_min: Optional[int] = Field(None, description="Minimum price in dollars")
    price_max: Optional[int] = Field(None, description="Maximum price in dollars")
    bedrooms_min: Optional[int] = Field(None, ge=0, le=20, description="Minimum bedrooms")
    bedrooms_max: Optional[int] = Field(None, ge=0, le=20, description="Maximum bedrooms")
    bathrooms_min: Optional[float] = Field(None, ge=0, le=20, description="Minimum bathrooms")
    bathrooms_max: Optional[float] = Field(None, ge=0, le=20, description="Maximum bathrooms")
    square_feet_min: Optional[int] = Field(None, ge=0, description="Minimum square footage")
    square_feet_max: Optional[int] = Field(None, description="Maximum square footage")
    lot_acres_min: Optional[float] = Field(None, ge=0, description="Minimum lot size in acres")
    lot_acres_max: Optional[float] = Field(None, description="Maximum lot size in acres")
    year_built_min: Optional[int] = Field(None, ge=1600, le=2030, description="Minimum year built")
    year_built_max: Optional[int] = Field(None, ge=1600, le=2030, description="Maximum year built")
    property_types: Optional[List[str]] = Field(None, description="Property types to include")
    cities: Optional[List[str]] = Field(None, description="Cities/towns to search")
    zip_codes: Optional[List[str]] = Field(None, description="ZIP codes to search")
    features: Optional[List[str]] = Field(None, description="Desired features (pool, garage, etc.)")
    fuzzy_terms: Optional[List[str]] = Field(
        None, 
        description="Relative terms requiring context (affordable, luxury, spacious)"
    )
    sort_by: Optional[str] = Field(
        None,
        description="Sort order: price_asc, price_desc, newest, oldest, sqft_desc, relevance"
    )
    include_off_market: Optional[bool] = Field(
        default=False,
        description="Include off-market properties (only when user explicitly requests)"
    )
    
    class Config:
        from_attributes = True


class AISearchResultItem(BaseModel):
    """Single result item from AI search."""
    parcel_id: str
    listing_id: Optional[int] = None
    address: str
    city: str
    state: str = "CT"
    zip_code: Optional[str] = None
    
    # Property details
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    lot_acres: Optional[float] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    
    # Pricing
    list_price: Optional[float] = None
    avm_estimate: Optional[float] = None
    price_source: str = Field(
        default="avm",
        description="Source of price: 'listing' or 'avm'"
    )
    
    # Status
    status: str = Field(default="Off-Market", description="Active, Pending, Sold, Off-Market")
    
    # Media
    thumbnail_url: Optional[str] = None
    photo_count: int = 0
    
    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Match quality
    relevance_score: Optional[float] = Field(
        None, 
        ge=0, 
        le=100,
        description="How well this result matches the query (0-100)"
    )
    match_highlights: Optional[List[str]] = Field(
        None,
        description="List of matching criteria (e.g., ['4 bedrooms', 'under $800k'])"
    )
    
    class Config:
        from_attributes = True


class AISearchUsage(BaseModel):
    """Token usage information for the AI query."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_cents: float = Field(
        default=0,
        description="Estimated cost in cents"
    )


class AISearchResponse(BaseModel):
    """Response schema for AI-powered natural language search."""
    success: bool = Field(default=True, description="Whether the search succeeded")
    
    # Query info
    original_query: str = Field(..., description="The original natural language query")
    parsed_filters: ParsedSearchFilters = Field(
        ..., 
        description="Structured filters extracted from query"
    )
    explanation: str = Field(
        ...,
        description="Human-readable explanation of the search results"
    )
    
    # Results
    results: List[AISearchResultItem] = Field(default=[], description="Search results")
    total_results: int = Field(default=0, description="Total number of matching results")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=25, description="Results per page")
    total_pages: int = Field(default=0, description="Total number of pages")
    
    # Performance metrics
    parse_time_ms: int = Field(default=0, description="Time to parse query with AI")
    query_time_ms: int = Field(default=0, description="Time to execute database query")
    total_time_ms: int = Field(default=0, description="Total request time")
    
    # AI model info
    ai_model: Optional[str] = Field(None, description="AI model used for parsing")
    usage: Optional[AISearchUsage] = Field(None, description="Token usage information")
    
    # Error handling
    error: Optional[str] = Field(None, description="Error message if success=False")
    
    class Config:
        from_attributes = True

