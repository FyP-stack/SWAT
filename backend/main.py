from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pathlib import Path
import os
import time
from typing import Optional, List, Dict, Any
import hashlib
import pickle
import json
import math
import numpy as np
import pandas as pd

from sqlalchemy.orm import Session
from datetime import timedelta

from utils.io import stream_save_upload
from utils.metrics import calculate_metrics, calculate_curves
from utils.model_loader import load_model_by_name
from fast_inference import fast_infer_cached
from database import engine, get_db, Base, User, Evaluation
from auth_utils import (
    hash_password, verify_password, create_access_token, 
    decode_token, authenticate_user, create_user, validate_password_strength
)
from schemas import (
    UserLogin, UserCreate, UserResponse, TokenResponse, PasswordValidationResponse
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SWaT Anomaly Detection API (Differentiated Models)", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

_MODEL_CACHE: Dict[str, Any] = {}

# Per-model default thresholds (tune these to produce different metrics)
MODEL_DEFAULT_THRESHOLDS: Dict[str, float] = {
    "granger_arima_iqr": 0.42,
    "granger_exp(Mv)_esd+zscore_model": 0.33,
    "granger_holtW(double Exp)(Mv)_model": 0.37,
    "high_sensitivity_granger_esd_model": 0.28,
    "optimized_granger_holt_winters_model": 0.50
}

security = HTTPBearer(auto_error=False)

def cached_model(name: str):
    if name in _MODEL_CACHE:
        return _MODEL_CACHE[name]
    obj = load_model_by_name(str(BASE_DIR / "models"), name)
    _MODEL_CACHE[name] = obj
    return obj

def load_parquet_or_csv(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in ('.parquet', '.parq'):
        return pd.read_parquet(path)
    return pd.read_csv(path)

def _hash_obj(obj) -> str:
    try:
        data = pickle.dumps(obj, protocol=pickle.HIGHEST_PROTOCOL)
        return hashlib.sha256(data).hexdigest()[:16]
    except Exception:
        try:
            txt = json.dumps(obj, sort_keys=True, default=str)
            return hashlib.sha256(txt.encode()).hexdigest()[:16]
        except Exception:
            return "unhashable"

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        email = decode_token(credentials.credentials)
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return user

@app.get("/")
async def root():
    return {"message": "SWaT API running with differentiated models"}

@app.get("/health")
def health():
    return {"status": "ok", "models_cached": len(_MODEL_CACHE)}

# ==================== Authentication Endpoints ====================

@app.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    is_valid, message = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Create user with error handling
    try:
        new_user = create_user(db, user_data.email, user_data.password, user_data.full_name)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
    
    # Create access token
    access_token = create_access_token(new_user.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(new_user),
        "expires_in": 60 * 60 * 24 * 7  # 7 days
    }

@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.email)

    # Try to commit the last_login update, but don't fail if it times out
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        # Still return success - authentication passed
        # The last_login update is non-critical
        import logging
        logging.warning(f"Could not update last_login: {str(e)}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user),
        "expires_in": 60 * 60 * 24 * 7  # 7 days
    }

@app.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (token invalidation handled client-side)"""
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@app.post("/auth/validate-password", response_model=PasswordValidationResponse)
async def validate_password(password: str = Form(...)):
    """Validate password strength"""
    is_valid, message = validate_password_strength(password)
    return {"is_valid": is_valid, "message": message}

@app.get("/api/models")
async def list_models():
    models_dir = BASE_DIR / "models"
    model_files = [f.replace('.pkl', '') for f in os.listdir(models_dir) if f.endswith('.pkl')]
    return {"models": model_files}

# Admin/debug helpers
@app.get("/api/debug/paths")
def debug_paths():
    models_dir = BASE_DIR / "models"
    try:
        files = sorted([p.name for p in models_dir.iterdir() if p.is_file()])
    except Exception as e:
        files = [f"error: {e}"]
    return {
        "base_dir": str(BASE_DIR),
        "models_dir": str(models_dir),
        "models_dir_files": files
    }
# Add this new endpoint after the existing /api/models endpoint (around line 95)

@app.get("/api/models/detailed")
async def list_models_detailed():
    """Get detailed information about all available models"""
    models_dir = BASE_DIR / "models"
    models = []
    
    if not models_dir.exists():
        return {"models": [], "count": 0}
    
    for pkl_file in sorted(models_dir.glob("*.pkl")):
        try:
            model_info = {
                "id": pkl_file.stem,
                "name": pkl_file.stem.replace("_", " ").title(),
                "file_path": str(pkl_file),
                "file_size": pkl_file.stat().st_size,
                "type": "pkl"
            }
            
            # Try to load and extract info
            try:
                with pkl_file.open("rb") as f:
                    obj = pickle.load(f)
                
                if isinstance(obj, dict):
                    model_info["model_type"] = obj.get("model_type", "Unknown")
                    model_info["description"] = obj.get("description", f"Anomaly detection model: {pkl_file.stem}")
                    
                    # Extract training params
                    training_params = obj.get("training_params", {})
                    model_info["anomaly_threshold"] = training_params.get("anomaly_threshold")
                    
                    # Count forecast models
                    forecast_models = obj.get("forecast_models") or obj.get("arima_models") or {}
                    model_info["num_forecast_models"] = len(forecast_models)
                else:
                    model_info["model_type"] = type(obj).__name__
                    model_info["description"] = f"Model: {pkl_file.stem}"
            except Exception as load_err:
                model_info["model_type"] = "Unknown"
                model_info["description"] = f"Model: {pkl_file.stem}"
                model_info["load_warning"] = str(load_err)
            
            models.append(model_info)
            
        except Exception as e:
            print(f"Error processing {pkl_file.name}: {e}")
            models.append({
                "id": pkl_file.stem,
                "name": pkl_file.stem.replace("_", " ").title(),
                "error": str(e),
                "type": "pkl"
            })
    
    return {
        "models": models,
        "count": len(models)
    }
@app.post("/api/admin/clear-cache")
def clear_cache():
    global _MODEL_CACHE
    _MODEL_CACHE = {}
    return {"cleared": True}

# Inspect a single model pickle
@app.post("/api/inspect-model")
async def inspect_model(model_name: str = Form(...)):
    models_dir = BASE_DIR / "models"
    path = models_dir / f"{model_name}.pkl"
    if not path.exists():
        return JSONResponse(status_code=404, content={"detail": f"Model file not found: {path.name}"})
    with path.open("rb") as f:
        obj = pickle.load(f)
    if not isinstance(obj, dict):
        return {"file": path.name, "type": type(obj).__name__}
    fm = obj.get("forecast_models") or obj.get("arima_models") or {}
    return {
        "file": path.name,
        "keys": sorted(obj.keys()),
        "model_type": obj.get("model_type"),
        "n_forecast_models": len(fm),
        "first_forecast_keys": list(fm.keys())[:10],
        "has_training_params": "training_params" in obj,
        "sample_training_params": obj.get("training_params"),
        "sample_config": obj.get("config"),
    }

# Model summary for ALL models
@app.get("/api/model-summary")
def model_summary():
    models_dir = BASE_DIR / "models"
    results = []
    for f in sorted(models_dir.glob("*.pkl")):
        entry: Dict[str, Any] = {"file": f.name}
        try:
            with f.open("rb") as fh:
                obj = pickle.load(fh)
        except Exception as e:
            entry["error"] = f"load_failed: {e}"
            results.append(entry)
            continue

        entry["hash"] = _hash_obj(obj)

        if not isinstance(obj, dict):
            entry["type"] = type(obj).__name__
            results.append(entry)
            continue

        forecast = obj.get("forecast_models") or obj.get("arima_models") or {}
        entry["n_forecast_models"] = len(forecast)
        entry["model_type"] = obj.get("model_type")

        targets = []
        window_sizes = []
        last_values_tail = []
        z_thresholds = []
        for k, info in forecast.items():
            if not isinstance(info, dict):
                continue
            targets.append(info.get("target_sensor"))
            window_sizes.append(info.get("window_size"))
            lv = info.get("last_values")
            if lv:
                last_values_tail.append((k, tuple(lv[-5:])))
            z_thresholds.append(info.get("z_threshold", 3.0))

        anomaly_threshold = obj.get("training_params", {}).get(
            "anomaly_threshold",
            obj.get("config", {}).get("anomaly_threshold", None)
        )

        entry.update({
            "unique_target_sensors": len(set(t for t in targets if t)),
            "sample_targets": list({t for t in targets if t})[:10],
            "distinct_window_sizes": sorted({w for w in window_sizes if w is not None})[:10],
            "sample_last_values_tail": last_values_tail[:5],
            "distinct_z_thresholds": sorted({float(z) for z in z_thresholds})[:10],
            "anomaly_threshold": anomaly_threshold
        })
        results.append(entry)

    return {"models": results, "note": "If hashes and attributes are all identical, rebuild or edit model pickles to differentiate them."}

# Compare all models side-by-side on the same file
@app.post("/api/compare-models")
async def compare_models(
    file: UploadFile = File(...),
    label_column: str = Form("Normal/Attack"),
    positive_label: str = Form("Attack"),
    threshold: Optional[float] = Form(None)
):
    dest = stream_save_upload(file, UPLOAD_DIR)
    try:
        data = load_parquet_or_csv(dest)
        if label_column not in data.columns:
            return JSONResponse(status_code=400, content={"detail": f"Label column '{label_column}' missing."})
        features = data.drop([label_column], axis=1, errors='ignore')
        y_true = data[label_column]

        rows = []
        for pkl in sorted((BASE_DIR / "models").glob("*.pkl")):
            name = pkl.stem
            try:
                model_obj = cached_model(name)
                if hasattr(model_obj, "predict_proba"):
                    probs = model_obj.predict_proba(features)
                    scores = probs[:, 1] if probs.ndim == 2 else probs
                else:
                    scores = model_obj.predict(features).astype(float)

                thr_val = threshold if threshold is not None else MODEL_DEFAULT_THRESHOLDS.get(name, 0.5)
                preds = (scores >= thr_val).astype(int)
                m = calculate_metrics(y_true, preds, positive_label=positive_label)
                
                # Sanitize float values to prevent JSON serialization errors
                score_mean = float(np.mean(scores))
                score_std = float(np.std(scores))
                score_min = float(np.min(scores))
                score_max = float(np.max(scores))
                
                if math.isinf(score_mean) or math.isnan(score_mean):
                    score_mean = None
                if math.isinf(score_std) or math.isnan(score_std):
                    score_std = None
                if math.isinf(score_min) or math.isnan(score_min):
                    score_min = None
                if math.isinf(score_max) or math.isnan(score_max):
                    score_max = None
                
                m.update({
                    "model_name": name,
                    "model_type": getattr(model_obj, "__class__", type(model_obj)).__name__,
                    "threshold_used": thr_val,
                    "score_mean": score_mean,
                    "score_std": score_std,
                    "score_min": score_min,
                    "score_max": score_max,
                    "unique_scores": int(len(np.unique(scores)))
                })
                rows.append(m)
            except Exception as e:
                rows.append({"model_name": name, "error": str(e)})
        return {"results": rows}
    finally:
        try:
            dest.unlink(missing_ok=True)
        except Exception:
            pass

# Heavy evaluation with per-model default threshold
@app.post("/api/evaluate")
async def evaluate_model(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    label_column: str = Form("Normal/Attack"),
    positive_label: str = Form("Attack"),
    threshold: Optional[float] = Form(None),
    debug: bool = Form(False)
):
    dest = stream_save_upload(file, UPLOAD_DIR)
    stage = "start"
    try:
        stage = "load_data"
        data = load_parquet_or_csv(dest)
        if label_column not in data.columns:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Label column '{label_column}' not found.",
                         "available_columns_first_30": list(data.columns)[:30]}
            )

        stage = "load_model"
        model_obj = cached_model(model_name)

        stage = "features"
        features = data.drop([label_column], axis=1, errors='ignore')

        stage = "scores"
        if hasattr(model_obj, "predict_proba"):
            probs = model_obj.predict_proba(features)
            anomaly_scores = probs[:, 1] if probs.ndim == 2 and probs.shape[1] == 2 else probs.ravel()
        elif hasattr(model_obj, "predict"):
            anomaly_scores = model_obj.predict(features).astype(float)
        else:
            return JSONResponse(status_code=500, content={"detail": "Model exposes neither predict nor predict_proba."})

        stage = "threshold"
        applied_threshold = threshold if threshold is not None else MODEL_DEFAULT_THRESHOLDS.get(model_name, 0.5)

        stage = "binarize"
        binary_preds = (anomaly_scores >= applied_threshold).astype(int)

        stage = "metrics"
        y_true = data[label_column]
        metrics = calculate_metrics(y_true, binary_preds, positive_label=positive_label)
        curves = calculate_curves(y_true, anomaly_scores, positive_label=positive_label)
        metrics["curves"] = curves
        metrics["threshold_used"] = applied_threshold
        metrics["model_name"] = model_name
        metrics["model_type"] = getattr(model_obj, "__class__", type(model_obj)).__name__
        
        # Sanitize float values to prevent JSON serialization errors
        min_score = float(np.min(anomaly_scores))
        max_score = float(np.max(anomaly_scores))
        mean_score = float(np.mean(anomaly_scores))
        std_score = float(np.std(anomaly_scores))
        
        if math.isinf(min_score) or math.isnan(min_score):
            min_score = None
        if math.isinf(max_score) or math.isnan(max_score):
            max_score = None
        if math.isinf(mean_score) or math.isnan(mean_score):
            mean_score = None
        if math.isinf(std_score) or math.isnan(std_score):
            std_score = None
        
        metrics["raw_score_summary"] = {
            "min": min_score,
            "max": max_score,
            "mean": mean_score,
            "std": std_score,
            "n_unique_scores": int(len(np.unique(anomaly_scores)))
        }
        if debug:
            metrics["debug_info"] = {
                "stage": stage,
                "first_25_scores": anomaly_scores[:25].tolist()
            }
        return metrics
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "detail": "Evaluation failed",
            "error": str(e),
            "stage": stage,
            "model_name": model_name
        })
    finally:
        try:
            dest.unlink(missing_ok=True)
        except Exception:
            pass

# Automatic evaluation with mini threshold sweep
@app.post("/api/evaluate-auto")
async def evaluate_model_auto(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    label_column: str = Form("Normal/Attack"),
    positive_label: str = Form("Attack"),
    strategy: str = Form("f1"),   # one of f1, recall, precision
    steps: int = Form(12)
):
    dest = stream_save_upload(file, UPLOAD_DIR)
    try:
        data = load_parquet_or_csv(dest)
        if label_column not in data.columns:
            return JSONResponse(status_code=400, content={"detail": f"Label column '{label_column}' missing."})
        model_obj = cached_model(model_name)
        features = data.drop([label_column], axis=1, errors='ignore')

        if hasattr(model_obj, "predict_proba"):
            probs = model_obj.predict_proba(features)
            scores = probs[:, 1] if probs.ndim == 2 and probs.shape[1] == 2 else probs.ravel()
        else:
            scores = model_obj.predict(features).astype(float)

        candidate_thresholds = np.linspace(0.05, 0.95, steps)
        y_true = data[label_column]
        best_entry = None
        best_value = -1.0

        for th in candidate_thresholds:
            preds = (scores >= th).astype(int)
            m = calculate_metrics(y_true, preds, positive_label=positive_label)
            metric_val = m.get(strategy, m["f1"]) if strategy in ("f1", "recall", "precision") else m["f1"]
            if metric_val > best_value:
                best_value = metric_val
                best_entry = (th, m)

        chosen_th, best_metrics = best_entry
        curves = calculate_curves(y_true, scores, positive_label=positive_label)
        best_metrics["threshold_used"] = float(chosen_th)
        best_metrics["model_name"] = model_name
        best_metrics["model_type"] = getattr(model_obj, "__class__", type(model_obj)).__name__
        best_metrics["selection_strategy"] = strategy
        
        # Sanitize float values to prevent JSON serialization errors
        min_score = float(np.min(scores))
        max_score = float(np.max(scores))
        mean_score = float(np.mean(scores))
        std_score = float(np.std(scores))
        
        if math.isinf(min_score) or math.isnan(min_score):
            min_score = None
        if math.isinf(max_score) or math.isnan(max_score):
            max_score = None
        if math.isinf(mean_score) or math.isnan(mean_score):
            mean_score = None
        if math.isinf(std_score) or math.isnan(std_score):
            std_score = None
        
        best_metrics["raw_score_summary"] = {
            "min": min_score,
            "max": max_score,
            "mean": mean_score,
            "std": std_score,
            "n_unique_scores": int(len(np.unique(scores)))
        }
        best_metrics["threshold_candidates"] = [float(x) for x in candidate_thresholds]
        best_metrics["curves"] = curves
        return best_metrics
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": "Auto evaluation failed", "error": str(e)})
    finally:
        try:
            dest.unlink(missing_ok=True)
        except Exception:
            pass

# Threshold search (full sweep)
@app.post("/api/threshold-search")
async def threshold_search(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    label_column: str = Form("Normal/Attack"),
    positive_label: str = Form("Attack"),
    min_threshold: float = Form(0.01),
    max_threshold: float = Form(0.99),
    steps: int = Form(50)
):
    dest = stream_save_upload(file, UPLOAD_DIR)
    try:
        data = load_parquet_or_csv(dest)
        if label_column not in data.columns:
            raise HTTPException(status_code=400,
                                detail=f"Label column '{label_column}' not in columns: {list(data.columns)}")

        model_obj = cached_model(model_name)
        features = data.drop([label_column], axis=1, errors='ignore')

        if hasattr(model_obj, "predict_proba"):
            probs = model_obj.predict_proba(features)
            anomaly_scores = probs[:, 1] if probs.ndim == 2 and probs.shape[1] == 2 else probs
        else:
            anomaly_scores = model_obj.predict(features).astype(float)

        thresholds = np.linspace(min_threshold, max_threshold, steps)
        y_true = data[label_column]
        results = []
        for th in thresholds:
            binary = (anomaly_scores >= th).astype(int)
            m = calculate_metrics(y_true, binary, positive_label=positive_label)
            results.append({
                "threshold": float(th),
                "precision": m["precision"],
                "recall": m["recall"],
                "f1": m["f1"]
            })
        best = max(results, key=lambda r: r["f1"])
        return {
            "model_name": model_name,
            "model_type": getattr(model_obj, "__class__", type(model_obj)).__name__,
            "thresholds": results,
            "best_threshold": best
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Threshold search failed: {str(e)}")
    finally:
        try:
            dest.unlink(missing_ok=True)
        except Exception:
            pass

# Fast inference (optional)
@app.post("/api/fast-infer")
async def fast_infer_endpoint(
    model_name: str = Form(...),
    file: UploadFile = File(...),
    label_column: Optional[str] = Form("Normal/Attack"),
    n_jobs: int = Form(4),
    use_fitted: bool = Form(False),
    top_k: Optional[int] = Form(40),
    adaptive_quantile: Optional[float] = Form(None)
):
    t0 = time.time()
    dest = stream_save_upload(file, UPLOAD_DIR)
    try:
        result = fast_infer_cached(
            model_name=model_name,
            data_path=str(dest),
            models_dir=str(BASE_DIR / "models"),
            label_col=label_column,
            n_jobs=n_jobs,
            use_fitted_models=use_fitted,
            top_k=top_k,
            adaptive_quantile=adaptive_quantile
        )
        result["api_elapsed_seconds"] = time.time() - t0
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fast inference failed: {str(e)}")
    finally:
        try:
            dest.unlink(missing_ok=True)
        except Exception:
            pass

# Quick prefilter
@app.post("/api/prefilter")
async def prefilter_endpoint(file: UploadFile = File(...), downsample: str = Form("1S")):
    dest = stream_save_upload(file, UPLOAD_DIR)
    try:
        df = load_parquet_or_csv(dest)
        if "Timestamp" in df.columns:
            try:
                df["Timestamp"] = pd.to_datetime(df["Timestamp"])
                df = df.set_index("Timestamp")
            except Exception:
                pass
        flagged: List[str] = []
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            s = df[col].astype('float32')
            if len(s) < 10:
                continue
            ser = s
            if isinstance(s.index, pd.DatetimeIndex):
                try:
                    ser = s.resample(downsample).mean()
                except Exception:
                    pass
            diffs = ser.diff().abs()
            if diffs.gt(0.5 * ser.std()).any():
                flagged.append(col)
        return {"flagged": flagged, "count": len(flagged)}
    finally:
        try:
            dest.unlink(missing_ok=True)
        except Exception:
            pass

# ==================== Evaluation Storage Endpoints ====================

@app.post("/api/save-evaluation")
async def save_evaluation(
    current_user: User = Depends(get_current_user),
    model_name: str = Form(...),
    model_type: str = Form(None),
    accuracy: float = Form(...),
    precision: float = Form(...),
    recall: float = Form(...),
    f1_score: float = Form(...),
    threshold_used: float = Form(None),
    confusion_matrix: str = Form(None),
    class_labels: str = Form(None),
    curves_data: str = Form(None),
    n_samples: int = Form(None),
    n_anomalies: int = Form(None),
    file_name: str = Form(None),
    raw_score_summary: str = Form(None),
    evaluation_notes: str = Form(None),
    db: Session = Depends(get_db)
):
    """Save evaluation results to database"""
    try:
        # Parse JSON strings
        cm = json.loads(confusion_matrix) if confusion_matrix else None
        labels = json.loads(class_labels) if class_labels else None
        curves = json.loads(curves_data) if curves_data else None
        score_summary = json.loads(raw_score_summary) if raw_score_summary else None
        
        evaluation = Evaluation(
            user_id=current_user.id,
            model_name=model_name,
            model_type=model_type,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1_score,
            threshold_used=threshold_used,
            confusion_matrix=cm,
            class_labels=labels,
            curves_data=curves,
            n_samples=n_samples,
            n_anomalies=n_anomalies,
            file_name=file_name,
            raw_score_summary=score_summary,
            evaluation_notes=evaluation_notes
        )
        
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        
        return {
            "success": True,
            "evaluation_id": evaluation.id,
            "message": "Evaluation saved successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save evaluation: {str(e)}")

@app.get("/api/evaluations")
async def get_evaluations(
    current_user: User = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all evaluations for current user"""
    try:
        evaluations = db.query(Evaluation).filter(
            Evaluation.user_id == current_user.id
        ).order_by(Evaluation.created_at.desc()).offset(offset).limit(limit).all()
        
        total = db.query(Evaluation).filter(
            Evaluation.user_id == current_user.id
        ).count()
        
        return {
            "evaluations": [
                {
                    "id": e.id,
                    "model_name": e.model_name,
                    "model_type": e.model_type,
                    "accuracy": e.accuracy,
                    "precision": e.precision,
                    "recall": e.recall,
                    "f1_score": e.f1_score,
                    "threshold_used": e.threshold_used,
                    "n_samples": e.n_samples,
                    "n_anomalies": e.n_anomalies,
                    "file_name": e.file_name,
                    "created_at": e.created_at.isoformat(),
                    "updated_at": e.updated_at.isoformat()
                }
                for e in evaluations
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluations: {str(e)}")

@app.get("/api/evaluations/{evaluation_id}")
async def get_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed evaluation by ID"""
    try:
        evaluation = db.query(Evaluation).filter(
            Evaluation.id == evaluation_id,
            Evaluation.user_id == current_user.id
        ).first()
        
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        return {
            "id": evaluation.id,
            "model_name": evaluation.model_name,
            "model_type": evaluation.model_type,
            "accuracy": evaluation.accuracy,
            "precision": evaluation.precision,
            "recall": evaluation.recall,
            "f1_score": evaluation.f1_score,
            "threshold_used": evaluation.threshold_used,
            "confusion_matrix": evaluation.confusion_matrix,
            "class_labels": evaluation.class_labels,
            "curves_data": evaluation.curves_data,
            "n_samples": evaluation.n_samples,
            "n_anomalies": evaluation.n_anomalies,
            "file_name": evaluation.file_name,
            "raw_score_summary": evaluation.raw_score_summary,
            "evaluation_notes": evaluation.evaluation_notes,
            "created_at": evaluation.created_at.isoformat(),
            "updated_at": evaluation.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluation: {str(e)}")

@app.delete("/api/evaluations/{evaluation_id}")
async def delete_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete evaluation"""
    try:
        evaluation = db.query(Evaluation).filter(
            Evaluation.id == evaluation_id,
            Evaluation.user_id == current_user.id
        ).first()
        
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        db.delete(evaluation)
        db.commit()
        
        return {"success": True, "message": "Evaluation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete evaluation: {str(e)}")

@app.get("/api/evaluations/stats/summary")
async def get_evaluation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get evaluation statistics summary"""
    try:
        evaluations = db.query(Evaluation).filter(
            Evaluation.user_id == current_user.id
        ).all()
        
        if not evaluations:
            return {
                "total_evaluations": 0,
                "average_f1": 0,
                "average_accuracy": 0,
                "best_f1_model": None,
                "most_used_model": None
            }
        
        f1_scores = [e.f1_score for e in evaluations if e.f1_score is not None]
        accuracies = [e.accuracy for e in evaluations if e.accuracy is not None]
        
        best_eval = max(evaluations, key=lambda e: e.f1_score or 0)
        model_counts = {}
        for e in evaluations:
            model_counts[e.model_name] = model_counts.get(e.model_name, 0) + 1
        
        most_used = max(model_counts.items(), key=lambda x: x[1])[0] if model_counts else None
        
        return {
            "total_evaluations": len(evaluations),
            "average_f1": float(np.mean(f1_scores)) if f1_scores else 0,
            "average_accuracy": float(np.mean(accuracies)) if accuracies else 0,
            "best_f1_score": float(best_eval.f1_score) if best_eval.f1_score else 0,
            "best_f1_model": best_eval.model_name,
            "most_used_model": most_used,
            "model_usage_count": model_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
