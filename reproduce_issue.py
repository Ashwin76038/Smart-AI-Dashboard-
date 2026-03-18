import pandas as pd
import os

file_path = r"backend\uploads\cleaned_Online Retail Data Set.xlsx"

try:
    print(f"Reading {file_path}...")
    df = pd.read_csv(file_path)
    print("Success!")
    print(df.head())
except Exception as e:
    print(f"Failed: {e}")
