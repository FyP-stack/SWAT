import pandas as pd

def check_test_file():
    df = pd.read_csv('balanced_test.csv')
    print("📊 Test file analysis:")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"Normal/Attack value counts:")
    print(df['Normal/Attack'].value_counts())
    print(f"Data type of Normal/Attack: {df['Normal/Attack'].dtype}")
    print(f"First few values: {df['Normal/Attack'].head().tolist()}")

if __name__ == "__main__":
    check_test_file()