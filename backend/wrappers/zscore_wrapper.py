import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from .base import BaseModelWrapper

EPS = 1e-12

class ZScoreWrapper(BaseModelWrapper):
    """
    Wrapper for ZScoreDynamicThreshold anomaly detection models.
    Simple z-score based anomaly detection using dynamic thresholds.
    """

    def __init__(self, model_dict: Dict[str, Any] = None):
        # Handle both direct instantiation and dict-based initialization
        if model_dict is None:
            model_dict = {}
        elif not isinstance(model_dict, dict):
            # If it's a direct ZScoreDynamicThreshold model object, wrap it
            self.zscore_model = model_dict
            # Extract parameters from the object
            self.threshold_multiplier = getattr(model_dict, 'threshold_multiplier', 3.0)

            # Create dummy model_dict for base class
            model_dict = {
                "model_type": "zscore",
                "model_name": "zscore_detector",
                "training_params": {"anomaly_threshold": 0.5},
                "config": {"anomaly_threshold": 0.5}
            }

        super().__init__(model_dict)

        # If zscore_model was passed directly, use it
        if hasattr(self, 'zscore_model'):
            pass  # Already set above
        else:
            # Extract model from dict if available
            self.zscore_model = model_dict.get("zscore_model")

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict anomalies: 0 for normal, 1 for anomaly.
        Uses z-score based anomaly detection.
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
        Uses z-score anomaly detection logic.
        """
        numeric = self._ensure_numeric(X)
        n = len(numeric)

        if n == 0:
            return np.array([[1.0, 0.0]])

        anomaly_scores = np.zeros(n, dtype=float)

        if hasattr(self, 'zscore_model') and self.zscore_model is not None:
            # If we have the actual ZScoreDynamicThreshold object, use its parameters
            threshold_multiplier = getattr(self.zscore_model, 'threshold_multiplier', 3.0)

            # Use stored sensor statistics if available
            sensor_stats = getattr(self.zscore_model, 'sensor_stats', {})

            for col in numeric.columns:
                series = numeric[col].to_numpy(dtype=float)

                # Replace NaNs with column mean
                col_mean = np.nanmean(series)
                series = np.nan_to_num(series, nan=col_mean)

                # Compute dynamic statistics for the current window
                global_mean = np.mean(series)
                global_std = np.std(series)

                if global_std < EPS:
                    continue

                z_scores = np.abs((series - global_mean) / (global_std + EPS))
                threshold = threshold_multiplier
                sensor_anomalies = (z_scores > threshold).astype(float)
                anomaly_scores += sensor_anomalies
        else:
            # Fallback simple implementation
            for col in numeric.columns:
                series = numeric[col].to_numpy(dtype=float)

                # Replace NaNs with column mean
                col_mean = np.nanmean(series)
                series = np.nan_to_num(series, nan=col_mean)

                # Simple z-score based anomaly detection
                global_mean = np.mean(series)
                global_std = np.std(series)

                if global_std < EPS:
                    continue

                z_scores = np.abs((series - global_mean) / (global_std + EPS))
                z_scores = np.minimum(z_scores, 5.0)  # Cap at 5
                anomaly_scores += z_scores

        # Normalize by number of sensors
        if len(numeric.columns) > 0:
            anomaly_scores = anomaly_scores / len(numeric.columns)

        # Normalize to [0, 1]
        max_score = np.max(anomaly_scores) if len(anomaly_scores) > 0 else 1.0
        if max_score > 0:
            anomaly_scores = anomaly_scores / max_score

        # Ensure anomaly_scores are in [0, 1]
        anomaly_scores = np.clip(anomaly_scores, 0.0, 1.0)

        prob_anomaly = anomaly_scores
        prob_normal = 1 - anomaly_scores

        return np.column_stack([prob_normal, prob_anomaly])
