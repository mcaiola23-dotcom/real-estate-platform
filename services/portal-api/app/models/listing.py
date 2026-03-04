"""
Listing model for SimplyRETS MLS data.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Numeric, Text, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class Listing(Base):
    """Listing model representing SimplyRETS MLS data."""
    
    __tablename__ = "listings"
    
    # Primary key
    listing_id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to parcel (nullable until matched)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=True, index=True)
    
    # MLS identifiers
    mls_id = Column(Integer, nullable=False, index=True)
    listing_id_str = Column(String(50), nullable=False, unique=True, index=True)
    
    # Status
    status = Column(String(20), nullable=False, index=True)  # active, pending, sold, etc.
    status_text = Column(String(100), nullable=True)
    
    # Pricing
    list_price = Column(Numeric(12, 2), nullable=False, index=True)
    original_list_price = Column(Numeric(12, 2), nullable=True)
    sold_price = Column(Numeric(12, 2), nullable=True)
    sold_date = Column(Date, nullable=True)
    contract_date = Column(Date, nullable=True)
    list_date = Column(Date, nullable=False)
    days_on_market = Column(Integer, nullable=True)
    
    # MLS information
    mls_area = Column(String(100), nullable=True)
    mls_area_minor = Column(String(100), nullable=True)
    
    # Address
    address_full = Column(String(255), nullable=False)
    address_number = Column(String(20), nullable=True)
    street_name = Column(String(200), nullable=True)
    unit = Column(String(50), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(2), nullable=False)
    zip_code = Column(String(10), nullable=True, index=True)
    cross_street = Column(String(200), nullable=True)
    
    # Coordinates
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    county = Column(String(100), nullable=True)
    market_area = Column(String(100), nullable=True)
    directions = Column(Text, nullable=True)
    
    # Property details
    property_type = Column(String(50), nullable=True)
    property_subtype = Column(String(50), nullable=True)
    property_subtype_text = Column(String(100), nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Numeric(3, 1), nullable=True)
    baths_full = Column(Integer, nullable=True)
    baths_half = Column(Integer, nullable=True)
    baths_three_quarter = Column(Integer, nullable=True)
    square_feet = Column(Integer, nullable=True)
    area_source = Column(String(100), nullable=True)
    lot_size = Column(String(100), nullable=True)
    lot_size_area = Column(Numeric(12, 2), nullable=True)
    lot_size_area_units = Column(String(20), nullable=True)
    acres = Column(Numeric(10, 4), nullable=True)
    year_built = Column(Integer, nullable=True)
    stories = Column(Integer, nullable=True)
    garage_spaces = Column(Numeric(5, 2), nullable=True)
    parking_spaces = Column(Integer, nullable=True)
    parking_description = Column(String(255), nullable=True)
    style = Column(String(100), nullable=True)
    subdivision = Column(String(200), nullable=True)
    view = Column(String(200), nullable=True)
    construction = Column(String(255), nullable=True)
    roof = Column(String(100), nullable=True)
    foundation = Column(String(100), nullable=True)
    heating = Column(String(100), nullable=True)
    cooling = Column(String(100), nullable=True)
    water = Column(String(100), nullable=True)
    fireplaces = Column(Integer, nullable=True)
    flooring = Column(String(255), nullable=True)
    pool = Column(String(255), nullable=True)
    accessibility = Column(String(255), nullable=True)
    interior_features = Column(Text, nullable=True)
    exterior_features = Column(Text, nullable=True)
    additional_rooms = Column(Text, nullable=True)
    laundry_features = Column(String(255), nullable=True)
    lot_description = Column(Text, nullable=True)
    maintenance_expense = Column(Numeric(10, 2), nullable=True)
    
    # Media
    photos = Column(JSONB, nullable=True)  # Array of photo URLs
    virtual_tour_url = Column(String(500), nullable=True)
    
    # Content
    public_remarks = Column(Text, nullable=True)
    private_remarks = Column(Text, nullable=True)  # Restricted for IDX compliance
    showing_instructions = Column(Text, nullable=True)
    showing_contact_name = Column(String(200), nullable=True)
    showing_contact_phone = Column(String(20), nullable=True)
    
    # Terms and conditions
    terms = Column(String(100), nullable=True)
    agreement = Column(String(100), nullable=True)
    lease_type = Column(String(50), nullable=True)
    lease_term = Column(String(100), nullable=True)
    special_conditions = Column(String(255), nullable=True)
    disclaimer = Column(Text, nullable=True)
    
    # Tax information
    tax_id = Column(String(50), nullable=True, index=True)  # For matching with parcels
    tax_year = Column(Integer, nullable=True)
    tax_annual_amount = Column(Numeric(12, 2), nullable=True)
    
    # Agent and office references
    listing_agent_id = Column(String(50), ForeignKey('agents.agent_id'), nullable=True, index=True)
    listing_office_id = Column(String(50), ForeignKey('offices.office_id'), nullable=True, index=True)
    co_agent_id = Column(String(50), nullable=True)
    
    # School information
    school_elementary = Column(String(200), nullable=True)
    school_middle = Column(String(200), nullable=True)
    school_high = Column(String(200), nullable=True)
    school_district = Column(String(200), nullable=True)
    
    # HOA/Association
    hoa_name = Column(String(200), nullable=True)
    hoa_fee = Column(Numeric(10, 2), nullable=True)
    hoa_frequency = Column(String(50), nullable=True)
    hoa_amenities = Column(Text, nullable=True)
    
    # Display flags
    internet_address_display = Column(Boolean, nullable=True)
    internet_entire_listing_display = Column(Boolean, nullable=True)
    ownership = Column(String(100), nullable=True)
    
    # System information
    originating_system = Column(String(100), nullable=True)
    original_entry_timestamp = Column(DateTime(timezone=True), nullable=True)
    modified = Column(DateTime(timezone=True), nullable=False)  # From SimplyRETS API
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships (using string references to avoid circular imports)
    parcel = relationship("Parcel", back_populates="listings")
    listing_agent = relationship("Agent", foreign_keys="Listing.listing_agent_id")
    listing_office = relationship("Office", foreign_keys="Listing.listing_office_id")
    
    def __repr__(self) -> str:
        return f"<Listing(listing_id={self.listing_id}, mls_id={self.mls_id}, address='{self.address_full}', status='{self.status}')>"
    
    __table_args__ = (
        Index('idx_listings_location', 'latitude', 'longitude'),
    )

