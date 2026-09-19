"""Execute a closed set of analytical operations, never Python from a model."""
import pandas as pd

def execute_plan(df, plan):
    if not isinstance(plan, dict): raise ValueError("Expected query object")
    op = plan.get("operation")
    if op == "preview": return df.head(20)
    if op == "count": return pd.DataFrame({"row_count": [len(df)]})
    if op not in {"sum", "mean", "min", "max"}: raise ValueError("Unsupported operation")
    field, group = plan.get("field"), plan.get("group_by")
    if field not in df.columns or not pd.api.types.is_numeric_dtype(df[field]): raise ValueError("Choose a numeric field")
    if group is not None:
        if group not in df.columns: raise ValueError("Unknown grouping field")
        grouped = df.groupby(group, dropna=False)[field]
        return (grouped.sum(min_count=1) if op == "sum" else grouped.agg(op)).reset_index()
    value = df[field].sum(min_count=1) if op == "sum" else getattr(df[field], op)()
    return pd.DataFrame({field: [value]})
