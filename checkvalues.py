import pandas as pd
import os

def check_label_values():
    # Use relative path or correct the absolute path
    parquet_path = "SWaT_Attack_Preprocessed.parquet"
    
    # If file not found, try the full path but with proper formatting
    if not os.path.exists(parquet_path):
        parquet_path = r"C:\Users\fahad\OneDrive - Higher Education Commission\Desktop\Attacks\Attack\SWaT_Attack_Preprocessed.parquet"
    
    print(f"Looking for file: {parquet_path}")
    print(f"File exists: {os.path.exists(parquet_path)}")
    
    if not os.path.exists(parquet_path):
        print("❌ File not found! Please check the path.")
        return
    
    try:
        df = pd.read_parquet(parquet_path)
        print("✅ File loaded successfully!")
        
        print("\n=== Normal/Attack Column Analysis ===")
        print(f"Unique values in 'Normal/Attack' column:")
        print(df['Normal/Attack'].unique())
        
        print("\nValue counts:")
        print(df['Normal/Attack'].value_counts())
        
        print(f"\nData type of 'Normal/Attack' column: {df['Normal/Attack'].dtype}")
        
        print("\nFirst 10 values:")
        print(df['Normal/Attack'].head(10))
        
        print(f"\nTotal rows: {len(df)}")
        print(f"Normal rows: {len(df[df['Normal/Attack'] == 'Normal'])}")
        print(f"Attack rows: {len(df[df['Normal/Attack'] == 'Attack'])}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_label_values()
    input("Press Enter to exit...")  # This will keep the window open