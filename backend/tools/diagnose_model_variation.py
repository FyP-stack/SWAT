import argparse
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Any, Dict

DEFAULT_LABEL = "Normal/Attack"

def load_df(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")
    if path.suffix.lower() in (".parquet", ".parq"):
        try:
            return pd.read_parquet(path)
        except Exception as e:
            print(f"[warn] parquet read failed ({e}); trying CSV fallback.")
    return pd.read_csv(path)

def try_wrap(obj: Any):
    if isinstance(obj, dict):
        keys = set(obj.keys())
        if {"forecast_models", "arima_models", "training_params"}.intersection(keys):
            try:
                from GrangerModelWrapper import GrangerAnomalyDetector
                if not isinstance(obj, GrangerAnomalyDetector):
                    return GrangerAnomalyDetector(obj)
            except Exception as e:
                print(f"[warn] wrap failed: {e}")
    return obj

def get_model_paths(models_dir: Path):
    return sorted(models_dir.glob("*.pkl"))

def load_model(path: Path):
    with path.open("rb") as f:
        return pickle.load(f)

def score_model(wrapper, features: pd.DataFrame):
    if hasattr(wrapper, "predict_proba"):
        probs = wrapper.predict_proba(features)
        if probs.ndim == 2 and probs.shape[1] == 2:
            return probs[:, 1]
        return probs.ravel()
    elif hasattr(wrapper, "predict"):
        return wrapper.predict(features).astype(float)
    else:
        raise RuntimeError("No predict/predict_proba on model")

def analyze(models_dir: Path, data_path: Path, label_col: str):
    df = load_df(data_path)
    has_label = label_col in df.columns
    if has_label:
        features = df.drop([label_col], axis=1, errors="ignore")
        y_raw = df[label_col]
        if isinstance(y_raw.iloc[0], str):
            y_bin = (y_raw == "Attack").astype(int)
        else:
            y_bin = (y_raw == 1).astype(int)
    else:
        features = df
        y_bin = None

    numeric_cols = set(features.select_dtypes(include=["number"]).columns)
    results = []

    for p in get_model_paths(models_dir):
        name = p.stem
        try:
            obj = load_model(p)
            w = try_wrap(obj)

            target_sensors = []
            if isinstance(obj, dict):
                fm = obj.get("forecast_models") or obj.get("arima_models") or {}
                for info in fm.values():
                    if isinstance(info, dict):
                        ts = info.get("target_sensor")
                        if ts:
                            target_sensors.append(ts)
            distinct_targets = sorted(set(target_sensors))
            missing = [t for t in distinct_targets if t not in numeric_cols]

            scores = score_model(w, features)
            n_unique = int(len(np.unique(scores)))

            summary = {
                "model": name,
                "n_rows": int(len(scores)),
                "score_min": float(np.min(scores)) if len(scores) else None,
                "score_max": float(np.max(scores)) if len(scores) else None,
                "score_mean": float(np.mean(scores)) if len(scores) else None,
                "score_std": float(np.std(scores)) if len(scores) else None,
                "n_unique_scores": n_unique,
                "first_10_scores": scores[:10].tolist(),
                "distinct_target_sensors": distinct_targets,
                "n_target_sensors": len(distinct_targets),
                "n_missing_targets_in_data": len(missing),
                "missing_targets_in_data": missing
            }

            if y_bin is not None and len(scores) == len(y_bin):
                th = float(np.mean(scores))
                preds = (scores >= th).astype(int)
                tp = int(((preds == 1) & (y_bin == 1)).sum())
                fp = int(((preds == 1) & (y_bin == 0)).sum())
                tn = int(((preds == 0) & (y_bin == 0)).sum())
                fn = int(((preds == 0) & (y_bin == 1)).sum())
                precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
                recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                f1 = (2 * precision * recall / (precision + recall)
                      if (precision + recall) > 0 else 0.0)
                summary.update({
                    "quick_mean_threshold": th,
                    "quick_tp": tp,
                    "quick_fp": fp,
                    "quick_tn": tn,
                    "quick_fn": fn,
                    "quick_precision": precision,
                    "quick_recall": recall,
                    "quick_f1": f1
                })

            results.append(summary)
        except Exception as e:
            results.append({"model": name, "error": str(e)})
    return results

def main():
    ap = argparse.ArgumentParser(description="Diagnose model score variation.")
    ap.add_argument("--data", required=True, help="Path to parquet or csv data file.")
    ap.add_argument("--label-col", default=DEFAULT_LABEL, help="Label column name.")
    ap.add_argument("--models-dir", default=None, help="Models directory (default backend/models).")
    ap.add_argument("--out", default="variation_report.json", help="Output JSON path.")
    args = ap.parse_args()

    models_dir = Path(args.models_dir).resolve() if args.models_dir else Path(__file__).resolve().parents[1] / "models"
    data_path = Path(args.data).resolve()

    print(f"[info] models_dir = {models_dir}")
    print(f"[info] data_path  = {data_path}")

    if not models_dir.exists():
        print("[error] models_dir does not exist.")
        return

    try:
        results = analyze(models_dir, data_path, args.label_col)
    except Exception as e:
        print(f"[error] analysis failed: {e}")
        return

    for r in results:
        print(json.dumps(r, indent=2))

    out_path = Path(args.out).resolve()
    with out_path.open("w", encoding="utf-8") as f:
        json.dump({"models": results}, f, indent=2)
    print(f"[done] wrote report → {out_path}")

if __name__ == "__main__":
    main()