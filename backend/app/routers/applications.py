from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.application import JobApplicationRequest, StatusUpdateRequest, JobApplicationResponse
from app.services.job_application_service import JobApplicationService

router = APIRouter(prefix="/applications", tags=["Job Applications"])


@router.get("", response_model=list[JobApplicationResponse])
def get_all_applications(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.get_all_applications(user_id)


@router.get("/search", response_model=list[JobApplicationResponse])
def search_applications(
    q: str = Query(default=""),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.search_applications(user_id, q)


@router.get("/{app_id}", response_model=JobApplicationResponse)
def get_application_by_id(
    app_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.get_application_by_id(user_id, app_id)


@router.post("", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    request: JobApplicationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.create_application(user_id, request)


@router.put("/{app_id}", response_model=JobApplicationResponse)
def update_application(
    app_id: int,
    request: JobApplicationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.update_application(user_id, app_id, request)


@router.patch("/{app_id}", response_model=JobApplicationResponse)
def patch_application(
    app_id: int,
    request: JobApplicationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.update_application(user_id, app_id, request)


@router.patch("/{app_id}/status", response_model=JobApplicationResponse)
def update_application_status(
    app_id: int,
    request: StatusUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    return service.update_status(user_id, app_id, request.status)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobApplicationService(db)
    service.delete_application(user_id, app_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
