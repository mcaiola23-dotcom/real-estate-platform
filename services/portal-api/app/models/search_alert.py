"""
Search alert model used by routes and background jobs.
"""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.sql import func

from ..db import Base


class SearchAlert(Base):
    """Alert subscription tied to a saved search."""

    __tablename__ = "search_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    saved_search_id = Column(Integer, ForeignKey("saved_searches.id"), nullable=False, index=True)
    frequency = Column(String(20), nullable=False, default="daily")
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    last_sent_at = Column(DateTime(timezone=True), nullable=True)
    last_listing_ids = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    __table_args__ = (
        Index("idx_search_alerts_user_saved_search", "user_id", "saved_search_id", unique=True),
    )
