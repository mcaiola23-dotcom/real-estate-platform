"""
AVM prediction service - wrapper for accessing pre-computed AVMs from database.
"""

from typing import Optional, Dict, List
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from ..core.config import settings
from .models import AvmValuation, AvmModelVersion


class AvmPredictionService:
    """Service for retrieving AVM predictions."""
    
    def __init__(self, db: Session = None):
        """Initialize service with database session."""
        self.db = db
        self.engine = create_engine(settings.database_url) if not db else None
    
    def get_latest_avm(self, parcel_id: str) -> Optional[Dict]:
        """
        Get the most recent AVM valuation for a parcel.
        
        Args:
            parcel_id: Parcel identifier
        
        Returns:
            Dictionary with AVM data or None if not found
        """
        if self.db:
            valuation = (
                self.db.query(AvmValuation)
                .filter(AvmValuation.parcel_id == parcel_id)
                .order_by(AvmValuation.valuation_date.desc())
                .first()
            )
            
            if valuation:
                return {
                    'parcel_id': valuation.parcel_id,
                    'estimated_value': float(valuation.estimated_value),
                    'confidence_score': float(valuation.confidence_score),
                    'low_estimate': float(valuation.low_estimate),
                    'high_estimate': float(valuation.high_estimate),
                    'valuation_date': valuation.valuation_date.isoformat(),
                    'model_version': valuation.model_version
                }
        else:
            # Use raw SQL if no session
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("""
                        SELECT 
                            parcel_id, estimated_value, confidence_score,
                            low_estimate, high_estimate, valuation_date, model_version
                        FROM avm_valuations
                        WHERE parcel_id = :parcel_id
                        ORDER BY valuation_date DESC
                        LIMIT 1
                    """),
                    {"parcel_id": parcel_id}
                )
                
                row = result.fetchone()
                if row:
                    return {
                        'parcel_id': row[0],
                        'estimated_value': float(row[1]),
                        'confidence_score': float(row[2]),
                        'low_estimate': float(row[3]),
                        'high_estimate': float(row[4]),
                        'valuation_date': row[5].isoformat(),
                        'model_version': row[6]
                    }
        
        return None
    
    def get_avm_history(self, parcel_id: str, months: int = 12) -> List[Dict]:
        """
        Get historical AVM valuations for a parcel.
        
        Args:
            parcel_id: Parcel identifier
            months: Number of months of history to retrieve
        
        Returns:
            List of AVM valuations ordered by date
        """
        cutoff_date = date.today() - timedelta(days=months * 30)
        
        if self.db:
            valuations = (
                self.db.query(AvmValuation)
                .filter(AvmValuation.parcel_id == parcel_id)
                .filter(AvmValuation.valuation_date >= cutoff_date)
                .order_by(AvmValuation.valuation_date.asc())
                .all()
            )
            
            return [
                {
                    'valuation_date': v.valuation_date.isoformat(),
                    'estimated_value': float(v.estimated_value),
                    'confidence_score': float(v.confidence_score)
                }
                for v in valuations
            ]
        else:
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("""
                        SELECT valuation_date, estimated_value, confidence_score
                        FROM avm_valuations
                        WHERE parcel_id = :parcel_id
                          AND valuation_date >= :cutoff_date
                        ORDER BY valuation_date ASC
                    """),
                    {"parcel_id": parcel_id, "cutoff_date": cutoff_date}
                )
                
                return [
                    {
                        'valuation_date': row[0].isoformat(),
                        'estimated_value': float(row[1]),
                        'confidence_score': float(row[2])
                    }
                    for row in result
                ]
    
    def get_batch_avms(self, parcel_ids: List[str]) -> Dict[str, Dict]:
        """
        Get latest AVMs for multiple parcels at once.
        
        Args:
            parcel_ids: List of parcel identifiers
        
        Returns:
            Dictionary mapping parcel_id to AVM data
        """
        if not parcel_ids:
            return {}
        
        with self.engine.connect() as conn:
            # Use DISTINCT ON to get latest valuation per parcel
            result = conn.execute(
                text("""
                    SELECT DISTINCT ON (parcel_id)
                        parcel_id, estimated_value, confidence_score,
                        low_estimate, high_estimate, valuation_date
                    FROM avm_valuations
                    WHERE parcel_id = ANY(:parcel_ids)
                    ORDER BY parcel_id, valuation_date DESC
                """),
                {"parcel_ids": parcel_ids}
            )
            
            avms = {}
            for row in result:
                avms[row[0]] = {
                    'estimated_value': float(row[1]),
                    'confidence_score': float(row[2]),
                    'low_estimate': float(row[3]),
                    'high_estimate': float(row[4]),
                    'valuation_date': row[5].isoformat()
                }
            
            return avms
    
    def get_model_info(self) -> Optional[Dict]:
        """Get information about the active AVM model."""
        if self.db:
            model = (
                self.db.query(AvmModelVersion)
                .filter(AvmModelVersion.is_active == True)
                .first()
            )
            
            if model:
                return {
                    'version': model.version,
                    'training_date': model.training_date.isoformat(),
                    'mape': float(model.mape) if model.mape else None,
                    'r2_score': float(model.r2_score) if model.r2_score else None,
                    'training_samples': model.training_samples
                }
        else:
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("""
                        SELECT version, training_date, mape, r2_score, training_samples
                        FROM avm_model_versions
                        WHERE is_active = TRUE
                        LIMIT 1
                    """)
                )
                
                row = result.fetchone()
                if row:
                    return {
                        'version': row[0],
                        'training_date': row[1].isoformat(),
                        'mape': float(row[2]) if row[2] else None,
                        'r2_score': float(row[3]) if row[3] else None,
                        'training_samples': row[4]
                    }
        
        return None


