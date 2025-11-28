import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from .base import BaseModelWrapper

EPS = 1e-12

class RollingQuantileWrapper(BaseModelWrapper):
    """
    Wrapper for RollingQuantileDetector anomaly detection models.
    Detects anomalies using rolling quantiles and IQR-based thresholds.
    """

    def __init__(self, model_dict: Dict[str, Any] = None):
        # Handle both direct instantiation and dict-based initialization
        if model_dict is None:
            model_dict = {}
        elif not isinstance(model_dict, dict):
            # If it's a direct RollingQuantileDetector model object, wrap it
            self.rolling_model = model_dict
            # Extract parameters from the object
            self.window_size = getattr(model_dict, 'window_size', 2)
            self.lower_quantile = getattr(model_dict, 'lower_quantile', 0.25)
            self.upper_quantile = getattr(model_dict, 'upper_quantile', 0.75)
            self.iqr_multiplier = getattr(model_dict, 'iqr_multiplier', 2.0)
            self.voting_threshold = getattr(model_dict, 'voting_threshold', 0.3)

            # Create dummy model_dict for base class
            model_dict = {
                "model_type": "rolling_quantile",
                "model_name": "rolling_quantile_detector",
                "training_params": {"anomaly_threshold": self.voting_threshold},
                "config": {"anomaly_threshold": self.voting_threshold}
            }

        super().__init__(model_dict)

        # If rolling_model was passed directly, use it
        if hasattr(self, 'rolling_model'):
            pass  # Already set above
        else:
            # Extract model from dict if available
            self.rolling_model = model_dict.get("rolling_model")

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict anomalies: 0 for normal, 1 for anomaly.
        Uses rolling quantile anomaly detection.
        """
        scores = self.predict_proba(X)
        # If predict_proba returns 2D, take the anomaly class (column 1)
        if scores.ndim == 2:
            raw_scores = scores[:, 1]
        else:
            raw_scores = scores

        threshold = float(self.anomaly_threshold or self.voting_threshold or 0.3)
        return (raw_scores >= threshold).astype(int)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Return anomaly scores as probabilities [normal_prob, anomaly_prob].
        Uses rolling quantile anomaly detection logic.
        """
        numeric = self._ensure_numeric(X)
        n = len(numeric)

        if n == 0:
            return np.array([[1.0, 0.0]])

        anomaly_scores = np.zeros(n, dtype=float)

        if hasattr(self, 'rolling_model') and self.rolling_model is not None:
            # If we have the actual RollingQuantileDetector object
            if hasattr(self.rolling_model, 'predict_proba'):
                # Try using the model's own prediction method
                try:
                    probs = self.rolling_model.predict_proba(numeric)
                    if probs.ndim == 1:
                        anomaly_scores = probs
                    else:
                        anomaly_scores = probs[:, 1] if probs.shape[1] > 1 else probs[:, 0]
                except Exception as e:
                    # Fallback to manual implementation
                    print(f"Error using model predict_proba: {e}, falling back to manual implementation")
                    anomaly_scores = self._manual_predict_proba(numeric)
            else:
                # Use manual implementation
                anomaly_scores = self._manual_predict_proba(numeric)
        else:
            # Manual implementation based on stored parameters
            anomaly_scores = self._manual_predict_proba(numeric)

        # Ensure anomaly_scores are in [0, 1]
        anomaly_scores = np.clip(anomaly_scores, 0.0, 1.0)

        prob_anomaly = anomaly_scores
        prob_normal = 1 - anomaly_scores

        return np.column_stack([prob_normal, prob_anomaly])

    def _manual_predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Manual implementation of rolling quantile anomaly detection.
        """
        if not hasattr(self, 'rolling_model') or self.rolling_model is None:
            # Simple fallback - basic outlier detection
            return self._simple_anomaly_scores(X)

        sensor_params = getattr(self.rolling_model, 'sensor_params', {})
        window_size = getattr(self.rolling_model, 'window_size', 2)
        lower_quantile = getattr(self.rolling_model, 'lower_quantile', 0.25)
        upper_quantile = getattr(self.rolling_model, 'upper_quantile', 0.75)
        iqr_multiplier = getattr(self.rolling_model, 'iqr_multiplier', 2.0)

        n = len(X)
        anomaly_scores = np.zeros(n, dtype=float)

        for sensor in X.columns:
            if sensor not in sensor_params:
                continue

            series = X[sensor].values
            params = sensor_params[sensor]

            # Rolling quantile computation
            lower_bounds = []
            upper_bounds = []

            for i in range(n):
                start_idx = max(0, i - window_size + 1)
                window_data = series[start_idx:i+1]

                if len(window_data) > 0:
                    # Compute quantiles
                    q25 = np.percentile(window_data, lower_quantile * 100)
                    q75 = np.percentile(window_data, upper_quantile * 100)
                    iqr = q75 - q25
                    lower_bound = q25 - iqr_multiplier * iqr
                    upper_bound = q75 + iqr_multiplier * iqr

                    lower_bounds.append(lower_bound)
                    upper_bounds.append(upper_bound)
                else:
                    lower_bounds.append(params.get('global_lower', series[i] if len(series) > i else 0))
                    upper_bounds.append(params.get('global_upper', series[i] if len(series) > i else 0))

            # Count anomalies for this sensor
            lower_bounds = np.array(lower_bounds)
            upper_bounds = np.array(upper_bounds)

            sensor_anomalies = ((series < lower_bounds) | (series > upper_bounds)).astype(float)
            anomaly_scores += sensor_anomalies

        # Normalize by number of sensors
        if len(X.columns) > 0:
            anomaly_scores = anomaly_scores / len(X.columns)

        return anomaly_scores

    def _simple_anomaly_scores(self, X: pd.DataFrame) -> np.ndarray:
        """
        Simple fallback anomaly scoring using global statistics outlier detection.
        """
        numeric = self._ensure_numeric(X)
        n = len(numeric)

        anomaly_scores = np.zeros(n, dtype=float)

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

        # Average across columns
        n_cols = max(len(numeric.columns), 1)
        anomaly_scores = anomaly_scores / n_cols

        # Normalize to [0, 1]
        max_score = np.max(anomaly_scores) if len(anomaly_scores) > 0 else 1.0
        if max_score > 0:
            anomaly_scores = anomaly_scores / max_score

        return anomaly_scores
