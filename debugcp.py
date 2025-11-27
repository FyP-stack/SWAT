import pickle
import os

def debug_model():
    model_path = "models/granger_arima_iqr.pkl"
    
    print(f"🔍 Debugging model: {model_path}")
    print(f"📁 File exists: {os.path.exists(model_path)}")
    
    if not os.path.exists(model_path):
        print("❌ File not found! Available models:")
        models_dir = "models"
        if os.path.exists(models_dir):
            for f in os.listdir(models_dir):
                if f.endswith('.pkl'):
                    print(f"   - {f}")
        return
    
    try:
        with open(model_path, 'rb') as f:
            granger_data = pickle.load(f)
        
        print("✅ Successfully loaded model data")
        print(f"📊 Type: {type(granger_data)}")
        
        if isinstance(granger_data, dict):
            print("📋 Dictionary keys:")
            for key in granger_data.keys():
                print(f"   - '{key}': {type(granger_data[key])}")
                
            # Check causal_pairs
            if 'causal_pairs' in granger_data:
                causal_pairs = granger_data['causal_pairs']
                print(f"\n🔗 Causal pairs: {len(causal_pairs)}")
                if causal_pairs:
                    print("First 3 causal pairs:")
                    for i, pair in enumerate(causal_pairs[:3]):
                        print(f"   {i}: {pair} (type: {type(pair)}, length: {len(pair)})")
            
            # Check forecast_models
            if 'forecast_models' in granger_data:
                forecast_models = granger_data['forecast_models']
                print(f"\n📈 Forecast models: {len(forecast_models)}")
                if forecast_models:
                    print("First 3 forecast models:")
                    for i, (key, value) in enumerate(list(forecast_models.items())[:3]):
                        print(f"   {i}: {key} -> {type(value)}")
                        
        else:
            print(f"❌ Expected dictionary, got: {type(granger_data)}")
            
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_model()