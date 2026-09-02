from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.opportunity import OpportunityDTO, OpportunityScanResult
from app.schemas.application import JobApplicationResponse
from app.services.opportunity_service import OpportunityService

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


@router.get("", response_model=list[OpportunityDTO])
def get_opportunities(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = OpportunityService(db)
    return service.get_opportunities(user_id)


@router.post("/{email_id}/convert", response_model=JobApplicationResponse)
def convert_opportunity_to_application(
    email_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = OpportunityService(db)
    return service.convert_to_application(user_id, email_id)


@router.post("/scan", response_model=OpportunityScanResult)
def scan_opportunities(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = OpportunityService(db)
    return service.scan_for_opportunities(user_id)
