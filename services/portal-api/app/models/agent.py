"""
Agent model for SimplyRETS agent information (IDX compliance).
"""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class Agent(Base):
    """Model for listing agents (from SimplyRETS)."""
    
    __tablename__ = "agents"
    
    # Primary key
    agent_id = Column(String(50), primary_key=True, index=True)
    
    # Agent information
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    office_mls_id = Column(String(50), nullable=True, index=True)
    
    # Contact information
    email = Column(String(255), nullable=True)
    office_phone = Column(String(20), nullable=True)
    cell_phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    
    # Metadata
    modified = Column(DateTime(timezone=True), nullable=True)  # From SimplyRETS API
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    listings = relationship("Listing", foreign_keys="Listing.listing_agent_id", back_populates="listing_agent")
    
    def __repr__(self) -> str:
        return f"<Agent(agent_id='{self.agent_id}', name='{self.first_name} {self.last_name}')>"

