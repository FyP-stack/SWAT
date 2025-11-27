import pickle
import os

def diagnose_all_models():
    models_dir = "models"
    model_files = [f for f in os.listdir(models_dir) if f.endswith('.pkl')]
    
    print(f"Found {len(model_files)} model files:")
    
    for model_file in model_files:
        model_path = os.path.join(models_dir, model_file)
        print(f"\n{'='*60}")
        print(f"Analyzing: {model_file}")
        print(f"{'='*60}")
        
        try:
            with open(model_path, 'rb') as f:
                model_obj = pickle.load(f)
            
            print(f"Object type: {type(model_obj)}")
            
            if isinstance(model_obj, dict):
                print("📦 This is a DICTIONARY (common for complex models)")
                print(f"Dictionary keys: {list(model_obj.keys())}")
                
                # Analyze each key in detail
                for key, value in model_obj.items():
                    print(f"\n  Key: '{key}'")
                    print(f"    Type: {type(value)}")
                    print(f"    Has predict: {hasattr(value, 'predict')}")
                    print(f"    Has fit: {hasattr(value, 'fit')}")
                    print(f"    Has transform: {hasattr(value, 'transform')}")
                    
                    # Show first few methods
                    methods = [m for m in dir(value) if not m.startswith('_')]
                    print(f"    Methods: {methods[:8]}...")  # First 8 methods
                    
            else:
                print("✅ This is a direct model object")
                methods = [m for m in dir(model_obj) if not m.startswith('_')]
                print(f"Available methods: {methods}")
                
        except Exception as e:
            print(f"❌ Error loading {model_file}: {e}")

if __name__ == "__main__":
    diagnose_all_models()