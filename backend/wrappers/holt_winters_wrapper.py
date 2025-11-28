import numpy as np
import pandas as pd
from typing import Dict, Any
from .base import BaseModelWrapper

EPS = 1e-12

class HoltWintersWrapper(BaseModelWrapper):
    """
    Similar to ARIMA wrapper, but you could extend with seasonal smoothing specifics.
    Currently uses same residual logic; separated for future specialty (seasonal decomposition).
    """

    def __init__(self, model_dict: Dict[str, Any]):
        super().__init__(model_dict)
        self.models = model_dict.get("forecast_models") or {}
        self._sensor_weights = self._compute_inverse_frequency()

    def _compute_inverse_frequency(self):
        targets = [
            info.get("target_sensor")
            for info in self.models.values()
            if isinstance(info, dict) and info.get("target_sensor")
        ]
        from collections import Counter
        freq = Counter(targets)
        return {t: 1.0 / freq[t] for t in freq}

    def _fallback_forecast(self, info, series):
        last_vals = info.get("last_values")
        if last_vals:
            return np.full(len(series), float(last_vals[-1]), dtype=float)
        window = int(info.get("window_size", 0) or 0)
        if window > 1:
            csum = np.concatenate(([0.0], np.cumsum(series)))
            out = np.empty(len(series), dtype=float)
            for i in range(min(window, len(series))):
                out[i] = series[0] if i == 0 else csum[i]/i
            if len(series) > window:
                idx = np.arange(window, len(series)+1)
                ws = csum[idx] - csum[idx-window]
                out[window:] = ws / window
            return out
        return np.full(len(series), float(np.nanmean(series)), dtype=float)

    def _aggregate_score(self, X: pd.DataFrame) -> np.ndarray:
        numeric = self._ensure_numeric(X)
        n = len(numeric)
        if n == 0:
            return np.zeros(0, dtype=float)
        total = np.zeros(n, dtype=float)
        for key, info in self.models.items():
            if not isinstance(info, dict):
                continue
            sensor = info.get("target_sensor")
            if not sensor or sensor not in numeric.columns:
                continue
            series = numeric[sensor].to_numpy(dtype=float)
            # Future: use true Holt-Winters model if stored
            forecast = self._fallback_forecast(info, series)
            if forecast.shape[0] != series.shape[0]:
                forecast = np.resize(forecast, series.shape[0])
            residual = series - forecast
            std = residual.std()
            if std < EPS:
                continue
            zvals = np.abs(residual / (std + EPS))
            zth = float(info.get("z_threshold", 3.0))
            viol = (zvals > zth).astype(float)
            w = self._sensor_weights.get(sensor, 1.0)
            imp = float(info.get("importance", 1.0))
            total += viol * w * imp
        return total

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        raw = self._aggregate_score(X)
        thr = float(self.anomaly_threshold or 1.0)
        return (raw >= thr).astype(int)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        raw = self._aggregate_score(X)
        if raw.size == 0:
            return np.array([[1.0, 0.0]])
        center = float(self.anomaly_threshold or 1.0)
        scale = max(sum(self._sensor_weights.values())/3.0, 0.75)
        logits = (raw - center)/(scale + EPS)
        prob = 1/(1 + np.exp(-logits))
        prob = np.clip(prob, 1e-5, 1-1e-5)
        return np.column_stack([1-prob, prob])