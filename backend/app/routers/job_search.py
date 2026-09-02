from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.job_search import (
    CvProfileDto,
    JobListing,
    ConvertJobToApplicationRequest,
    SaveJobRequest,
    ResolveRealLinkRequest
)
from app.schemas.application import JobApplicationResponse
from app.services.cv_parsing_service import CvParsingService
from app.services.job_search_service import JobSearchService
from app.services.gemini_cv_service import GeminiCvService

router = APIRouter(tags=["Job Search & CV Matching"])


@router.post("/job-search/cv", response_model=CvProfileDto)
async def upload_cv(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = CvParsingService(db)
    return await service.parse_and_save_cv(user_id, file)


@router.get("/job-search/cv", response_model=CvProfileDto | None)
def get_cv_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = CvParsingService(db)
    return service.get_user_profile(user_id)


@router.get("/job-search/jobs", response_model=list[JobListing])
@router.get("/job-search/search", response_model=list[JobListing])
@router.get("/jobs", response_model=list[JobListing])
async def search_jobs(
    q: str | None = Query(default=None),
    query: str | None = Query(default=None),
    location: str | None = Query(default=None),
    work_type: str | None = Query(default=None, alias="workType"),
    min_score: int = Query(default=0, alias="minScore"),
    sort_by: str = Query(default="score", alias="sortBy"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cv_service = CvParsingService(db)
    profile = cv_service.get_profile_entity(user_id)
    search_service = JobSearchService(db)

    effective_query = q or query
    return await search_service.search_jobs(
        profile=profile,
        query=effective_query,
        location=location,
        work_type=work_type,
        min_score=min_score,
        sort_by=sort_by
    )


@router.post("/job-search/match", response_model=list[JobListing])
async def match_jobs(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cv_service = CvParsingService(db)
    profile = cv_service.get_profile_entity(user_id)
    search_service = JobSearchService(db)
    return await search_service.search_jobs(profile=profile, min_score=0)


@router.get("/job-search/jobs/{job_id}", response_model=JobListing | None)
async def get_job_by_id(
    job_id: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cv_service = CvParsingService(db)
    profile = cv_service.get_profile_entity(user_id)
    search_service = JobSearchService(db)
    return await search_service.get_job_by_id(profile, job_id)


@router.post("/job-search/save")
@router.post("/job-search/{job_id}/save")
def save_job(
    request: SaveJobRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobSearchService(db)
    saved = service.save_job(user_id, request)
    return {"success": True, "savedJob": {"id": saved.id, "jobId": saved.job_id}}


@router.get("/job-search/saved")
def get_saved_jobs(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobSearchService(db)
    saved = service.get_saved_jobs(user_id)
    return [
        {
            "id": s.id,
            "jobId": s.job_id,
            "title": s.title,
            "company": s.company,
            "location": s.location,
            "employmentType": s.employment_type,
            "salary": s.salary,
            "url": s.url,
            "matchScore": s.match_score,
            "savedAt": s.saved_at
        }
        for s in saved
    ]


@router.post("/job-search/hide")
@router.post("/job-search/{job_id}/hide")
def hide_job(
    user_id: int = Depends(get_current_user_id)
):
    return {"success": True, "message": "Job hidden from feed"}


@router.post("/job-search/convert-to-application", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def convert_to_application(
    request: ConvertJobToApplicationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = JobSearchService(db)
    return service.convert_job_to_application(user_id, request)


@router.post("/job-search/resolve-real-link")
def resolve_real_link(
    request: ResolveRealLinkRequest
):
    gemini_svc = GeminiCvService()
    resolved_url = gemini_svc.resolve_real_job_url(
        job_id=request.job_id,
        title=request.title,
        company=request.company,
        location=request.location,
        current_url=request.current_url
    )
    return {"success": True, "url": resolved_url, "resolvedUrl": resolved_url}
