"""
Fast residual-based inference (optional; unchanged core except integrated with new loader logic).
"""
import time
from pathlib import Path
import numpy as np
import pandas as pd
from joblib import Parallel, delayed
from typing import Dict, Any, Tuple, Optional
import pickle
import warnings
warnings.filterwarnings("ignore")

_MODEL_DICT_CACHE: Dict[str, Dict[str, Any]] = {}
DEFAULT_THRESHOLD = 1
EPS = 1e-12

def _load_model_dict(model_path: Path) -> Dict[str, Any]:
    key = str(model_path)
    if key in _MODEL_DICT_CACHE:
        return _MODEL_DICT_CACHE[key]
    with model_path.open("rb") as f:
        data = pickle.load(f)
    if not isinstance(data, dict):
        raise TypeError("Model pickle should contain a dict of forecast models.")
    _MODEL_DICT_CACHE[key] = data
    return data

def _subset_columns(data_path: str, target_cols: list) -> pd.DataFrame:
    p = Path(data_path)
    if p.suffix.lower() in ('.parquet', '.parq'):
        return pd.read_parquet(p, columns=[c for c in target_cols if c])
    import pandas as pd
    return pd.read_csv(p)

def _forecast_vector(model_info: Dict[str, Any], series: np.ndarray) -> np.ndarray:
    n = len(series)
    fitted = model_info.get("fitted_model")
    if fitted is not None:
        try:
            if hasattr(fitted, "forecast"):
                return np.asarray(fitted.forecast(steps=n))
            if hasattr(fitted, "predict"):
                return np.asarray(fitted.predict(start=0, end=n-1))
        except Exception:
            pass
    fitted_path = model_info.get("fitted_path")
    if fitted_path:
        fp = Path(fitted_path)
        if fp.exists():
            try:
                with fp.open("rb") as f:
                    fm = pickle.load(f)
                if hasattr(fm, "forecast"):
                    return np.asarray(fm.forecast(steps=n))
                if hasattr(fm, "predict"):
                    return np.asarray(fm.predict(start=0, end=n-1))
            except Exception:
                pass
    last_vals = model_info.get("last_values") or []
    if last_vals:
        return np.full(n, float(last_vals[-1]), dtype=float)
    window = int(model_info.get("window_size", 50))
    if window > 1 and n > 0:
        csum = np.concatenate(([0.0], np.cumsum(series)))
        out = np.empty(n, dtype=float)
        for i in range(min(window, n)):
            out[i] = series[0] if i == 0 else csum[i] / i
        if n > window:
            idx = np.arange(window, n+1)
            ws = csum[idx] - csum[idx - window]
            out[window:] = ws / window
        return out
    return np.full(n, float(series[-1]) if n else 0.0, dtype=float)

def _score_one(key: str, model_info: Dict[str, Any], arr_map: Dict[str, np.ndarray],
               z_thresh: float) -> Tuple[np.ndarray, int]:
    target = model_info.get("target_sensor")
    if not target or target not in arr_map:
        return np.zeros_like(next(iter(arr_map.values()))), 0
    actual = arr_map[target]
    forecast = _forecast_vector(model_info, actual)
    if forecast.shape[0] != actual.shape[0]:
        forecast = np.resize(forecast, actual.shape[0])
    residuals = actual - forecast
    std = residuals.std()
    if std <= EPS:
        return np.zeros_like(actual), 0
    z = np.abs(residuals / (std + EPS))
    violations = (z > z_thresh).astype(int)
    return violations, int(violations.sum())

def fast_infer_cached(model_name: str,
                      data_path: str,
                      models_dir: str,
                      label_col: Optional[str],
                      n_jobs: int = 4,
                      use_fitted_models: bool = False,
                      top_k: Optional[int] = 40,
                      adaptive_quantile: Optional[float] = None) -> Dict[str, Any]:
    t0 = time.time()
    model_path = Path(models_dir) / f"{model_name}.pkl"
    if not model_path.exists():
        raise FileNotFoundError(f"Model pickle not found: {model_path}")
    mdata = _load_model_dict(model_path)

    fdict = mdata.get("forecast_models") or mdata.get("arima_models") or {}
    items = list(fdict.items())
    if top_k and top_k > 0:
        items = items[:top_k]

    targets = [info.get("target_sensor") for _, info in items if info.get("target_sensor")]
    extra_cols = []
    if label_col:
        extra_cols.append(label_col)
    extra_cols.append("Timestamp")
    needed_cols = sorted(set(targets + extra_cols))
    df_full = _subset_columns(data_path, needed_cols)
    for col in df_full.columns:
        if col != label_col and col != "Timestamp":
            try:
                df_full[col] = df_full[col].astype("float32")
            except Exception:
                pass
    n = len(df_full)

    arr_map = {t: df_full[t].to_numpy(dtype=float) for t in targets if t in df_full.columns}

    any_fitted = use_fitted_models and any(
        info.get("fitted_model") is not None or info.get("fitted_path") for _, info in items
    )
    backend = "loky" if any_fitted else "threading"

    results = Parallel(n_jobs=n_jobs, backend=backend)(
        delayed(_score_one)(key, info, arr_map, float(info.get("z_threshold", 3.0)))
        for key, info in items
    )

    score = np.zeros(n, dtype=int)
    total_violations = 0
    for viol_vec, tv in results:
        score[:len(viol_vec)] += viol_vec
        total_violations += tv

    raw_threshold = float(
        mdata.get("training_params", {}).get("anomaly_threshold",
        mdata.get("config", {}).get("anomaly_threshold", DEFAULT_THRESHOLD))
    )

    if adaptive_quantile:
        q_val = np.quantile(score, adaptive_quantile)
        anomaly_mask = score >= q_val
        threshold_used = f"adaptive_quantile_{adaptive_quantile}:{q_val:.3f}"
    else:
        anomaly_mask = score >= raw_threshold
        threshold_used = f"raw:{raw_threshold}"

    anomaly_indexes = np.nonzero(anomaly_mask)[0].tolist()

    metrics = {}
    if label_col and label_col in df_full.columns:
        labels_series = df_full[label_col]
        attack_mask = (labels_series == "Attack") | (labels_series == 1) | (labels_series == "1")
        y_true = attack_mask.astype(int).to_numpy()
        y_pred = anomaly_mask.astype(int)
        from sklearn.metrics import precision_score, recall_score, f1_score
        metrics = {
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "support": int(y_true.sum())
        }

    timestamps = None
    if "Timestamp" in df_full.columns:
        try:
            ts = pd.to_datetime(df_full["Timestamp"])
            timestamps = ts.iloc[anomaly_indexes].astype(str).tolist()
        except Exception:
            pass

    return {
        "model_name": model_name,
        "n_rows": n,
        "targets_used": len(targets),
        "models_used": len(items),
        "total_violations": int(total_violations),
        "unique_anomalies": int(anomaly_mask.sum()),
        "threshold_strategy": threshold_used,
        "anomaly_indexes": anomaly_indexes,
        "anomaly_timestamps": timestamps,
        "metrics": metrics,
        "elapsed_seconds": time.time() - t0
    }