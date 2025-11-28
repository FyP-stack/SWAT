import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from .base import BaseModelWrapper

EPS = 1e-12

class EWMAControlChart:
    """
    EWMA (Exponentially Weighted Moving Average) Control Chart for anomaly detection.
    Detects anomalies by tracking deviations from expected values using exponential smoothing.
    """
    
    def __init__(self, alpha: float = 0.2, L: float = 3.0, threshold: float = 1.0):
        """
        Initialize EWMA control chart parameters.
        
        Args:
            alpha: Smoothing parameter (0 < alpha <= 1). Higher values give more weight to recent observations.
            L: Control chart limit multiplier for standard deviation.
            threshold: Anomaly threshold for classification.
        """
        self.alpha = alpha
        self.L = L
        self.threshold = threshold
        self.ewma_mean = None
        self.ewma_variance = None
        self.initialized = False
    
    def fit(self, X: np.ndarray) -> None:
        """Fit EWMA parameters from training data."""
        if len(X) == 0:
            self.ewma_mean = 0.0
            self.ewma_variance = 1.0
        else:
            self.ewma_mean = np.mean(X)
            self.ewma_variance = np.var(X) if np.var(X) > 0 else 1.0
        self.initialized = True
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Detect anomalies using EWMA.
        
        Returns:
            Binary predictions (0=normal, 1=anomaly)
        """
        scores = self._compute_ewma_scores(X)
        return (scores >= self.threshold).astype(int)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Return anomaly scores as probabilities.
        
        Returns:
            2D array of shape (n, 2) with [normal_prob, anomaly_prob]
        """
        scores = self._compute_ewma_scores(X)
        scores = np.clip(scores, 0, 1)
        return np.column_stack([1 - scores, scores])
    
    def _compute_ewma_scores(self, X: np.ndarray) -> np.ndarray:
        """Compute anomaly scores using exponential weighted moving average."""
        if not self.initialized or self.ewma_variance is None:
            return np.zeros(len(X), dtype=float)
        
        X = np.asarray(X, dtype=float).ravel()
        n = len(X)
        scores = np.zeros(n, dtype=float)
        
        ewma = self.ewma_mean
        ewma_var = self.ewma_variance
        
        for i in range(n):
            x = X[i]
            
            # Handle NaN values
            if np.isnan(x):
                scores[i] = 0.0
                continue
            
            # Compute deviation from current EWMA
            deviation = abs(x - ewma)
            std_dev = np.sqrt(max(ewma_var, EPS))
            z_score = deviation / (std_dev + EPS)
            
            # Clip z-score to avoid extreme values
            z_score = min(z_score, 5.0)
            
            # Normalize to [0, 1]
            score = z_score / (self.L + EPS)
            scores[i] = min(score, 1.0)
            
            # Update EWMA for next iteration
            ewma = self.alpha * x + (1 - self.alpha) * ewma
            ewma_var = self.alpha * (x - ewma) ** 2 + (1 - self.alpha) * ewma_var
        
        return scores


class EWMAWrapper(BaseModelWrapper):
    """
    Wrapper for EWMA (Exponentially Weighted Moving Average) anomaly detection models.
    Provides a unified interface for EWMA-based anomaly detection.
    """
    
    def __init__(self, model_dict: Dict[str, Any]):
        super().__init__(model_dict)
        
        # Handle both dict-based and object-based models
        if isinstance(model_dict, dict):
            # Extract EWMA model or parameters
            self.ewma_model = model_dict.get("ewma_model")
            self.ewma_params = model_dict.get("ewma_params", {})
            self.sensor_params = model_dict.get("sensor_params", {})
        else:
            # If passed directly as an object (shouldn't happen with dict check, but be safe)
            self.ewma_model = None
            self.ewma_params = {}
            self.sensor_params = {}
        
        # If no EWMA model, create a default one
        if self.ewma_model is None:
            alpha = float(self.ewma_params.get("alpha", 0.2))
            L = float(self.ewma_params.get("L", 3.0))
            threshold = float(self.training_params.get("anomaly_threshold", 1.0))
            self.ewma_model = EWMAControlChart(alpha=alpha, L=L, threshold=threshold)
            
            # Try to fit with historical data if available
            fit_data = model_dict.get("fit_data") if isinstance(model_dict, dict) else None
            if fit_data is not None:
                self.ewma_model.fit(np.asarray(fit_data, dtype=float))
        
        # Ensure model is initialized
        if not getattr(self.ewma_model, 'initialized', False):
            self.ewma_model.initialized = True
            if self.ewma_model.ewma_mean is None:
                self.ewma_model.ewma_mean = 0.0
            if self.ewma_model.ewma_variance is None:
                self.ewma_model.ewma_variance = 1.0
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict anomalies: 0 for normal, 1 for anomaly.
        """
        scores = self.predict_proba(X)
        # Take the anomaly probability (column 1)
        raw_scores = scores[:, 1]
        threshold = float(self.anomaly_threshold or 0.5)
        return (raw_scores >= threshold).astype(int)
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Return anomaly scores as probabilities [normal_prob, anomaly_prob].
        Aggregates EWMA scores across all numeric columns.
        """
        numeric = self._ensure_numeric(X)
        n = len(numeric)
        
        if n == 0:
            return np.array([[1.0, 0.0]])
        
        # Aggregate anomaly scores across all columns
        aggregated_scores = np.zeros(n, dtype=float)
        n_cols = 0
        
        for col in numeric.columns:
            series = numeric[col].to_numpy(dtype=float)
            
            # Compute EWMA scores for this column
            col_scores = self.ewma_model._compute_ewma_scores(series)
            aggregated_scores += col_scores
            n_cols += 1
        
        # Average scores across columns
        if n_cols > 0:
            aggregated_scores = aggregated_scores / n_cols
        
        # Normalize to [0, 1]
        aggregated_scores = np.clip(aggregated_scores, 0, 1)
        
        # Convert to probabilities
        prob_anomaly = aggregated_scores
        prob_normal = 1 - aggregated_scores
        
        return np.column_stack([prob_normal, prob_anomaly])
