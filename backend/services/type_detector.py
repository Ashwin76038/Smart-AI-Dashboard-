"""
Type detection service for automatic column type inference
"""
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any


class TypeDetector:
    """Detects and classifies column types in datasets"""
    
    @staticmethod
    def analyze_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Analyze all columns and return detailed type information
        
        Returns:
            List of column metadata including:
            - name: column name
            - dtype: pandas dtype
            - semantic_type: quantitative, nominal, ordinal, temporal
            - analytic_type: dimension or measure
            - sample_values: first 5 unique values
            - null_count: number of null values
            - unique_count: number of unique values
        """
        column_info = []
        
        for col in df.columns:
            info = {
                'name': col,
                'dtype': str(df[col].dtype),
                'null_count': int(df[col].isnull().sum()),
                'unique_count': int(df[col].nunique()),
                'sample_values': df[col].dropna().unique()[:5].tolist()
            }
            
            # Determine semantic and analytic types
            semantic, analytic = TypeDetector._classify_column(df[col])
            info['semantic_type'] = semantic
            info['analytic_type'] = analytic
            
            # Add data range for numeric columns
            if semantic == 'quantitative':
                info['min'] = float(df[col].min()) if pd.notna(df[col].min()) else None
                info['max'] = float(df[col].max()) if pd.notna(df[col].max()) else None
                info['mean'] = float(df[col].mean()) if pd.notna(df[col].mean()) else None
            
            # Add date range for temporal columns
            if semantic == 'temporal':
                info['date_min'] = str(df[col].min()) if pd.notna(df[col].min()) else None
                info['date_max'] = str(df[col].max()) if pd.notna(df[col].max()) else None
            
            column_info.append(info)
        
        return column_info
    
    @staticmethod
    def _classify_column(series: pd.Series) -> tuple:
        """
        Classify a single column into semantic and analytic types
        
        Returns:
            (semantic_type, analytic_type)
            semantic_type: 'quantitative' | 'nominal' | 'ordinal' | 'temporal'
            analytic_type: 'dimension' | 'measure'
        """
        # Check for temporal data
        if pd.api.types.is_datetime64_any_dtype(series):
            return 'temporal', 'dimension'
        
        # Try to infer date from string
        if series.dtype == 'object':
            # Skip ID-like columns for date inference
            if any(id_term in series.name.lower() for id_term in ['id', 'key', 'code', 'uuid']):
                return 'nominal', 'dimension'
                
            sample = series.dropna().head(100)
            if TypeDetector._is_likely_date(sample):
                return 'temporal', 'dimension'
        
        # Check for numeric data
        if pd.api.types.is_numeric_dtype(series):
            # Determine if it's a measure or dimension
            unique_ratio = series.nunique() / len(series)
            
            # If few unique values relative to total, likely a dimension (categorical)
            # e.g., ratings (1-5), categories encoded as numbers
            if unique_ratio < 0.05 and series.nunique() < 20:
                return 'ordinal', 'dimension'
            else:
                return 'quantitative', 'measure'
        
        # Categorical/String data
        unique_count = series.nunique()
        
        # If very few unique values, it's nominal (categorical dimension)
        if unique_count < 50:
            return 'nominal', 'dimension'
        
        # If many unique values (like IDs, names), still nominal but might be identifier
        return 'nominal', 'dimension'
    
    @staticmethod
    def _is_likely_date(sample: pd.Series) -> bool:
        """Check if string column is likely a date"""
        try:
            # Try parsing first few values
            parsed_count = 0
            for val in sample.head(10):
                try:
                    pd.to_datetime(val)
                    parsed_count += 1
                except:
                    pass
            
            # If >70% parse as dates, consider it temporal
            return parsed_count / min(len(sample), 10) > 0.7
        except:
            return False
    
    @staticmethod
    def infer_chart_types(column_info: List[Dict[str, Any]]) -> List[str]:
        """
        Suggest appropriate chart types based on column structure
        
        Returns:
            List of suggested chart types: 'line', 'bar', 'scatter', 'pie', 'heatmap'
        """
        suggestions = []
        
        temporal_cols = [c for c in column_info if c['semantic_type'] == 'temporal']
        quantitative_cols = [c for c in column_info if c['semantic_type'] == 'quantitative']
        categorical_cols = [c for c in column_info if c['semantic_type'] in ['nominal', 'ordinal']]
        
        # Time series chart
        if temporal_cols and quantitative_cols:
            suggestions.append('line')
        
        # Bar chart for categorical comparisons
        if categorical_cols and quantitative_cols:
            suggestions.append('bar')
        
        # Scatter plot for numeric relationships
        if len(quantitative_cols) >= 2:
            suggestions.append('scatter')
        
        # Pie chart for categorical distribution
        if len(categorical_cols) >= 1 and len(quantitative_cols) >= 1:
            # Only suggest pie if categorical has few unique values
            if categorical_cols[0]['unique_count'] <= 10:
                suggestions.append('pie')
        
        # Heatmap for correlations
        if len(quantitative_cols) >= 3:
            suggestions.append('heatmap')
        
        return suggestions if suggestions else ['bar']  # Default to bar chart


# Singleton instance
type_detector = TypeDetector()
