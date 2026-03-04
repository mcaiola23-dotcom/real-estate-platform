"""
SQLAlchemy models for AVM (Automated Valuation Model) tables.
"""

from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class AvmValuation(Base):
    """Store AVM predictions for historical tracking."""
    
    __tablename__ = "avm_valuations"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False, index=True)
    
    # Valuation data
    valuation_date = Column(Date, nullable=False, index=True)
    estimated_value = Column(Numeric(12, 2), nullable=False)
    confidence_score = Column(Numeric(3, 2), nullable=False)  # 0.00 to 1.00
    low_estimate = Column(Numeric(12, 2), nullable=False)  # -10% confidence range
    high_estimate = Column(Numeric(12, 2), nullable=False)  # +10% confidence range
    
    # Model information
    model_version = Column(String(50), nullable=False)
    feature_importance = Column(JSONB, nullable=True)  # Top features that influenced value
    comparable_count = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    parcel = relationship("Parcel", backref="avm_valuations")
    
    def __repr__(self) -> str:
        return f"<AvmValuation(parcel_id='{self.parcel_id}', value=${self.estimated_value:,.0f}, date='{self.valuation_date}')>"
    
    __table_args__ = (
        Index('idx_avm_valuations_parcel_date', 'parcel_id', 'valuation_date', unique=True),
    )


class AvmComparable(Base):
    """Store comparable properties used in valuation."""
    
    __tablename__ = "avm_comparables"
    
    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False, index=True)
    comparable_parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False)
    
    # Similarity metrics
    similarity_score = Column(Numeric(4, 3), nullable=False)  # 0.000 to 1.000
    distance_miles = Column(Numeric(6, 2), nullable=True)
    price_diff_pct = Column(Numeric(5, 2), nullable=True)  # Percentage difference
    
    # Comparable details (denormalized for performance)
    comparable_sale_price = Column(Numeric(12, 2), nullable=True)
    comparable_sale_date = Column(Date, nullable=True)
    comparable_square_feet = Column(Integer, nullable=True)
    comparable_bedrooms = Column(Integer, nullable=True)
    comparable_bathrooms = Column(Numeric(3, 1), nullable=True)
    adjusted_price = Column(Numeric(12, 2), nullable=True)  # Price after adjustments
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    parcel = relationship("Parcel", foreign_keys=[parcel_id], backref="avm_comparables_subject")
    comparable_parcel = relationship("Parcel", foreign_keys=[comparable_parcel_id])
    
    def __repr__(self) -> str:
        return f"<AvmComparable(parcel_id='{self.parcel_id}', comparable='{self.comparable_parcel_id}', similarity={self.similarity_score})>"
    
    __table_args__ = (
        Index('idx_avm_comparables_parcel', 'parcel_id'),
        Index('idx_avm_comparables_comparable', 'comparable_parcel_id'),
    )


class AvmModelVersion(Base):
    """Track model training runs and performance."""
    
    __tablename__ = "avm_model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False, index=True)
    
    # Training information
    training_date = Column(DateTime(timezone=True), nullable=False)
    training_samples = Column(Integer, nullable=False)
    training_duration_seconds = Column(Integer, nullable=True)
    
    # Performance metrics
    mae = Column(Numeric(12, 2), nullable=True)  # Mean Absolute Error
    mape = Column(Numeric(5, 2), nullable=True)  # Mean Absolute Percentage Error
    r2_score = Column(Numeric(4, 3), nullable=True)  # R-squared
    rmse = Column(Numeric(12, 2), nullable=True)  # Root Mean Squared Error
    
    # Model configuration
    model_path = Column(String(500), nullable=True)  # Path to saved model file
    feature_config = Column(JSONB, nullable=True)  # Features used in training
    hyperparameters = Column(JSONB, nullable=True)  # Model hyperparameters
    
    # Performance by property type
    performance_by_type = Column(JSONB, nullable=True)  # MAPE for each property type
    
    # Performance by price range
    performance_by_price_range = Column(JSONB, nullable=True)  # MAPE for price bands
    
    # Deployment status
    is_active = Column(Boolean, default=False, nullable=False)  # Current production model
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        active_str = " [ACTIVE]" if self.is_active else ""
        return f"<AvmModelVersion(version='{self.version}', mape={self.mape}%, r2={self.r2_score}){active_str}>"
    
    __table_args__ = (
        Index('idx_avm_model_versions_active', 'is_active'),
    )


