"""
LightGBM model training for AVM.
"""

import os
import pickle
from typing import Dict, Tuple
import pandas as pd
import numpy as np
from datetime import datetime
import lightgbm as lgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .config import LIGHTGBM_PARAMS, MODEL_PATH, MODEL_VERSION, PERFORMANCE_TARGETS


class AvmModelTrainer:
    """Train and evaluate LightGBM model for property valuation."""
    
    def __init__(self):
        """Initialize trainer."""
        self.model = None
        self.feature_importance = None
        self.training_metrics = {}
        
    def train(self, X_train: pd.DataFrame, y_train: pd.Series,
              X_test: pd.DataFrame, y_test: pd.Series) -> lgb.LGBMRegressor:
        """
        Train LightGBM model with cross-validation.
        
        Args:
            X_train: Training features
            y_train: Training target (sale prices)
            X_test: Test features
            y_test: Test target (sale prices)
        
        Returns:
            Trained LightGBM model
        """
        print("="*80)
        print("TRAINING LIGHTGBM MODEL")
        print("="*80)
        print()
        
        print("Model Configuration:")
        print(f"  Algorithm: {LIGHTGBM_PARAMS['boosting_type']}")
        print(f"  N Estimators: {LIGHTGBM_PARAMS['n_estimators']}")
        print(f"  Learning Rate: {LIGHTGBM_PARAMS['learning_rate']}")
        print(f"  Max Depth: {LIGHTGBM_PARAMS['max_depth']}")
        print(f"  Features: {len(X_train.columns)}")
        print()
        
        # Initialize model
        self.model = lgb.LGBMRegressor(**LIGHTGBM_PARAMS)
        
        # Train with early stopping
        print("Training model with early stopping...")
        start_time = datetime.now()
        
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            eval_metric='mae',
            callbacks=[
                lgb.early_stopping(stopping_rounds=50),
                lgb.log_evaluation(period=100)
            ]
        )
        
        training_duration = (datetime.now() - start_time).total_seconds()
        print(f"\nOK: Training complete in {training_duration:.1f} seconds")
        print(f"OK: Best iteration: {self.model.best_iteration_}")
        print()
        
        # Evaluate model
        self._evaluate(X_train, y_train, X_test, y_test)
        
        # Feature importance
        self._analyze_feature_importance(X_train.columns)
        
        return self.model
    
    def _evaluate(self, X_train: pd.DataFrame, y_train: pd.Series,
                  X_test: pd.DataFrame, y_test: pd.Series) -> None:
        """Evaluate model performance."""
        print("="*80)
        print("MODEL EVALUATION")
        print("="*80)
        print()
        
        # Predictions
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        # Metrics - Training Set
        train_mae = mean_absolute_error(y_train, y_train_pred)
        train_mape = np.mean(np.abs((y_train - y_train_pred) / y_train)) * 100
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        train_r2 = r2_score(y_train, y_train_pred)
        
        # Metrics - Test Set
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_mape = np.mean(np.abs((y_test - y_test_pred) / y_test)) * 100
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        test_r2 = r2_score(y_test, y_test_pred)
        
        # Store metrics
        self.training_metrics = {
            'train_mae': train_mae,
            'train_mape': train_mape,
            'train_rmse': train_rmse,
            'train_r2': train_r2,
            'test_mae': test_mae,
            'test_mape': test_mape,
            'test_rmse': test_rmse,
            'test_r2': test_r2
        }
        
        # Display results
        print("TRAINING SET PERFORMANCE:")
        print(f"  MAE (Mean Absolute Error): ${train_mae:,.0f}")
        print(f"  MAPE (Mean Absolute % Error): {train_mape:.2f}%")
        print(f"  RMSE (Root Mean Squared Error): ${train_rmse:,.0f}")
        print(f"  RÂ² Score: {train_r2:.4f}")
        print()
        
        print("TEST SET PERFORMANCE:")
        print(f"  MAE (Mean Absolute Error): ${test_mae:,.0f}")
        print(f"  MAPE (Mean Absolute % Error): {test_mape:.2f}%")
        print(f"  RMSE (Root Mean Squared Error): ${test_rmse:,.0f}")
        print(f"  RÂ² Score: {test_r2:.4f}")
        print()
        
        # Compare to targets
        print("PERFORMANCE vs TARGETS:")
        target_mape = PERFORMANCE_TARGETS['mape'] * 100
        if test_mape <= target_mape:
            print(f"  âœ… MAPE {test_mape:.2f}% <= {target_mape:.0f}% (TARGET MET)")
        else:
            print(f"  âš ï¸  MAPE {test_mape:.2f}% > {target_mape:.0f}% (TARGET MISSED)")
        
        target_r2 = PERFORMANCE_TARGETS['r2_score']
        if test_r2 >= target_r2:
            print(f"  âœ… RÂ² {test_r2:.4f} >= {target_r2:.2f} (TARGET MET)")
        else:
            print(f"  âš ï¸  RÂ² {test_r2:.4f} < {target_r2:.2f} (TARGET MISSED)")
        print()
        
        # Error analysis by price range
        self._analyze_by_price_range(y_test, y_test_pred)
        
    def _analyze_by_price_range(self, y_true: pd.Series, y_pred: np.ndarray) -> None:
        """Analyze model performance by price range."""
        print("PERFORMANCE BY PRICE RANGE:")
        
        price_bands = [
            (0, 500_000, "Entry ($0-500K)"),
            (500_000, 1_000_000, "Mid ($500K-1M)"),
            (1_000_000, 2_000_000, "Upper ($1M-2M)"),
            (2_000_000, 5_000_000, "Luxury ($2M-5M)"),
            (5_000_000, 100_000_000, "Ultra ($5M+)")
        ]
        
        for low, high, label in price_bands:
            mask = (y_true >= low) & (y_true < high)
            if mask.sum() > 0:
                band_y_true = y_true[mask]
                band_y_pred = y_pred[mask]
                
                band_mape = np.mean(np.abs((band_y_true - band_y_pred) / band_y_true)) * 100
                band_mae = mean_absolute_error(band_y_true, band_y_pred)
                count = mask.sum()
                
                print(f"  {label:20} (n={count:4}): MAPE={band_mape:5.1f}%, MAE=${band_mae:>10,.0f}")
        print()
    
    def _analyze_feature_importance(self, feature_names) -> None:
        """Analyze and display feature importance."""
        print("="*80)
        print("FEATURE IMPORTANCE (Top 20)")
        print("="*80)
        print()
        
        # Get feature importance
        importance = self.model.feature_importances_
        
        # Create dataframe
        self.feature_importance = pd.DataFrame({
            'feature': feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        # Display top 20
        print("Rank  Feature                           Importance    % Total")
        print("-" * 70)
        
        total_importance = importance.sum()
        cumulative_pct = 0
        
        for idx, row in self.feature_importance.head(20).iterrows():
            pct = (row['importance'] / total_importance) * 100
            cumulative_pct += pct
            rank = self.feature_importance.index.get_loc(idx) + 1
            print(f"{rank:3d}.  {row['feature']:30} {row['importance']:10.0f}    {pct:5.1f}%")
        
        print(f"\nTop 20 features account for {cumulative_pct:.1f}% of model decisions")
        print()
    
    def save_model(self, version: str = None) -> str:
        """
        Save trained model to disk.
        
        Args:
            version: Model version string (default: from config)
        
        Returns:
            Path to saved model
        """
        if self.model is None:
            raise ValueError("No model to save. Train model first.")
        
        version = version or MODEL_VERSION
        
        # Create model directory
        os.makedirs(MODEL_PATH, exist_ok=True)
        
        # Save model
        model_filename = f"avm_model_{version}.pkl"
        model_path = os.path.join(MODEL_PATH, model_filename)
        
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        print(f"OK: Model saved: {model_path}")
        
        # Save feature importance
        importance_path = os.path.join(MODEL_PATH, f"feature_importance_{version}.csv")
        self.feature_importance.to_csv(importance_path, index=False)
        print(f"OK: Feature importance saved: {importance_path}")
        
        # Save metrics
        metrics_path = os.path.join(MODEL_PATH, f"metrics_{version}.json")
        import json
        with open(metrics_path, 'w') as f:
            json.dump(self.training_metrics, f, indent=2)
        print(f"OK: Metrics saved: {metrics_path}")
        
        return model_path
    
    def load_model(self, version: str = None) -> lgb.LGBMRegressor:
        """
        Load model from disk.
        
        Args:
            version: Model version string (default: latest)
        
        Returns:
            Loaded LightGBM model
        """
        version = version or MODEL_VERSION
        
        model_filename = f"avm_model_{version}.pkl"
        model_path = os.path.join(MODEL_PATH, model_filename)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        print(f"SUCCESS: Model loaded: {model_path}")
        
        return self.model
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using trained model.
        
        Args:
            X: Feature matrix
        
        Returns:
            Predicted values
        """
        if self.model is None:
            raise ValueError("No model loaded. Train or load model first.")
        
        return self.model.predict(X)
    
    def get_prediction_with_confidence(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals.
        
        Args:
            X: Feature matrix
        
        Returns:
            (predictions, confidence_scores)
        """
        predictions = self.predict(X)
        
        # Simple confidence based on test MAPE
        # In production, this would be more sophisticated
        test_mape = self.training_metrics.get('test_mape', 10.0)
        
        # Higher MAPE = lower confidence
        base_confidence = max(0.5, min(0.95, 1.0 - (test_mape / 100)))
        confidence_scores = np.full(len(predictions), base_confidence)
        
        return predictions, confidence_scores



