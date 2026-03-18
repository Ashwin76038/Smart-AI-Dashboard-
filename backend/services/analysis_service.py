"""
Analysis Service
Automatically generates chart specifications from dataset metadata
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from .type_detector import TypeDetector


class AnalysisService:
    """Generates analysis specifications automatically"""
    
    def __init__(self):
        self.type_detector = TypeDetector()
    
    def prepare_fields(self, df: pd.DataFrame) -> List[Dict[str, str]]:
        """
        Convert DataFrame columns to field format
        """
        column_info = self.type_detector.analyze_columns(df)
        fields = []
        
        for col in column_info:
            semantic_type = col['semantic_type']
            analytic_type = col['analytic_type']
            
            field = {
                'fid': col['name'],
                'name': col['name'],
                'semanticType': semantic_type,
                'analyticType': 'measure' if analytic_type == 'measure' else 'dimension'
            }
            
            fields.append(field)
        
        return fields
    
    def recommend_charts(
        self, 
        df: pd.DataFrame, 
        column_info: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyze dataset and recommend appropriate chart types
        """
        charts = []
        
        # Categorize columns
        temporal_cols = [c for c in column_info if c['semantic_type'] == 'temporal']
        measure_cols = [c for c in column_info if c['analytic_type'] == 'measure']
        dimension_cols = [c for c in column_info if c['analytic_type'] == 'dimension' 
                         and c['semantic_type'] != 'temporal']
        
        # Rule 1: Time + Measure → Line Chart (Trend)
        if temporal_cols and measure_cols:
            for measure in measure_cols[:2]:  # Limit to 2 measures
                charts.append({
                    'id': f"trend_{measure['name']}",
                    'type': 'line',
                    'title': f"{measure['name']} Over Time",
                    'xField': temporal_cols[0]['name'],
                    'yField': measure['name'],
                    'xType': 'temporal',
                    'yType': 'quantitative',
                    'section': 'trends'
                })
        
        # Rule 2: Category + Measure → Bar Chart (Comparison)
        if dimension_cols and measure_cols:
            # Pick dimension with reasonable cardinality
            suitable_dims = [d for d in dimension_cols if d['unique_count'] <= 20]
            if suitable_dims:
                dim = suitable_dims[0]
                for measure in measure_cols[:2]:
                    charts.append({
                        'id': f"bar_{dim['name']}_{measure['name']}",
                        'type': 'bar',
                        'title': f"{measure['name']} by {dim['name']}",
                        'xField': dim['name'],
                        'yField': measure['name'],
                        'xType': 'nominal',
                        'yType': 'quantitative',
                        'section': 'category_analysis'
                    })
        
        # Rule 3: Numeric Distribution → Histogram
        if len(measure_cols) >= 1:
            measure = measure_cols[0]
            charts.append({
                'id': f"hist_{measure['name']}",
                'type': 'bar',
                'title': f"Distribution of {measure['name']}",
                'xField': measure['name'],
                'yField': 'count()',
                'xType': 'quantitative',
                'yType': 'quantitative',
                'section': 'distribution',
                'transform': [{'bin': True, 'field': measure['name']}]
            })
        
        # Rule 4: Multi-measure → Scatter Plot
        if len(measure_cols) >= 2:
            charts.append({
                'id': f"scatter_{measure_cols[0]['name']}_{measure_cols[1]['name']}",
                'type': 'point',
                'title': f"{measure_cols[0]['name']} vs {measure_cols[1]['name']}",
                'xField': measure_cols[0]['name'],
                'yField': measure_cols[1]['name'],
                'xType': 'quantitative',
                'yType': 'quantitative',
                'section': 'correlation'
            })
        
        # Rule 5: Category distribution → Pie/Arc
        if dimension_cols and measure_cols:
            suitable_dims = [d for d in dimension_cols if 3 <= d['unique_count'] <= 10]
            if suitable_dims:
                dim = suitable_dims[0]
                measure = measure_cols[0]
                charts.append({
                    'id': f"pie_{dim['name']}",
                    'type': 'arc',
                    'title': f"{measure['name']} Distribution by {dim['name']}",
                    'colorField': dim['name'],
                    'thetaField': measure['name'],
                    'section': 'distribution'
                })
        
        return charts[:6]  # Limit to 6 charts for initial dashboard
    
    def build_kpi_cards(
        self, 
        df: pd.DataFrame, 
        column_info: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate KPI summary cards
        """
        kpis = []
        measure_cols = [c for c in column_info if c['analytic_type'] == 'measure']
        
        # Basic dataset metrics
        kpis.append({
            'id': 'kpi_total_rows',
            'label': 'Total Records',
            'value': len(df),
            'format': 'number',
            'icon': 'database'
        })
        
        kpis.append({
            'id': 'kpi_columns',
            'label': 'Data Columns',
            'value': len(df.columns),
            'format': 'number',
            'icon': 'layers'
        })
        
        # Add top 2 measure summaries
        for measure in measure_cols[:2]:
            col_name = measure['name']
            kpis.append({
                'id': f"kpi_{col_name}_sum",
                'label': f"Total {col_name}",
                'value': float(df[col_name].sum()),
                'format': 'number',
                'icon': 'trending-up'
            })
            
            kpis.append({
                'id': f"kpi_{col_name}_avg",
                'label': f"Avg {col_name}",
                'value': float(df[col_name].mean()),
                'format': 'decimal',
                'icon': 'activity'
            })
        
        return kpis[:4]  # Limit to 4 KPI cards
    
    def generate_chart_spec(
        self, 
        chart_config: Dict[str, Any], 
        fields: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Generate a legacy chart specification (minimal for backwards compatibility)
        """
        return {
            'visId': chart_config['id'],
            'name': chart_config['title']
        }
    
    def generate_recharts_spec(
        self, 
        chart_config: Dict[str, Any], 
        fields: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Generate a Recharts-compatible chart specification
        """
        chart_type = chart_config['type']
        
        # Base Recharts spec
        recharts_spec = {
            'id': chart_config['id'],
            'title': chart_config['title'],
            'type': self._map_to_recharts_type(chart_type),
            'section': chart_config.get('section', 'general'),
            'config': {
                'showGrid': True,
                'showTooltip': True,
                'showLegend': True,
                'responsive': True,
                'margin': {'top': 20, 'right': 30, 'left': 20, 'bottom': 5}
            }
        }
        
        # Configure based on chart type
        if chart_type == 'line':
            recharts_spec['config'].update({
                'xField': chart_config['xField'],
                'yField': chart_config['yField'],
                'xType': chart_config.get('xType', 'category'),
                'yType': chart_config.get('yType', 'number'),
                'stroke': '#4f46e5',  # Indigo 600
                'strokeWidth': 2,
                'dot': {'r': 4, 'fill': '#4f46e5'},
                'activeDot': {'r': 6},
                'curve': 'monotone'
            })
        
        elif chart_type == 'bar':
            if chart_config.get('transform'):
                # Histogram
                recharts_spec['config'].update({
                    'xField': chart_config['xField'],
                    'yField': 'count',
                    'fill': '#10b981',  # Emerald 500
                    'isHistogram': True,
                    'radius': [4, 4, 0, 0]
                })
            else:
                # Regular bar chart
                recharts_spec['config'].update({
                    'xField': chart_config['xField'],
                    'yField': chart_config['yField'],
                    'fill': '#6366f1',  # Indigo 500
                    'radius': [4, 4, 0, 0],
                    'barSize': 40
                })
        
        elif chart_type == 'point':
            # Scatter plot
            recharts_spec['config'].update({
                'xField': chart_config['xField'],
                'yField': chart_config['yField'],
                'fill': '#f59e0b',  # Amber 500
                'strokeWidth': 0
            })
        
        elif chart_type == 'arc':
            # Pie chart
            recharts_spec['config'].update({
                'nameField': chart_config['colorField'],
                'valueField': chart_config['thetaField'],
                'innerRadius': 60,
                'outerRadius': 80,
                'paddingAngle': 5,
                'colors': ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316']
            })
        
        return recharts_spec

    def _map_to_recharts_type(self, gw_type: str) -> str:
        """Map chart type to Recharts type"""
        mapping = {
            'line': 'line',
            'bar': 'bar',
            'point': 'scatter',
            'arc': 'pie'
        }
        return mapping.get(gw_type, 'bar')


# Singleton instance
analysis_service = AnalysisService()
