"""
Analyze model prediction bias - does it tend to over or under-estimate?
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from app.avm.training import AvmModelTrainer
from app.avm.config import FEATURE_COLUMNS, MODEL_VERSION

def analyze_bias():
    """Analyze model prediction bias."""
    
    print("\n" + "="*80)
    print("AVM MODEL BIAS ANALYSIS")
    print("="*80)
    print()
    
    # Load test data
    print("Loading test data...")
    df_test = pd.read_csv('backend/data/avm/test_data.csv')
    X_test = df_test[FEATURE_COLUMNS]
    y_test = df_test['last_sale_price']
    
    # Load model
    trainer = AvmModelTrainer()
    trainer.load_model(version=MODEL_VERSION)
    
    # Make predictions
    print("Making predictions...")
    y_pred = trainer.predict(X_test)
    
    # Calculate bias metrics
    print()
    print("="*80)
    print("OVERALL BIAS ANALYSIS")
    print("="*80)
    print()
    
    # Raw error (not absolute)
    errors = y_pred - y_test
    mean_error = np.mean(errors)
    median_error = np.median(errors)
    
    # Percentage bias
    pct_errors = (y_pred - y_test) / y_test * 100
    mean_pct_error = np.mean(pct_errors)
    median_pct_error = np.median(pct_errors)
    
    # Count over vs under predictions
    over_predictions = (y_pred > y_test).sum()
    under_predictions = (y_pred < y_test).sum()
    exact_predictions = (y_pred == y_test).sum()
    
    print(f"Mean Error: ${mean_error:,.0f}")
    if mean_error > 0:
        print(f"  → Model tends to OVER-ESTIMATE by ${abs(mean_error):,.0f} on average")
    elif mean_error < 0:
        print(f"  → Model tends to UNDER-ESTIMATE by ${abs(mean_error):,.0f} on average")
    else:
        print(f"  → Model is perfectly balanced!")
    
    print(f"\nMedian Error: ${median_error:,.0f}")
    if median_error > 0:
        print(f"  → Typical prediction is ${abs(median_error):,.0f} TOO HIGH")
    elif median_error < 0:
        print(f"  → Typical prediction is ${abs(median_error):,.0f} TOO LOW")
    else:
        print(f"  → Typical prediction is spot on!")
    
    print(f"\nMean % Error: {mean_pct_error:+.2f}%")
    print(f"Median % Error: {median_pct_error:+.2f}%")
    
    print(f"\nPrediction Distribution:")
    print(f"  Over-predictions: {over_predictions:,} ({over_predictions/len(y_test)*100:.1f}%)")
    print(f"  Under-predictions: {under_predictions:,} ({under_predictions/len(y_test)*100:.1f}%)")
    print(f"  Exact predictions: {exact_predictions:,} ({exact_predictions/len(y_test)*100:.1f}%)")
    
    # Bias interpretation
    print()
    if abs(mean_pct_error) < 2.0:
        print("✅ EXCELLENT: Model has very low bias (<2%)")
        print("   Predictions are well-balanced between over and under-estimates")
    elif abs(mean_pct_error) < 5.0:
        print("✅ GOOD: Model has acceptable bias (<5%)")
        print("   Slight tendency but within acceptable range")
    else:
        print("⚠️  WARNING: Model has significant bias (>5%)")
        print("   May need recalibration")
    
    # Bias by price range
    print()
    print("="*80)
    print("BIAS BY PRICE RANGE")
    print("="*80)
    print()
    
    price_bands = [
        (0, 500_000, "Entry ($0-500K)"),
        (500_000, 1_000_000, "Mid ($500K-1M)"),
        (1_000_000, 2_000_000, "Upper ($1M-2M)"),
        (2_000_000, 5_000_000, "Luxury ($2M-5M)"),
        (5_000_000, 100_000_000, "Ultra ($5M+)")
    ]
    
    print(f"{'Price Range':20} {'Count':>6} {'Mean Error':>15} {'% Bias':>10} {'Direction':>12}")
    print("-" * 80)
    
    for low, high, label in price_bands:
        mask = (y_test >= low) & (y_test < high)
        if mask.sum() > 0:
            band_errors = errors[mask]
            band_pct_errors = pct_errors[mask]
            
            band_mean_error = np.mean(band_errors)
            band_mean_pct = np.mean(band_pct_errors)
            count = mask.sum()
            
            if band_mean_pct > 1:
                direction = "Over"
            elif band_mean_pct < -1:
                direction = "Under"
            else:
                direction = "Balanced"
            
            print(f"{label:20} {count:6,} ${band_mean_error:>13,.0f} {band_mean_pct:>9.1f}% {direction:>12}")
    
    # Extreme errors analysis
    print()
    print("="*80)
    print("EXTREME PREDICTION ANALYSIS")
    print("="*80)
    print()
    
    # Find largest over-predictions
    top_over_idx = np.argsort(errors)[-5:][::-1]
    print("Top 5 OVER-PREDICTIONS:")
    print(f"{'Actual':>12} {'Predicted':>12} {'Error':>12} {'% Error':>10}")
    print("-" * 50)
    for idx in top_over_idx:
        actual = y_test.iloc[idx]
        predicted = y_pred[idx]
        error = predicted - actual
        pct_error = (error / actual) * 100
        print(f"${actual:>10,.0f} ${predicted:>10,.0f} ${error:>10,.0f} {pct_error:>9.1f}%")
    
    print()
    
    # Find largest under-predictions
    top_under_idx = np.argsort(errors)[:5]
    print("Top 5 UNDER-PREDICTIONS:")
    print(f"{'Actual':>12} {'Predicted':>12} {'Error':>12} {'% Error':>10}")
    print("-" * 50)
    for idx in top_under_idx:
        actual = y_test.iloc[idx]
        predicted = y_pred[idx]
        error = predicted - actual
        pct_error = (error / actual) * 100
        print(f"${actual:>10,.0f} ${predicted:>10,.0f} ${error:>10,.0f} {pct_error:>9.1f}%")
    
    print()
    print("="*80)
    print("✅ BIAS ANALYSIS COMPLETE")
    print("="*80)
    print()


if __name__ == "__main__":
    analyze_bias()


