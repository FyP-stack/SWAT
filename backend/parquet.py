import pandas as pd
import os

def check_parquet_file():
    try:
        # Update this path to your actual parquet file
        parquet_path = "C:\\Users\\fahad\\OneDrive - Higher Education Commission\\Desktop\\Attacks\\Attack\\SWaT_Attack_Preprocessed.parquet"
        
        print(f"Checking parquet file: {parquet_path}")
        print(f"File exists: {os.path.exists(parquet_path)}")
        
        # Read the parquet file
        df = pd.read_parquet(parquet_path)
        
        print(f"Data shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print(f"First few rows:")
        print(df.head())
        
        # Check if normal/attack column exists
        if 'normal/attack' in df.columns:
            print(f"\n✅ 'normal/attack' column found!")
            print(f"Unique values in 'normal/attack': {df['normal/attack'].unique()}")
            print(f"Value counts:\n{df['normal/attack'].value_counts()}")
        else:
            print(f"\n❌ 'normal/attack' column NOT found!")
            print("Available columns:", list(df.columns))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_parquet_file()