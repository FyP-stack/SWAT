import numpy as np
import pandas as pd
from typing import Dict, Any
from .base import BaseModelWrapper

EPS = 1e-12

class CUSUMWrapper(BaseModelWrapper):
    """
    Wrapper for CUSUM (Cumulative Sum Control Chart) anomaly detection models.
    CUSUM detects anomalies by monitoring cumulative deviations from expected values.
    """

    def __init__(self, model_dict: Dict[str, Any] = None):
        # Handle both direct instantiation and dict-based initialization
        if model_dict is None:
            model_dict = {}
        elif not isinstance(model_dict, dict):
            # If it's a direct CUSUM model object, wrap it
            self.cusum_model = model_dict
            model_dict = {
                "model_type": "cusum",
                "model_name": "cusum_detector",
                "training_params": {"anomaly_threshold": 5.0},
                "config": {"anomaly_threshold": 5.0}
            }
        
        super().__init__(model_dict)
        
        # If cusum_model was passed directly, use it
        if hasattr(self, 'cusum_model'):
            pass  # Already set above
        else:
            # Extract CUSUM model from dict if available
            self.cusum_model = model_dict.get("cusum_model")
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict anomalies: 0 for normal, 1 for anomaly.
        Uses raw anomaly scores and applies a threshold.
        """
        scores = self.predict_proba(X)
        # If predict_proba returns 2D, take the anomaly class (column 1)
        if scores.ndim == 2:
            raw_scores = scores[:, 1]
        else:
            raw_scores = scores
        
        threshold = float(self.anomaly_threshold or 0.5)
        return (raw_scores >= threshold).astype(int)
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Return anomaly scores as probabilities [normal_prob, anomaly_prob].
        Computes CUSUM-like scores efficiently using vectorized operations.
        """
        numeric = self._ensure_numeric(X)
        n = len(numeric)
        
        if n == 0:
            return np.array([[1.0, 0.0]])
        
        # Fast vectorized anomaly scoring:
        # For each sensor, compute z-score based on global statistics
        anomaly_scores = np.zeros(n, dtype=float)
        
        for col in numeric.columns:
            series = numeric[col].to_numpy(dtype=float)
            
            # Replace NaNs with column mean
            col_mean = np.nanmean(series)
            series = np.nan_to_num(series, nan=col_mean)
            
            # Compute global mean and std
            global_mean = np.mean(series)
            global_std = np.std(series)
            
            if global_std < EPS:
                # If no variation, this sensor doesn't contribute to anomaly detection
                continue
            
            # Compute z-scores efficiently
            z_scores = np.abs((series - global_mean) / (global_std + EPS))
            
            # Cap z-scores at 5 to avoid extreme values
            z_scores = np.minimum(z_scores, 5.0)
            
            anomaly_scores += z_scores
        
        # Average across columns
        n_cols = max(len(numeric.columns), 1)
        anomaly_scores = anomaly_scores / n_cols
        
        # Normalize to [0, 1]
        max_score = np.max(anomaly_scores) if len(anomaly_scores) > 0 else 1.0
        if max_score > 0:
            anomaly_scores = anomaly_scores / max_score
        
        # Convert to probabilities
        anomaly_scores = np.clip(anomaly_scores, 0, 1)
        prob_anomaly = anomaly_scores
        prob_normal = 1 - anomaly_scores
        
        return np.column_stack([prob_normal, prob_anomaly])
