"""Conservative preparation: preserve observations and disclose missingness."""
import re
import pandas as pd

def clean_data(df):
    if df.empty or len(df.columns) == 0: raise ValueError("Dataset contains no observations")
    if len(df) > 50000 or len(df.columns) > 200: raise ValueError("Limit: 50,000 rows and 200 columns")
    out=df.copy()
    names=[]
    for col in out.columns:
        base=re.sub(r"[^a-z0-9_]+", "_", str(col).strip().lower()).strip("_") or "column"
        name=base; i=2
        while name in names: name=f"{base}_{i}";i+=1
        names.append(name)
    out.columns=names
    summary={"original_rows":len(df), "rows_after_cleaning":len(out), "duplicates_removed":0,
             "duplicate_rows_detected":int(out.duplicated().sum()), "missing_values_filled":{},
             "missing_values":out.isna().sum().astype(int).to_dict(), "columns":len(out.columns),
             "final_shape":out.shape, "date_columns":[], "data_types":out.dtypes.astype(str).to_dict(),
             "warnings":["Missing values and duplicate rows are preserved; choose domain-specific cleaning before decisions."]}
    return out,summary
