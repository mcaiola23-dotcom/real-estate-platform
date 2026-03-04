"""
Import audit log model for MLS refresh runs.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from ..db import Base


class ImportAudit(Base):
    """Tracks MLS import runs and outcomes."""

    __tablename__ = "import_audits"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)
    run_type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, index=True)  # started, success, error

    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    since = Column(DateTime(timezone=True), nullable=True)

    fetched = Column(Integer, nullable=False, default=0)
    imported = Column(Integer, nullable=False, default=0)
    updated = Column(Integer, nullable=False, default=0)
    matched = Column(Integer, nullable=False, default=0)
    skipped = Column(Integer, nullable=False, default=0)
    errors = Column(Integer, nullable=False, default=0)

    message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<ImportAudit(id={self.id}, source={self.source}, run_type={self.run_type}, "
            f"status={self.status}, started_at={self.started_at})>"
        )
