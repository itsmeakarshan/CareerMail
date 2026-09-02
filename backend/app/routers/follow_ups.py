from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.follow_up import FollowUpRequest, FollowUpResponse
from app.services.follow_up_service import FollowUpService

router = APIRouter(tags=["Follow-ups"])


@router.get("/followups", response_model=list[FollowUpResponse])
@router.get("/follow-ups", response_model=list[FollowUpResponse])
def get_all_follow_ups(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = FollowUpService(db)
    return service.get_all_follow_ups(user_id)


@router.get("/followups/{follow_up_id}", response_model=FollowUpResponse)
@router.get("/follow-ups/{follow_up_id}", response_model=FollowUpResponse)
def get_follow_up_by_id(
    follow_up_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = FollowUpService(db)
    return service.get_follow_up_by_id(user_id, follow_up_id)


@router.post("/followups", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED)
@router.post("/follow-ups", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED)
def create_follow_up(
    request: FollowUpRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = FollowUpService(db)
    return service.create_follow_up(user_id, request)


@router.put("/followups/{follow_up_id}", response_model=FollowUpResponse)
@router.put("/follow-ups/{follow_up_id}", response_model=FollowUpResponse)
def update_follow_up(
    follow_up_id: int,
    request: FollowUpRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = FollowUpService(db)
    return service.update_follow_up(user_id, follow_up_id, request)


@router.patch("/followups/{follow_up_id}", response_model=FollowUpResponse)
@router.patch("/follow-ups/{follow_up_id}", response_model=FollowUpResponse)
def patch_follow_up(
    follow_up_id: int,
    request: FollowUpRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = FollowUpService(db)
    return service.update_follow_up(user_id, follow_up_id, request)


@router.delete("/followups/{follow_up_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/follow-ups/{follow_up_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_follow_up(
    follow_up_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = FollowUpService(db)
    service.delete_follow_up(user_id, follow_up_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
