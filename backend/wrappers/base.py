from abc import ABC, abstractmethod
import numpy as np
import pandas as pd
from typing import Any, Dict

class BaseModelWrapper(ABC):
    def __init__(self, model_dict: Dict[str, Any]):
        if not isinstance(model_dict, dict):
            raise TypeError("Wrapper expects a dict model artifact.")
        self.model_dict = model_dict
        self.training_params = model_dict.get("training_params", {})
        self.config = model_dict.get("config", {})
        self.model_name = (
            model_dict.get("model_name")
            or model_dict.get("name")
            or model_dict.get("id")
            or "unnamed_model"
        )
        self.anomaly_threshold = self.training_params.get(
            "anomaly_threshold",
            self.config.get("anomaly_threshold", 1.0)
        )

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        pass

    @abstractmethod
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        pass

    def _ensure_numeric(self, X: pd.DataFrame) -> pd.DataFrame:
        return X.select_dtypes(include=["number"])

    def __repr__(self):
        return f"<{self.__class__.__name__} name={self.model_name} threshold={self.anomaly_threshold}>"