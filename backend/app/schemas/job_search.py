from datetime import datetime
from app.schemas.base import CamelModel


class CvProfileDto(CamelModel):
    id: int
    file_name: str
    extracted_skills: list[str] = []
    target_roles: list[str] = []
    experience_years: int
    education_level: str
    preferred_location: str
    is_remote_preferred: bool
    uploaded_at: datetime


class RelatedSkillMatch(CamelModel):
    candidate_skill: str
    job_skill: str
    weight_multiplier: float
    relation_type: str
    explanation: str


class JobListing(CamelModel):
    id: str
    title: str
    company: str
    company_domain: str | None = None
    company_logo_url: str | None = None
    location: str
    country: str | None = "Global"
    city: str | None = "Remote"
    work_mode: str | None = "REMOTE"
    employment_type: str = "Full-time"
    experience_level: str | None = "Mid Level"
    salary_min: float | None = None
    salary_max: float | None = None
    currency: str | None = "GBP"
    salary: str = "Competitive"
    description: str
    url: str
    source_url: str | None = None
    apply_url: str | None = None
    linked_in_url: str | None = None
    indeed_url: str | None = None
    google_jobs_url: str | None = None
    is_external_application: bool | None = True
    posted_date: str = "Recently"
    source: str = "Career Hub"
    source_job_id: str | None = None
    skills: list[str] = []
    match_score: int = 0
    match_quality_label: str | None = "FAIR MATCH"
    matching_skills: list[str] = []
    related_skills: list[RelatedSkillMatch] = []
    missing_skills: list[str] = []
    skills_score: int = 0
    role_relevance_score: int = 0
    experience_relevance_score: int = 0
    location_score: int = 0
    education_score: int = 0
    explanation: str = ""


class JobSearchPayload(CamelModel):
    query: str | None = None
    q: str | None = None
    location: str | None = None
    work_type: str | None = None
    min_score: int = 0
    sort_by: str | None = "score"


class ConvertJobToApplicationRequest(CamelModel):
    title: str = ""
    company: str = ""
    location: str = ""
    employment_type: str = "Full-time"
    salary: str = ""
    url: str = ""
    description: str = ""


class SaveJobRequest(CamelModel):
    job_id: str = ""
    title: str = ""
    company: str = ""
    location: str = ""
    employment_type: str = ""
    salary: str = ""
    url: str = ""
    match_score: int = 0


class ResolveRealLinkRequest(CamelModel):
    job_id: str | None = None
    title: str | None = None
    company: str | None = None
    location: str | None = None
    current_url: str | None = None
