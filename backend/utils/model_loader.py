import pickle
from pathlib import Path
from typing import Any, Dict
import sys

_CACHE: Dict[str, Any] = {}

class EWMAPickleUnpickler(pickle.Unpickler):
    """Custom unpickler that handles missing EWMA and RollingQuantile classes."""

    def find_class(self, module: str, name: str):
        """Override find_class to provide missing EWMA, RollingQuantile, and ZScore classes."""
        # If trying to load EWMAControlChart from __main__, redirect to our wrapper
        if module == "__main__" and name == "EWMAControlChart":
            from wrappers.ewma_wrapper import EWMAControlChart
            return EWMAControlChart
        # If trying to load RollingQuantileDetector or ZScoreDynamicThreshold from __main__, provide dummy classes
        # that will be handled by the wrapper later
        if module == "__main__" and name in ["RollingQuantileDetector", "ZScoreDynamicThreshold"]:
            # Create a simple class that stores the unpickled attributes
            class DummyDetector:
                def __init__(self, **kwargs):
                    for k, v in kwargs.items():
                        setattr(self, k, v)
            return DummyDetector
        # Otherwise use default behavior
        return super().find_class(module, name)

def _infer_model_type(file_name: str, obj: Dict[str, Any]) -> str:
    # Priority: explicit field
    explicit = obj.get("model_type")
    if explicit:
        return explicit.lower()

    fname = file_name.lower()
    if "rolling" in fname:
        return "rolling_quantile"
    if "ewma" in fname:
        return "ewma"
    if "cusum" in fname:
        return "cusum"
    if "zscore" in fname and not ("exp" in fname and "esd" in fname):
        return "zscore"
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

    # Use custom unpickler to handle missing classes
    with cand.open("rb") as f:
        unpickler = EWMAPickleUnpickler(f)
        obj = unpickler.load()

    if isinstance(obj, dict):
        from wrappers.arima_wrapper import ArimaWrapper
        from wrappers.holt_winters_wrapper import HoltWintersWrapper
        from wrappers.esd_zscore_wrapper import ExpESDZScoreWrapper
        from wrappers.high_senstivity_wrapper import HighSensitivityWrapper
        from wrappers.cusum_wrapper import CUSUMWrapper
        from wrappers.ewma_wrapper import EWMAWrapper
        from wrappers.rolling_quantile_wrapper import RollingQuantileWrapper
        from wrappers.zscore_wrapper import ZScoreWrapper

        mtype = _infer_model_type(cand.name, obj)
        if mtype == "ewma":
            wrapped = EWMAWrapper(obj)
        elif mtype == "cusum":
            wrapped = CUSUMWrapper(obj)
        elif mtype == "zscore":
            wrapped = ZScoreWrapper(obj)
        elif mtype == "arima":
            wrapped = ArimaWrapper(obj)
        elif mtype == "holt_winters":
            wrapped = HoltWintersWrapper(obj)
        elif mtype == "exp_esd_zscore":
            wrapped = ExpESDZScoreWrapper(obj)
        elif mtype == "high_sensitivity":
            wrapped = HighSensitivityWrapper(obj)
        elif mtype == "rolling_quantile":
            wrapped = RollingQuantileWrapper(obj)
        else:
            wrapped = ArimaWrapper(obj)  # fallback

        _CACHE[cache_key] = wrapped
        return wrapped

    # Handle non-dict objects - check for specific class types
    if "rolling" in cand.name.lower():
        from wrappers.rolling_quantile_wrapper import RollingQuantileWrapper
        wrapped = RollingQuantileWrapper(obj)
    elif "zscore" in cand.name.lower() and not ("exp" in cand.name.lower() and "esd" in cand.name.lower()):
        from wrappers.zscore_wrapper import ZScoreWrapper
        wrapped = ZScoreWrapper(obj)
    else:
        # Default to CUSUMWrapper for other non-dict objects (like CUSUMDetector)
        from wrappers.cusum_wrapper import CUSUMWrapper
        wrapped = CUSUMWrapper(obj)

    _CACHE[cache_key] = wrapped
    return wrapped
