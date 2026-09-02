from datetime import datetime
from app.schemas.base import CamelModel


class InterviewBase(CamelModel):
    job_application_id: int | None = None
    company: str
    title: str
    interview_date: datetime
    type: str | None = "Technical Interview"
    interviewer: str | None = None
    location: str | None = "Google Meet"
    meeting_link: str | None = None
    preparation_notes: str | None = None
    status: str | None = "SCHEDULED"
    days_away_badge: str | None = None
    company_logo: str | None = None


class InterviewRequest(CamelModel):
    job_application_id: int | None = None
    company: str | None = None
    title: str | None = None
    interview_date: datetime | None = None
    type: str | None = None
    interviewer: str | None = None
    location: str | None = None
    meeting_link: str | None = None
    preparation_notes: str | None = None
    status: str | None = None
    company_logo: str | None = None


class InterviewResponse(InterviewBase):
    id: int
