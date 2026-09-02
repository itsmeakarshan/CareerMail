from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Analytics & Dashboard"])


@router.get("/analytics", response_model=AnalyticsResponse)
@router.get("/dashboard", response_model=AnalyticsResponse)
@router.get("/analytics/dashboard", response_model=AnalyticsResponse)
@router.get("/analytics/summary", response_model=AnalyticsResponse)
@router.get("/dashboard/summary", response_model=AnalyticsResponse)
def get_analytics(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    return service.get_analytics(user_id)
