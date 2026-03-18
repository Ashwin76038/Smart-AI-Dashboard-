"""
Dashboard Builder Service
Orchestrates complete dashboard generation with layout and organization
"""
import uuid
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime
from .analysis_service import AnalysisService


class DashboardBuilder:
    """Builds complete dashboard configurations from datasets"""
    
    def __init__(self):
        from .type_detector import TypeDetector
        self.type_detector = TypeDetector()
        self.gw_generator = AnalysisService()
    
    def build_dashboard(
        self, 
        df: pd.DataFrame, 
        dataset_id: str,
        dataset_name: str = "Dataset"
    ) -> Dict[str, Any]:
        """
        Main orchestration function to build complete dashboard
        
        Args:
            df: Source DataFrame
            dataset_id: Unique identifier for the dataset
            dataset_name: Display name for the dataset
            
        Returns:
            Complete dashboard configuration
        """
        # Analyze columns
        column_info = self.type_detector.analyze_columns(df)
        
        # Generate Graphic Walker fields
        fields = self.gw_generator.prepare_fields(df)
        
        # Recommend and generate charts
        chart_recommendations = self.gw_generator.recommend_charts(df, column_info)
        charts = []
        for rec in chart_recommendations:
            spec = self.gw_generator.generate_chart_spec(rec, fields)
            recharts_spec = self.gw_generator.generate_recharts_spec(rec, fields)
            charts.append({
                'id': rec['id'],
                'title': rec['title'],
                'section': rec.get('section', 'general'),
                'spec': spec,  # GraphicWalker spec (for backwards compatibility)
                'rechartsSpec': recharts_spec  # Recharts spec (for rendering)
            })
        
        # Generate KPI cards
        kpis = self.gw_generator.build_kpi_cards(df, column_info)
        
        # Create layout
        layout = self.create_layout(charts, kpis)
        
        # Generate filter configurations
        filters = self.generate_filters(column_info)
        
        # Build complete dashboard object
        dashboard = {
            'dashboardId': str(uuid.uuid4()),
            'datasetId': dataset_id,
            'datasetName': dataset_name,
            'fields': fields,
            'charts': charts,
            'kpis': kpis,
            'layout': layout,
            'filters': filters,
            'data': df.to_dict(orient='records'),
            'metadata': {
                'createdAt': datetime.now().isoformat(),
                'rowCount': len(df),
                'columnCount': len(df.columns),
                'chartCount': len(charts)
            }
        }
        
        return dashboard
    
    def create_layout(
        self, 
        charts: List[Dict[str, Any]], 
        kpis: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Assign grid positions to charts and organize into sections
        
        Args:
            charts: List of chart configurations
            kpis: List of KPI cards
            
        Returns:
            Layout configuration with sections and grid positions
        """
        # Group charts by section
        sections_map = {}
        for chart in charts:
            section = chart.get('section', 'general')
            if section not in sections_map:
                sections_map[section] = []
            sections_map[section].append(chart)
        
        # Create layout sections
        sections = []
        
        # KPI Overview section (always first)
        if kpis:
            sections.append({
                'id': 'kpi_overview',
                'title': 'Key Metrics',
                'type': 'kpi',
                'items': kpis,
                'gridConfig': {
                    'cols': 4,
                    'rows': 1
                }
            })
        
        # Section order preference
        section_order = ['trends', 'category_analysis', 'distribution', 'correlation', 'general']
        section_titles = {
            'trends': 'Trends Over Time',
            'category_analysis': 'Category Analysis',
            'distribution': 'Distribution Analysis',
            'correlation': 'Correlation Analysis',
            'general': 'Additional Insights'
        }
        
        # Add chart sections
        for section_key in section_order:
            if section_key in sections_map and sections_map[section_key]:
                charts_in_section = sections_map[section_key]
                sections.append({
                    'id': section_key,
                    'title': section_titles.get(section_key, section_key.title()),
                    'type': 'charts',
                    'items': [{'chartId': c['id'], 'title': c['title']} for c in charts_in_section],
                    'gridConfig': self._calculate_grid_config(len(charts_in_section))
                })
        
        return {
            'sections': sections,
            'gridSystem': '12-column',
            'responsive': True
        }
    
    def _calculate_grid_config(self, chart_count: int) -> Dict[str, int]:
        """Calculate optimal grid configuration for charts"""
        if chart_count == 1:
            return {'cols': 1, 'rows': 1}
        elif chart_count == 2:
            return {'cols': 2, 'rows': 1}
        elif chart_count <= 4:
            return {'cols': 2, 'rows': 2}
        else:
            return {'cols': 3, 'rows': (chart_count + 2) // 3}
    
    def generate_filters(
        self, 
        column_info: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Create filter configurations based on dimensions
        
        Args:
            column_info: Column metadata
            
        Returns:
            List of filter configurations
        """
        filters = []
        
        # Get dimension columns suitable for filtering
        dimension_cols = [
            c for c in column_info 
            if c['analytic_type'] == 'dimension' 
            and c['unique_count'] <= 100  # Reasonable filter size
            and c['unique_count'] > 1
        ]
        
        for col in dimension_cols[:5]:  # Limit to 5 filters
            filter_config = {
                'id': f"filter_{col['name']}",
                'field': col['name'],
                'label': col['name'],
                'type': self._get_filter_type(col),
                'enabled': False  # Filters start disabled
            }
            
            # Add specific config based on type
            if col['semantic_type'] == 'temporal':
                filter_config['filterType'] = 'dateRange'
                filter_config['config'] = {
                    'minDate': col.get('date_min'),
                    'maxDate': col.get('date_max')
                }
            elif col['unique_count'] <= 20:
                filter_config['filterType'] = 'select'
                filter_config['config'] = {
                    'options': col.get('sample_values', []),
                    'multiple': True
                }
            else:
                filter_config['filterType'] = 'search'
                filter_config['config'] = {
                    'searchable': True
                }
            
            filters.append(filter_config)
        
        return filters
    
    def _get_filter_type(self, column: Dict[str, Any]) -> str:
        """Determine appropriate filter widget type"""
        if column['semantic_type'] == 'temporal':
            return 'dateRange'
        elif column['unique_count'] <= 10:
            return 'checkbox'
        elif column['unique_count'] <= 50:
            return 'select'
        else:
            return 'search'
    
    def serialize_dashboard(self, dashboard: Dict[str, Any]) -> str:
        """
        Serialize dashboard to JSON string
        
        Args:
            dashboard: Dashboard configuration
            
        Returns:
            JSON string representation
        """
        import json
        return json.dumps(dashboard, indent=2, default=str)


# Singleton instance
dashboard_builder = DashboardBuilder()
