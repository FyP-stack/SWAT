import pandas as pd

# Read and clean the data
df = pd.read_parquet(r"C:\Users\fahad\OneDrive - Higher Education Commission\Desktop\Attacks\Attack\SWaT_Attack_Preprocessed.parquet")
df['Normal/Attack'] = df['Normal/Attack'].replace('A ttack', 'Attack')

# Create a balanced test sample (50 Normal, 50 Attack)
normal_samples = df[df['Normal/Attack'] == 'Normal'].head(50)
attack_samples = df[df['Normal/Attack'] == 'Attack'].head(50)

test_sample = pd.concat([normal_samples, attack_samples])
test_sample.to_csv('balanced_test.csv', index=False)

print("✅ Balanced test sample created: balanced_test.csv")
print(f"Shape: {test_sample.shape}")
print(test_sample['Normal/Attack'].value_counts())