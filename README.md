# SWaT Anomaly Detection App

A simple full-stack app to evaluate your trained anomaly detection models on CSV/XLSX/Parquet data and visualize metrics (Accuracy, Precision, Recall, F1), Confusion Matrix, PR/ROC curves.

## Quick start (no Docker)

Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Put your model file in `backend/models/` (e.g., `my_model.joblib`).

Frontend:
```bash
cd frontend
npm i
npm run dev
```

- Open http://localhost:5173
- API base defaults to `http://localhost:8000`. To change, set `VITE_API_URL` in `.env` (e.g., `VITE_API_URL=http://localhost:8000`).

## Docker compose (optional)

Create a `docker-compose.yml` (not included) that builds `backend` and `frontend` and maps ports 8000/80.

## API Contract

- `GET /api/models` -> `{ "models": ["my_model", ...] }`
- `POST /api/evaluate` multipart/form-data:
  - file: data file (CSV/XLSX/Parquet)
  - model_name: base name (no extension)
  - label_column: default "label"
  - positive_label: default "1"
  - probability_threshold: optional (0..1)

Response:
```json
{
  "model_name": "my_model",
  "metrics": { "accuracy": 0.99, "precision": 0.98, "recall": 0.97, "f1": 0.975 },
  "confusion_matrix": [[TN, FP],[FN, TP]],
  "class_labels": ["0","1"],
  "pr_curve": { "precision": [...], "recall": [...], "thresholds": [...] },
  "roc_curve": { "fpr": [...], "tpr": [...], "thresholds": [...] },
  "warnings": []
}
```

## Notes

- For PR/ROC curves, your model should expose `predict_proba`. If not, the app computes metrics without curves (or uses `decision_function` scaled to [0,1]).
- The app assumes binary classification. For multiclass, it uses macro-average and a generalized confusion matrix display.
- Make sure your dataset includes a ground-truth label column (default `label`). You can change it in the UI.

## SWaT specifics

- Ensure your input feature columns match what your model expects (same preprocessing order).
- If you used a scikit-learn `Pipeline`, save and load the pipeline object so preprocessing is included.