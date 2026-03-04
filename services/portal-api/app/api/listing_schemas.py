from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from decimal import Decimal

# Shared small schemas
class AgentPublic(BaseModel):
    agent_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    office_phone: Optional[str] = None
    cell_phone: Optional[str] = None
    # Exclude strict personal info if required, but usually name/phone/email is public for listing agents

class OfficePublic(BaseModel):
    office_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    office_phone: Optional[str] = None

class ParcelSummary(BaseModel):
    parcel_id: str
    assessment_total: Optional[float] = None
    appraised_total: Optional[float] = None
    zoning: Optional[str] = None
    land_use: Optional[str] = None

class PublicListing(BaseModel):
    """
    Safe public representation of a listing.
    Strictly excludes restricted MLS fields (private remarks, owner info, etc.).
    """
    # Identifiers
    listing_id: int
    listing_id_str: str
    mls_id: Optional[str] = None
    
    # Address
    address_full: str
    address_number: Optional[str] = None
    street_name: Optional[str] = None
    unit: Optional[str] = None
    city: str
    state: str
    zip_code: Optional[str] = None
    county: Optional[str] = None
    
    # Status & Price
    status: str
    list_price: Optional[float] = None
    original_list_price: Optional[float] = None
    sold_price: Optional[float] = None
    sold_date: Optional[datetime] = None
    list_date: Optional[datetime] = None
    days_on_market: Optional[int] = None
    
    # Details
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    baths_full: Optional[int] = None
    baths_half: Optional[int] = None
    square_feet: Optional[int] = None
    lot_size: Optional[float] = None
    acres: Optional[float] = None
    year_built: Optional[int] = None
    stories: Optional[int] = None
    garage_spaces: Optional[float] = None
    style: Optional[str] = None
    subdivision: Optional[str] = None
    year_renovated: Optional[int] = None

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Content
    public_remarks: Optional[str] = None
    photos: List[str] = []
    virtual_tour_url: Optional[str] = None
    
    # Financials
    tax_annual_amount: Optional[float] = None
    
    # Attribution
    agent: Optional[AgentPublic] = None
    office: Optional[OfficePublic] = None
    
    # Linked Data
    parcel: Optional[ParcelSummary] = None
    
    # IDX Compliance Flags (computed)
    disclaimer_text: Optional[str] = Field(
        default="Listing data provided courtesy of SmartMLS, Inc.",
        description="Required IDX disclaimer text"
    )
    last_update_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True

class PublicListingList(BaseModel):
    listings: List[PublicListing]
    total: int
    page: int
    page_size: int
    total_pages: int
