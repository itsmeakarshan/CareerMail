from datetime import datetime, date
from app.schemas.base import CamelModel
from app.schemas.interview import InterviewResponse
from app.schemas.follow_up import FollowUpResponse


class TimelineEventDto(CamelModel):
    id: int | None = None
    title: str
    description: str | None = None
    event_date: datetime
    event_type: str | None = None


class JobApplicationRequest(CamelModel):
    company: str | None = None
    title: str | None = None
    location: str | None = None
    employment_type: str | None = None
    salary: str | None = None
    date_applied: date | None = None
    status: str | None = None
    priority: str | None = None
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    recruiter_title: str | None = None
    recruiter_phone: str | None = None
    recruiter_linkedin: str | None = None
    recruiter_type: str | None = None
    contact_confidence: int | None = None
    contact_extraction_source: str | None = None
    source: str | None = None
    notes: str | None = None
    next_follow_up_date: date | None = None
    company_logo: str | None = None
    activity_subtitle: str | None = None


class StatusUpdateRequest(CamelModel):
    status: str


class JobApplicationResponse(CamelModel):
    id: int
    company: str
    title: str
    location: str | None = "Remote"
    employment_type: str | None = "Full-time"
    salary: str | None = None
    date_applied: date | None = None
    status: str
    priority: str
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    recruiter_title: str | None = None
    recruiter_phone: str | None = None
    recruiter_linkedin: str | None = None
    recruiter_type: str | None = None
    contact_confidence: int | None = None
    contact_extraction_source: str | None = None
    source: str | None = None
    job_url: str | None = None
    notes: str | None = None
    last_activity_date: date | None = None
    next_follow_up_date: date | None = None
    company_logo: str | None = None
    activity_subtitle: str | None = "Applied recently"
    timeline_events: list[TimelineEventDto] = []
    interviews: list[InterviewResponse] = []
    follow_ups: list[FollowUpResponse] = []
