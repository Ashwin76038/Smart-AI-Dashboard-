# Services module
"""
Services package for data processing and analysis
"""
from .type_detector import TypeDetector, type_detector
from .analysis_service import AnalysisService, analysis_service
from .dashboard_builder import DashboardBuilder, dashboard_builder

__all__ = ['TypeDetector', 'type_detector', 'AnalysisService', 'analysis_service', 'DashboardBuilder', 'dashboard_builder']
