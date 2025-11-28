import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, precision_recall_curve, auc
)
import math

def _sanitize_list(arr):
    """
    Convert a numpy array (or list) to a list with non-finite values replaced by None.
    """
    out = []
    for x in arr:
        if isinstance(x, (float, np.floating, int, np.integer)):
            if math.isinf(x) or math.isnan(x):
                out.append(None)
            else:
                out.append(float(x))
        else:
            # Non-numeric should pass through
            out.append(x)
    return out

def _safe_auc(x, y):
    try:
        return float(auc(x, y))
    except Exception:
        return None

def calculate_metrics(true_labels, predictions, positive_label=1):
    try:
        y_true = np.array(true_labels)
        y_pred = np.array(predictions)

        # Decide binary predictions:
        if np.issubdtype(y_pred.dtype, np.floating) and y_pred.ndim == 1:
            y_pred_binary = (y_pred > 0.5).astype(int)
        else:
            y_pred_binary = y_pred

        # Normalize positive label type
        if isinstance(y_true[0], str):
            positive_label = str(positive_label)
            y_true_binary = (y_true == positive_label).astype(int)
        else:
            positive_label = type(y_true[0])(positive_label)
            y_true_binary = (y_true == positive_label).astype(int)

        accuracy = accuracy_score(y_true_binary, y_pred_binary)
        precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
        recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
        f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
        cm = confusion_matrix(y_true_binary, y_pred_binary)

        return {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "confusion_matrix": cm.tolist(),
            "class_labels": ["Normal", "Attack"],
            "n_rows": int(len(y_true))
        }
    except Exception:
        raise

def calculate_curves(true_labels, predictions, positive_label=1):
    try:
        y_true = np.array(true_labels)
        y_pred = np.array(predictions)

        if len(y_true) == 0:
            return {"roc_curve": {}, "pr_curve": {}}

        # Normalize binary truth
        if isinstance(y_true[0], str):
            positive_label = str(positive_label)
            y_true_binary = (y_true == positive_label).astype(int)
        else:
            positive_label = type(y_true[0])(positive_label)
            y_true_binary = (y_true == positive_label).astype(int)

        curves = {}

        # Only compute curves if y_pred is continuous probabilities
        if np.issubdtype(y_pred.dtype, np.floating) and y_pred.ndim == 1:
            # ROC
            try:
                fpr, tpr, roc_thresholds = roc_curve(y_true_binary, y_pred)
                roc_auc = _safe_auc(fpr, tpr)
                curves["roc_curve"] = {
                    "fpr": _sanitize_list(fpr),
                    "tpr": _sanitize_list(tpr),
                    "auc": roc_auc,
                    "thresholds": _sanitize_list(roc_thresholds)
                }
            except Exception:
                curves["roc_curve"] = {}

            # PR
            try:
                precision, recall, pr_thresholds = precision_recall_curve(y_true_binary, y_pred)
                pr_auc = _safe_auc(recall, precision)
                curves["pr_curve"] = {
                    "precision": _sanitize_list(precision),
                    "recall": _sanitize_list(recall),
                    "auc": pr_auc,
                    "thresholds": _sanitize_list(pr_thresholds)
                }
            except Exception:
                curves["pr_curve"] = {}
        else:
            curves["roc_curve"] = {}
            curves["pr_curve"] = {}

        return curves
    except Exception:
        # On any failure, return empty curves (never raise non-finite serialization errors)
        return {"roc_curve": {}, "pr_curve": {}}