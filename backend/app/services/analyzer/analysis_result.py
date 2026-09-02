from dataclasses import dataclass, field
from datetime import datetime
from app.models.enums import EmailClassification, ApplicationStatus, RecruiterType


@dataclass
class RecruiterContactInfo:
    name: str | None = None
    email: str | None = None
    title: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    recruiter_type: RecruiterType = RecruiterType.NO_RECRUITER_IDENTIFIED
    confidence: int = 0
    extraction_source: str = "Rule-based Analyzer"


@dataclass
class EmailAnalysisResult:
    is_job_related: bool = False
    classification: EmailClassification | None = None
    confidence_score: float = 0.0
    detected_company: str | None = None
    detected_role: str | None = None
    suggested_status: ApplicationStatus | None = None
    recruiter_info: RecruiterContactInfo = field(default_factory=RecruiterContactInfo)
    interview_date: datetime | None = None
    interview_type: str | None = None
    meeting_link: str | None = None
    timeline_title: str | None = None
    timeline_description: str | None = None
    notes: str | None = None
