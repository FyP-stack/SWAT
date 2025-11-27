import pickle
from pathlib import Path
from typing import Any, Dict

_CACHE: Dict[str, Any] = {}

def _infer_model_type(file_name: str, obj: Dict[str, Any]) -> str:
    # Priority: explicit field
    explicit = obj.get("model_type")
    if explicit:
        return explicit.lower()

    fname = file_name.lower()
    if "exp" in fname and "esd" in fname and "zscore" in fname:
        return "exp_esd_zscore"
    if "holt" in fname or "winters" in fname:
        return "holt_winters"
    if "high_sensitivity" in fname:
        return "high_sensitivity"
    # Fallback generic ARIMA style
    return "arima"

def load_model_by_name(models_dir: str, name: str) -> Any:
    cache_key = f"{models_dir}::{name}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    models_path = Path(models_dir)
    if not models_path.exists():
        raise FileNotFoundError(f"Models directory not found: {models_dir}")

    cand = models_path / f"{name}.pkl"
    if not cand.exists():
        raise FileNotFoundError(f"Model file not found: {cand}")

    with cand.open("rb") as f:
        obj = pickle.load(f)

    if isinstance(obj, dict):
        from wrappers.arima_wrapper import ArimaWrapper
        from wrappers.holt_winters_wrapper import HoltWintersWrapper
        from wrappers.esd_zscore_wrapper import ExpESDZScoreWrapper
        

        mtype = _infer_model_type(cand.name, obj)
        if mtype == "arima":
            wrapped = ArimaWrapper(obj)
        elif mtype == "holt_winters":
            wrapped = HoltWintersWrapper(obj)
        elif mtype == "exp_esd_zscore":
            wrapped = ExpESDZScoreWrapper(obj)
        elif mtype == "high_sensitivity":
            wrapped = HighSensitivityWrapper(obj)
        else:
            wrapped = ArimaWrapper(obj)  # fallback

        _CACHE[cache_key] = wrapped
        return wrapped

    _CACHE[cache_key] = obj
    return obj