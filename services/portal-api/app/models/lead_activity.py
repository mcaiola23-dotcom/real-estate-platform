"""
Lead activity tracking model for comprehensive user engagement analytics.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class LeadActivity(Base):
    """Track all user activities for lead scoring and analytics."""
    
    __tablename__ = "leads_activity"
    
    activity_id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=True, index=True)  # Nullable for anonymous users
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=True, index=True)  # Nullable for non-authenticated
    
    # Session tracking
    session_id = Column(String(255), nullable=True, index=True)
    
    # Activity details
    activity_type = Column(String(50), nullable=False, index=True)  # page_view, property_view, search, save, share, cta_click, etc.
    activity_data = Column(JSONB, nullable=True)  # Flexible JSON structure for activity-specific data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    lead = relationship("Lead")
    user = relationship("User", back_populates="activities")
    
    def __repr__(self) -> str:
        return f"<LeadActivity(activity_id={self.activity_id}, activity_type='{self.activity_type}')>"
    
    __table_args__ = (
        Index('idx_leads_activity_lead', 'lead_id'),
        Index('idx_leads_activity_user', 'user_id'),
        Index('idx_leads_activity_session', 'session_id'),
        Index('idx_leads_activity_type', 'activity_type'),
        Index('idx_leads_activity_created', 'created_at'),
    )




