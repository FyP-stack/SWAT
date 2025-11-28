import pandas as pd
import numpy as np

def run_granger_inference(granger_detector, data: pd.DataFrame) -> np.ndarray:
    """
    Run inference using Granger causality-based anomaly detection
    """
    try:
        print("🎯 Using Granger causality for anomaly detection")
        
        # Remove label column if present
        if 'Normal/Attack' in data.columns:
            features = data.drop('Normal/Attack', axis=1)
            print(f"📝 Dropped label column. Features shape: {features.shape}")
        else:
            features = data
        
        # Remove timestamp if present
        if 'Timestamp' in features.columns:
            features = features.drop('Timestamp', axis=1)
            print(f"⏰ Dropped timestamp column. Features shape: {features.shape}")
        
        print(f"🔧 Final features for Granger analysis: {features.shape}")
        
        # Use the Granger detector
        if hasattr(granger_detector, 'predict_proba'):
            predictions = granger_detector.predict_proba(features)
            if predictions.shape[1] == 2:
                return predictions[:, 1]  # Probability of anomaly
            else:
                return predictions
        else:
            return granger_detector.predict(features)
            
    except Exception as e:
        print(f"❌ Granger inference error: {str(e)}")
        raise Exception(f"Granger inference failed: {str(e)}") 