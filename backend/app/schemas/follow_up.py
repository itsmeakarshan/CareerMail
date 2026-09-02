from datetime import date
from app.schemas.base import CamelModel


class FollowUpBase(CamelModel):
    job_application_id: int | None = None
    company: str
    role: str | None = None
    due_date: date
    applied_subtitle: str | None = None
    days_due_badge: str | None = None
    company_logo: str | None = None
    status: str | None = "PENDING"
    notes: str | None = None


class FollowUpRequest(CamelModel):
    job_application_id: int | None = None
    company: str | None = None
    role: str | None = None
    due_date: date | None = None
    notes: str | None = None
    status: str | None = None
    company_logo: str | None = None


class FollowUpResponse(FollowUpBase):
    id: int
