Place your trained model files here. Supported extensions:
- .joblib
- .pkl
- .sav

Name convention:
- If your model file is my_model.joblib, then set model_name=my_model when calling the API.

Model expectations:
- For best results (PR/ROC curves), your model should implement predict_proba(X) and have a binary positive class.
- If only predict(X) exists, the API will compute metrics without curves.