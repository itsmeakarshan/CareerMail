from datetime import datetime
from pydantic import Field, field_validator
from app.schemas.base import CamelModel
from app.schemas.application import JobApplicationResponse


class EmailResponse(CamelModel):
    id: int
    sender: str
    sender_email: str
    recipient_email: str | None = None
    subject: str
    preview: str | None = None
    body: str
    timestamp: datetime
    read: bool = Field(default=False, alias="read")
    starred: bool = Field(default=False, alias="starred")
    important: bool = Field(default=False, alias="important")
    folder: str
    labels: str | None = None
    job_related: bool = Field(default=False, alias="jobRelated")
    detected_company: str | None = None
    detected_role: str | None = None
    detected_status: str | None = None
    detected_recruiter_name: str | None = None
    detected_recruiter_email: str | None = None
    detected_recruiter_title: str | None = None
    detected_recruiter_type: str | None = None
    detected_recruiter_confidence: int | None = None
    classification: str | None = None
    gmail_message_id: str | None = None
    gmail_thread_id: str | None = None
    job_application: JobApplicationResponse | None = None


class EmailComposeRequest(CamelModel):
    to: str
    subject: str
    body: str
    job_application_id: int | None = None
    recruiter_name: str | None = None


class EmailSimulateRequest(CamelModel):
    sender: str = "Recruiter"
    sender_email: str = "recruiter@example.com"
    subject: str = "Update on your application"
    body: str = "Thank you for applying."
    important: bool = False
