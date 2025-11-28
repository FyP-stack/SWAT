import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.base import BaseEstimator
from pathlib import Path
import pickle
import collections

EPS = 1e-12

def _safe_float(x):
    try:
        return float(x)
    except Exception:
        return None

class GrangerAnomalyDetector(BaseEstimator):
    """
    Differentiated Granger-based wrapper:
      - Uses forecast_models/arima_models entries.
      - Residual z-scores per target_sensor.
      - Per-entry z_threshold (diversified), window_size (diversified), importance (diversified).
      - Inverse-frequency sensor weighting to avoid duplicate inflation.
      - Binary predict uses model-level anomaly_threshold (diversified).
      - predict_proba uses a logistic mapping centered at anomaly_threshold to avoid saturation.
    """

    def __init__(self, granger_data: Dict[str, Any]):
        if not isinstance(granger_data, dict):
            raise TypeError("GrangerAnomalyDetector expects a dict.")
        self.granger_data = granger_data
        self.forecast_models = (
            granger_data.get("forecast_models")
            or granger_data.get("arima_models")
            or {}
        )
        self.training_params = granger_data.get("training_params", {})
        self.config = granger_data.get("config", {})
        self.anomaly_threshold = _safe_float(
            self.training_params.get(
                "anomaly_threshold",
                self.config.get("anomaly_threshold", 1.0)
            )
        )

        self.model_name = (
            granger_data.get("model_name")
            or granger_data.get("name")
            or granger_data.get("id")
            or f"model_{hex(id(granger_data))[2:]}"
        )

        # Build inverse-frequency weights per target sensor
        targets = [
            info.get("target_sensor")
            for info in self.forecast_models.values()
            if isinstance(info, dict) and info.get("target_sensor")
        ]
        freq = collections.Counter(targets)
        self.sensor_weights = {sensor: 1.0 / freq[sensor] for sensor in freq}

        # Weighted coverage (used to normalize/scale scores)
        self.weight_total = sum(self.sensor_weights.values()) or 1.0

        # Number of forecast entries (informational)
        self.max_possible = len(self.forecast_models)

    def _load_fitted(self, fitted_path: str):
        p = Path(fitted_path)
        if not p.exists():
            return None
        try:
            with p.open("rb") as f:
                return pickle.load(f)
        except Exception:
            return None

    def _forecast_series(self, info: Dict[str, Any], series: np.ndarray) -> np.ndarray:
        """Compute or approximate the forecast for a single target series."""
        n = len(series)
        if n == 0:
            return np.array([], dtype=float)

        # Embedded fitted model
        fitted = info.get("fitted_model")
        if fitted is not None:
            try:
                if hasattr(fitted, "forecast"):
                    return np.asarray(fitted.forecast(steps=n), dtype=float)
                if hasattr(fitted, "predict"):
                    return np.asarray(fitted.predict(start=0, end=n-1), dtype=float)
            except Exception:
                pass

        # External fitted path
        fitted_path = info.get("fitted_path")
        if fitted_path:
            fm = self._load_fitted(fitted_path)
            if fm is not None:
                try:
                    if hasattr(fm, "forecast"):
                        return np.asarray(fm.forecast(steps=n), dtype=float)
                    if hasattr(fm, "predict"):
                        return np.asarray(fm.predict(start=0, end=n-1), dtype=float)
                except Exception:
                    pass

        # last_values fallback
        last_vals = info.get("last_values")
        if last_vals:
            return np.full(n, float(last_vals[-1]), dtype=float)

        # Moving average fallback based on window_size (diversified)
        window = int(info.get("window_size", 0) or 0)
        if window > 1:
            csum = np.concatenate(([0.0], np.cumsum(series)))
            out = np.empty(n, dtype=float)
            for i in range(min(window, n)):
                out[i] = series[0] if i == 0 else csum[i] / i
            if n > window:
                idx = np.arange(window, n + 1)
                ws = csum[idx] - csum[idx - window]
                out[window:] = ws / window
            return out

        # Mean fallback
        return np.full(n, float(np.nanmean(series)), dtype=float)

    def _aggregate_score(self, X: pd.DataFrame) -> np.ndarray:
        """Aggregate weighted violation counts across all forecast entries."""
        n = len(X)
        if n == 0:
            return np.zeros(0, dtype=float)

        numeric = X.select_dtypes(include=[np.number])
        if numeric.empty:
            return np.zeros(n, dtype=float)

        total_score = np.zeros(n, dtype=float)

        for key, info in self.forecast_models.items():
            if not isinstance(info, dict):
                continue

            target = info.get("target_sensor")
            if not target or target not in numeric.columns:
                continue

            series = numeric[target].to_numpy(dtype=float)
            forecast = self._forecast_series(info, series)
            if forecast.shape[0] != series.shape[0]:
                forecast = np.resize(forecast, series.shape[0])

            residual = series - forecast
            std = residual.std()
            if std < EPS:
                continue

            z_vals = np.abs(residual / (std + EPS))
            z_threshold = float(info.get("z_threshold", 3.0))
            violations = (z_vals > z_threshold).astype(float)

            base_weight = self.sensor_weights.get(target, 1.0)
            importance = float(info.get("importance", 1.0))  # diversified
            total_score += violations * base_weight * importance

        return total_score

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Binary prediction using raw score threshold at anomaly_threshold."""
        raw = self._aggregate_score(X)
        threshold = self.anomaly_threshold if (self.anomaly_threshold is not None) else 1.0
        return (raw >= threshold).astype(int)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Probability via logistic mapping centered around anomaly_threshold:
          prob = 1 / (1 + exp(-(raw - center)/scale))
        - center ~ anomaly_threshold (or half coverage if missing)
        - scale ~ weight_total/3 to avoid saturation across models with different sizes
        """
        raw = self._aggregate_score(X)
        if raw.size == 0:
            return np.array([[1.0, 0.0]])

        center = self.anomaly_threshold if (self.anomaly_threshold and self.anomaly_threshold > 0) else (self.weight_total * 0.5)
        scale = max(self.weight_total / 3.0, 0.75)

        logits = (raw - center) / (scale + EPS)
        prob = 1.0 / (1.0 + np.exp(-logits))
        prob = np.clip(prob, 1e-5, 1 - 1e-5)

        return np.column_stack([1 - prob, prob])