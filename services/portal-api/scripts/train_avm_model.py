"""
Train AVM model using prepared training data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from datetime import datetime
from app.avm.training import AvmModelTrainer
from app.avm.config import FEATURE_COLUMNS, MODEL_VERSION

def main():
    """Train AVM model."""
    
    print("\n" + "="*80)
    print("AVM MODEL TRAINING")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Model Version: {MODEL_VERSION}")
    print("="*80 + "\n")
    
    try:
        # Load prepared training data
        print("Loading prepared training data...")
        df_train = pd.read_csv('backend/data/avm/train_data.csv')
        df_test = pd.read_csv('backend/data/avm/test_data.csv')
        
        print(f"  ✓ Training data: {len(df_train):,} records")
        print(f"  ✓ Test data: {len(df_test):,} records")
        print()
        
        # Separate features and target
        X_train = df_train[FEATURE_COLUMNS]
        y_train = df_train['last_sale_price']
        X_test = df_test[FEATURE_COLUMNS]
        y_test = df_test['last_sale_price']
        
        # Initialize trainer
        trainer = AvmModelTrainer()
        
        # Train model
        model = trainer.train(X_train, y_train, X_test, y_test)
        
        # Save model
        print("="*80)
        print("SAVING MODEL")
        print("="*80)
        print()
        
        model_path = trainer.save_model(version=MODEL_VERSION)
        
        print()
        print("="*80)
        print("✅ MODEL TRAINING COMPLETE!")
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        print()
        
        # Summary
        print("📊 SUMMARY:")
        print(f"  Model Version: {MODEL_VERSION}")
        print(f"  Training Samples: {len(df_train):,}")
        print(f"  Test Samples: {len(df_test):,}")
        print(f"  Features: {len(FEATURE_COLUMNS)}")
        print(f"  Test MAPE: {trainer.training_metrics['test_mape']:.2f}%")
        print(f"  Test R²: {trainer.training_metrics['test_r2']:.4f}")
        print(f"  Model Path: {model_path}")
        print()
        
        print("Next steps:")
        print("  1. Review feature_importance CSV")
        print("  2. Test predictions: python scripts/test_avm_predictions.py")
        print("  3. Create database migration for AVM tables")
        print("  4. Pre-compute AVMs for all parcels")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


