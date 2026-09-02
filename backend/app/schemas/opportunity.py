from datetime import datetime
from app.schemas.base import CamelModel


class OpportunityDTO(CamelModel):
    id: int
    company: str
    role: str
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    subject: str
    snippet: str | None = None
    full_body: str | None = None
    body: str | None = None
    received_at: datetime | None = None
    timestamp: datetime | None = None
    location: str | None = "Remote / Hybrid"
    salary: str | None = "Competitive"
    opportunity_type: str | None = "Recruiter Reachout"
    type: str | None = "Recruiter Reachout"
    is_converted: bool = False
    converted: bool = False
    application_id: int | None = None
    tags: list[str] = []
    is_dismissed: bool = False
    dismissed: bool = False


class OpportunityScanResult(CamelModel):
    success: bool = True
    scanned_count: int = 0
    opportunities_count: int = 0
    opportunities_found: int = 0
    message: str
    opportunities: list[OpportunityDTO] = []
