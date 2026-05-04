from __future__ import annotations

from fastapi import Depends
from backend.services.data_ingestion.service import DataIngestionService
from backend.services.ai.analytics_service import AIAnalyticsService
from backend.services.ai.prediction_engine import PredictionEngine
from backend.services.ai.tactical_search import TacticalSearchEngine


# Service instances (would be properly managed in production)
_data_service = None
_ai_service = None
_prediction_engine = None
_tactical_search = None


def get_data_service() -> DataIngestionService:
    """Get data ingestion service instance"""
    global _data_service
    if _data_service is None:
        _data_service = DataIngestionService()
    return _data_service


def get_ai_service() -> AIAnalyticsService:
    """Get AI analytics service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIAnalyticsService()
    return _ai_service


def get_prediction_engine() -> PredictionEngine:
    """Get prediction engine instance"""
    global _prediction_engine
    if _prediction_engine is None:
        data_service = get_data_service()
        ai_service = get_ai_service()
        _prediction_engine = PredictionEngine(ai_service)
    return _prediction_engine


def get_tactical_search() -> TacticalSearchEngine:
    """Get tactical search engine instance"""
    global _tactical_search
    if _tactical_search is None:
        ai_service = get_ai_service()
        _tactical_search = TacticalSearchEngine(ai_service)
    return _tactical_search