"""
School and School District models for education data.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from ..db import Base


class SchoolDistrict(Base):
    """School district model."""
    
    __tablename__ = "school_districts"
    
    district_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    county = Column(String(100), nullable=True)
    state = Column(String(2), nullable=False, default="CT")
    overall_rating = Column(Float, nullable=True)  # 0-10 scale
    boundary = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    website = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    schools = relationship("School", back_populates="district")
    
    def __repr__(self) -> str:
        return f"<SchoolDistrict(district_id={self.district_id}, name='{self.name}')>"
    
    __table_args__ = (
        Index('idx_school_districts_boundary', 'boundary', postgresql_using='gist'),
        Index('idx_school_districts_name', 'name'),
    )


class School(Base):
    """School model for elementary, middle, and high schools."""
    
    __tablename__ = "schools"
    
    school_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    school_type = Column(String(20), nullable=False, index=True)  # elementary, middle, high
    district_id = Column(Integer, ForeignKey('school_districts.district_id'), nullable=True, index=True)
    
    # Address
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(2), nullable=False, default="CT")
    zip_code = Column(String(10), nullable=True)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(Geometry('POINT', srid=4326), nullable=True)
    
    # Ratings and stats
    greatschools_rating = Column(Float, nullable=True)  # 1-10 scale
    enrollment = Column(Integer, nullable=True)
    student_teacher_ratio = Column(Float, nullable=True)
    grades = Column(String(50), nullable=True)  # e.g., "K-5", "6-8", "9-12"
    
    # Contact
    website = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    district = relationship("SchoolDistrict", back_populates="schools")
    parcel_assignments = relationship("ParcelSchoolAssignment", back_populates="elementary_school", 
                                     foreign_keys="ParcelSchoolAssignment.elementary_school_id")
    
    def __repr__(self) -> str:
        return f"<School(school_id={self.school_id}, name='{self.name}', type='{self.school_type}')>"
    
    __table_args__ = (
        Index('idx_schools_location', 'location', postgresql_using='gist'),
        Index('idx_schools_city', 'city'),
        Index('idx_schools_type', 'school_type'),
    )


class ParcelSchoolAssignment(Base):
    """Join table for parcel-to-school assignments."""
    
    __tablename__ = "parcel_school_assignments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    parcel_id = Column(String(50), ForeignKey('parcels.parcel_id'), nullable=False, index=True)
    elementary_school_id = Column(Integer, ForeignKey('schools.school_id'), nullable=True, index=True)
    middle_school_id = Column(Integer, ForeignKey('schools.school_id'), nullable=True, index=True)
    high_school_id = Column(Integer, ForeignKey('schools.school_id'), nullable=True, index=True)
    district_id = Column(Integer, ForeignKey('school_districts.district_id'), nullable=True, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    parcel = relationship("Parcel")
    elementary_school = relationship("School", foreign_keys=[elementary_school_id])
    middle_school = relationship("School", foreign_keys=[middle_school_id])
    high_school = relationship("School", foreign_keys=[high_school_id])
    district = relationship("SchoolDistrict")
    
    def __repr__(self) -> str:
        return f"<ParcelSchoolAssignment(parcel_id='{self.parcel_id}')>"
    
    __table_args__ = (
        Index('idx_parcel_school_assignments_parcel', 'parcel_id'),
    )




