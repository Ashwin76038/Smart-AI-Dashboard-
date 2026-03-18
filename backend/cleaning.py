import pandas as pd

def clean_data(df: pd.DataFrame):
    summary = {}

    # Drop duplicates
    before = len(df)
    summary["original_rows"] = before
    df = df.drop_duplicates()
    summary["duplicates_removed"] = before - len(df)

    # Fill missing values
    missing_info = {}
    for col in df.columns:
        missing = df[col].isna().sum()
        if missing > 0:
            if df[col].dtype == "object":
                df[col].fillna(df[col].mode()[0], inplace=True)
            else:
                df[col].fillna(df[col].mean(), inplace=True)
            missing_info[col] = int(missing)
    summary["missing_values_filled"] = missing_info

    # Standardize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Smart Type Conversion (Object -> Number)
    for col in df.columns:
        if df[col].dtype == 'object':
            # Try removing currency symbols and commas
            try:
                # Check if it looks numeric-ish
                cleaned_series = df[col].astype(str).str.replace(r'[$,]', '', regex=True)
                # Try converting to numeric
                converted = pd.to_numeric(cleaned_series, errors='raise')
                # If successful, replace the column
                df[col] = converted
            except (ValueError, TypeError):
                # Check if it can be a date? (Optional, but let's stick to numbers for now to avoid breaking things)
                pass

    # Date Detection
    date_cols = []
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            date_cols.append(col)
        elif df[col].dtype == 'object':
            # Try parsing a sample
            try:
                pd.to_datetime(df[col].dropna().head(50), errors='raise')
                df[col] = pd.to_datetime(df[col], errors='coerce')
                date_cols.append(col)
            except (ValueError, TypeError):
                pass

    summary["date_columns"] = date_cols
    summary["data_types"] = {col: str(df[col].dtype) for col in df.columns}
    summary["rows_after_cleaning"] = len(df)
    summary["columns"] = len(df.columns)
    summary["final_shape"] = df.shape

    return df, summary
