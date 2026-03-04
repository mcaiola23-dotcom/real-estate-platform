"""
Prepare and validate training data for AVM model.
This script runs the complete feature engineering pipeline and saves prepared data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from datetime import datetime
from app.avm.feature_engineering import AvmFeatureEngineer

def main():
    """Prepare AVM training data."""
    
    print("\n" + "="*80)
    print("AVM TRAINING DATA PREPARATION")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    # Initialize feature engineer
    engineer = AvmFeatureEngineer()
    
    try:
        # Run complete pipeline
        X_train, X_test, y_train, y_test, df_train, df_test = engineer.prepare_training_data()
        
        # Save prepared data
        print("="*80)
        print("SAVING PREPARED DATA")
        print("="*80)
        
        os.makedirs('backend/data/avm', exist_ok=True)
        
        # Save training data
        df_train.to_csv('backend/data/avm/train_data.csv', index=False)
        print(f"  ✓ Saved: backend/data/avm/train_data.csv ({len(df_train):,} records)")
        
        # Save test data
        df_test.to_csv('backend/data/avm/test_data.csv', index=False)
        print(f"  ✓ Saved: backend/data/avm/test_data.csv ({len(df_test):,} records)")
        
        # Save feature columns list
        feature_cols = X_train.columns.tolist()
        with open('backend/data/avm/feature_columns.txt', 'w') as f:
            f.write('\n'.join(feature_cols))
        print(f"  ✓ Saved: backend/data/avm/feature_columns.txt ({len(feature_cols)} features)")
        
        # Generate summary statistics
        print("\n" + "="*80)
        print("TRAINING DATA SUMMARY")
        print("="*80)
        
        summary = {
            'total_records': len(df_train) + len(df_test),
            'training_records': len(df_train),
            'test_records': len(df_test),
            'num_features': len(feature_cols),
            'median_price': float(y_train.median()),
            'min_price': float(y_train.min()),
            'max_price': float(y_train.max()),
            'cities': df_train['city'].nunique(),
            'property_types': df_train['property_type_clean'].value_counts().to_dict()
        }
        
        print(f"\n  Total Records: {summary['total_records']:,}")
        print(f"  Training Records: {summary['training_records']:,} ({summary['training_records']/summary['total_records']*100:.1f}%)")
        print(f"  Test Records: {summary['test_records']:,} ({summary['test_records']/summary['total_records']*100:.1f}%)")
        print(f"  Number of Features: {summary['num_features']}")
        print(f"\n  Price Statistics:")
        print(f"    Median: ${summary['median_price']:,.0f}")
        print(f"    Min: ${summary['min_price']:,.0f}")
        print(f"    Max: ${summary['max_price']:,.0f}")
        print(f"\n  Property Types:")
        for prop_type, count in summary['property_types'].items():
            print(f"    {prop_type}: {count:,} ({count/summary['training_records']*100:.1f}%)")
        
        # Feature importance preview (correlation with price)
        print(f"\n  Top 10 Features (by correlation with price):")
        correlations = X_train.corrwith(y_train).abs().sort_values(ascending=False).head(10)
        for feature, corr in correlations.items():
            print(f"    {feature}: {corr:.3f}")
        
        # Save summary
        import json
        with open('backend/data/avm/data_summary.json', 'w') as f:
            # Convert numpy types to native Python types
            summary_clean = {
                k: (dict(v) if isinstance(v, dict) else v) 
                for k, v in summary.items()
            }
            json.dump(summary_clean, f, indent=2)
        print(f"\n  ✓ Saved: backend/data/avm/data_summary.json")
        
        print("\n" + "="*80)
        print("✅ TRAINING DATA PREPARATION COMPLETE!")
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
        print("Next steps:")
        print("  1. Review data_summary.json")
        print("  2. Run training script: python scripts/train_avm_model.py")
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


