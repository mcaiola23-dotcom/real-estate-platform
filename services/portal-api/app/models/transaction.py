"""
Transaction history model for property sales and listing events.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Index, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from ..db import Base


class TransactionHistory(Base):
    """Transaction and listing event history for properties."""
    
    __tablename__ = "transaction_history"
    
    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False, index=True)  # sale, listing, price_change, status_change
    event_date = Column(Date, nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=True)
    
    # Additional details stored as JSON
    details = Column(JSONB, nullable=True)  # Flexible structure for various event types
    
    # Data source
    data_source = Column(String(100), nullable=True)  # MLS, county_records, CT_GIS, etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return f"<TransactionHistory(transaction_id={self.transaction_id}, parcel_id='{self.parcel_id}', event_type='{self.event_type}', event_date='{self.event_date}')>"
    
    __table_args__ = (
        Index('idx_transaction_history_parcel', 'parcel_id'),
        Index('idx_transaction_history_date', 'event_date'),
        Index('idx_transaction_history_type', 'event_type'),
    )




