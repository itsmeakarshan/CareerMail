from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.interview import InterviewRequest, InterviewResponse
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.get("", response_model=list[InterviewResponse])
def get_all_interviews(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    return service.get_all_interviews(user_id)


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview_by_id(
    interview_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    return service.get_interview_by_id(user_id, interview_id)


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    request: InterviewRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    return service.create_interview(user_id, request)


@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    request: InterviewRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    return service.update_interview(user_id, interview_id, request)


@router.patch("/{interview_id}", response_model=InterviewResponse)
def patch_interview(
    interview_id: int,
    request: InterviewRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    return service.update_interview(user_id, interview_id, request)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    interview_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    service.delete_interview(user_id, interview_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
