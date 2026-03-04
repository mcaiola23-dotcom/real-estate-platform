"""
Create AVM database tables.
Migration script to add avm_valuations, avm_comparables, and avm_model_versions tables.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from datetime import datetime
from app.core.config import settings

def create_avm_tables():
    """Create AVM tables in database."""
    
    print("\n" + "="*80)
    print("CREATING AVM DATABASE TABLES")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    print()
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        
        # 1. Create avm_valuations table
        print("Creating avm_valuations table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS avm_valuations (
                id SERIAL PRIMARY KEY,
                parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(parcel_id),
                valuation_date DATE NOT NULL,
                estimated_value NUMERIC(12, 2) NOT NULL,
                confidence_score NUMERIC(3, 2) NOT NULL,
                low_estimate NUMERIC(12, 2) NOT NULL,
                high_estimate NUMERIC(12, 2) NOT NULL,
                model_version VARCHAR(50) NOT NULL,
                feature_importance JSONB,
                comparable_count INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                CONSTRAINT uq_avm_valuations_parcel_date UNIQUE (parcel_id, valuation_date)
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_valuations_parcel 
            ON avm_valuations(parcel_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_valuations_date 
            ON avm_valuations(valuation_date)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_valuations_model_version 
            ON avm_valuations(model_version)
        """))
        
        print("  ✓ avm_valuations table created")
        print()
        
        # 2. Create avm_comparables table
        print("Creating avm_comparables table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS avm_comparables (
                id SERIAL PRIMARY KEY,
                parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(parcel_id),
                comparable_parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(parcel_id),
                similarity_score NUMERIC(4, 3) NOT NULL,
                distance_miles NUMERIC(6, 2),
                price_diff_pct NUMERIC(5, 2),
                comparable_sale_price NUMERIC(12, 2),
                comparable_sale_date DATE,
                comparable_square_feet INTEGER,
                comparable_bedrooms INTEGER,
                comparable_bathrooms NUMERIC(3, 1),
                adjusted_price NUMERIC(12, 2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_comparables_parcel 
            ON avm_comparables(parcel_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_comparables_comparable 
            ON avm_comparables(comparable_parcel_id)
        """))
        
        print("  ✓ avm_comparables table created")
        print()
        
        # 3. Create avm_model_versions table
        print("Creating avm_model_versions table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS avm_model_versions (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) UNIQUE NOT NULL,
                training_date TIMESTAMP WITH TIME ZONE NOT NULL,
                training_samples INTEGER NOT NULL,
                training_duration_seconds INTEGER,
                mae NUMERIC(12, 2),
                mape NUMERIC(5, 2),
                r2_score NUMERIC(4, 3),
                rmse NUMERIC(12, 2),
                model_path VARCHAR(500),
                feature_config JSONB,
                hyperparameters JSONB,
                performance_by_type JSONB,
                performance_by_price_range JSONB,
                is_active BOOLEAN DEFAULT FALSE NOT NULL,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_model_versions_active 
            ON avm_model_versions(is_active)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_avm_model_versions_version 
            ON avm_model_versions(version)
        """))
        
        print("  ✓ avm_model_versions table created")
        print()
        
        # Commit changes
        conn.commit()
        
        # Verify tables exist
        print("Verifying tables...")
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('avm_valuations', 'avm_comparables', 'avm_model_versions')
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        print(f"  ✓ Found {len(tables)} AVM tables: {', '.join(tables)}")
        print()
        
        # Get row counts
        print("Current row counts:")
        for table in tables:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"  {table}: {count:,} rows")
        
        print()
        print("="*80)
        print("✅ AVM TABLES CREATED SUCCESSFULLY")
        print("="*80)
        print()
        
        return True


def register_model_version():
    """Register the trained model version in the database."""
    
    print("Registering model version...")
    
    engine = create_engine(settings.database_url)
    
    # Load model metrics
    import json
    from app.avm.config import MODEL_VERSION
    
    metrics_path = f'backend/models/avm/metrics_{MODEL_VERSION}.json'
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)
    
    # Load feature importance
    import pandas as pd
    feature_importance_path = f'backend/models/avm/feature_importance_{MODEL_VERSION}.csv'
    feature_importance = pd.read_csv(feature_importance_path)
    top_10_features = feature_importance.head(10).to_dict('records')
    
    with engine.connect() as conn:
        # Check if version already exists
        result = conn.execute(
            text("SELECT id FROM avm_model_versions WHERE version = :version"),
            {"version": MODEL_VERSION}
        )
        
        if result.fetchone():
            print(f"  ℹ Model version {MODEL_VERSION} already registered")
            
            # Update to active
            conn.execute(
                text("UPDATE avm_model_versions SET is_active = FALSE")
            )
            conn.execute(
                text("UPDATE avm_model_versions SET is_active = TRUE WHERE version = :version"),
                {"version": MODEL_VERSION}
            )
            conn.commit()
            print(f"  ✓ Set {MODEL_VERSION} as active model")
        else:
            # Deactivate all other models
            conn.execute(text("UPDATE avm_model_versions SET is_active = FALSE"))
            
            # Insert new model version
            conn.execute(text("""
                INSERT INTO avm_model_versions (
                    version, training_date, training_samples, mae, mape, 
                    r2_score, rmse, model_path, is_active, notes
                ) VALUES (
                    :version, :training_date, :training_samples, :mae, :mape,
                    :r2_score, :rmse, :model_path, :is_active, :notes
                )
            """), {
                "version": MODEL_VERSION,
                "training_date": datetime.now(),
                "training_samples": 8159,  # From training
                "mae": metrics['test_mae'],
                "mape": metrics['test_mape'],
                "r2_score": metrics['test_r2'],
                "rmse": metrics['test_rmse'],
                "model_path": f'backend/models/avm/avm_model_{MODEL_VERSION}.pkl',
                "is_active": True,
                "notes": f"Initial AVM model. Test MAPE: {metrics['test_mape']:.2f}%, R²: {metrics['test_r2']:.4f}"
            })
            
            conn.commit()
            print(f"  ✓ Registered model version {MODEL_VERSION}")
            print(f"  ✓ Set as active model")
    
    print()


if __name__ == "__main__":
    try:
        # Create tables
        create_avm_tables()
        
        # Register model version
        register_model_version()
        
        print("Next steps:")
        print("  1. Run: python scripts/precompute_all_avms.py")
        print("  2. This will calculate AVMs for all 220K parcels")
        print()
        
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


