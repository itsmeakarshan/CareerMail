from datetime import datetime, date
from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import (
    ApplicationStatus,
    EmailClassification,
    EmailFolder,
    FollowUpStatus,
    InterviewStatus,
    Priority,
    RecruiterType
)


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    gemini_api_key = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    connected_accounts = relationship("ConnectedAccount", back_populates="user", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="user", cascade="all, delete-orphan")
    cv_profiles = relationship("CvProfile", back_populates="user", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJobListing", back_populates="user", cascade="all, delete-orphan")


class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), default="google", nullable=False)
    provider_email = Column(String(255), nullable=True)
    provider_account_id = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    scope = Column(String(500), nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    total_emails_scanned = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="connected_accounts")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    location = Column(String(255), default="Remote")
    employment_type = Column(String(100), default="Full-time")
    salary = Column(String(100), nullable=True)
    date_applied = Column(Date, default=date.today)
    status = Column(String(50), default=ApplicationStatus.APPLIED.value, nullable=False)
    priority = Column(String(50), default=Priority.MEDIUM.value, nullable=False)

    recruiter_name = Column(String(255), nullable=True)
    recruiter_email = Column(String(255), nullable=True)
    recruiter_title = Column(String(255), nullable=True)
    recruiter_phone = Column(String(100), nullable=True)
    recruiter_linkedin = Column(String(500), nullable=True)
    recruiter_type = Column(String(50), default=RecruiterType.NO_RECRUITER_IDENTIFIED.value)
    contact_confidence = Column(Integer, nullable=True)
    contact_extraction_source = Column(String(255), nullable=True)

    source = Column(String(255), default="Direct Application")
    notes = Column(Text, nullable=True)
    last_activity_date = Column(Date, default=date.today)
    next_follow_up_date = Column(Date, nullable=True)
    company_logo = Column(String(255), nullable=True)
    activity_subtitle = Column(String(255), default="Applied recently")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="job_applications")
    timeline_events = relationship("TimelineEvent", back_populates="job_application", cascade="all, delete-orphan", order_by="desc(TimelineEvent.event_date)")
    interviews = relationship("Interview", back_populates="job_application", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="job_application", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="job_application")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    job_application_id = Column(BigInteger, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    event_type = Column(String(100), nullable=True)

    job_application = relationship("JobApplication", back_populates="timeline_events")


class Email(Base):
    __tablename__ = "emails"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(255), nullable=False)
    sender_email = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=False)
    preview = Column(Text, nullable=True)
    body = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_starred = Column(Boolean, default=False, nullable=False)
    is_important = Column(Boolean, default=False, nullable=False)
    folder = Column(String(50), default=EmailFolder.INBOX.value, nullable=False)
    labels = Column(String(255), nullable=True)

    job_application_id = Column(BigInteger, ForeignKey("job_applications.id", ondelete="SET NULL"), nullable=True, index=True)
    is_job_related = Column(Boolean, default=False, nullable=False)
    detected_company = Column(String(255), nullable=True)
    detected_role = Column(String(255), nullable=True)
    detected_status = Column(String(50), nullable=True)

    detected_recruiter_name = Column(String(255), nullable=True)
    detected_recruiter_email = Column(String(255), nullable=True)
    detected_recruiter_title = Column(String(255), nullable=True)
    detected_recruiter_type = Column(String(50), nullable=True)
    detected_recruiter_confidence = Column(Integer, nullable=True)

    classification = Column(String(50), nullable=True)
    gmail_message_id = Column(String(255), nullable=True, index=True)
    gmail_thread_id = Column(String(255), nullable=True)
    processed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="emails")
    job_application = relationship("JobApplication", back_populates="emails")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    job_application_id = Column(BigInteger, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    type = Column(String(100), default="Technical Interview")
    interviewer = Column(String(255), nullable=True)
    location = Column(String(255), default="Google Meet")
    meeting_link = Column(String(500), nullable=True)
    preparation_notes = Column(Text, nullable=True)
    status = Column(String(50), default=InterviewStatus.SCHEDULED.value, nullable=False)
    days_away_badge = Column(String(50), nullable=True)
    company_logo = Column(String(255), nullable=True)

    user = relationship("User", back_populates="interviews")
    job_application = relationship("JobApplication", back_populates="interviews")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    job_application_id = Column(BigInteger, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=False)
    applied_subtitle = Column(String(255), nullable=True)
    days_due_badge = Column(String(50), nullable=True)
    company_logo = Column(String(255), nullable=True)
    status = Column(String(50), default=FollowUpStatus.PENDING.value, nullable=False)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="follow_ups")
    job_application = relationship("JobApplication", back_populates="follow_ups")


class CvProfile(Base):
    __tablename__ = "cv_profiles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), default="")
    raw_text = Column(Text, default="")
    extracted_skills = Column("extracted_skills", Text, default="[]")
    target_roles = Column("target_roles", Text, default="[]")
    experience_years = Column(Integer, default=0)
    education_level = Column(String(255), default="Bachelor's Degree")
    preferred_location = Column(String(255), default="Flexible / Remote")
    is_remote_preferred = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="cv_profiles")


class SavedJobListing(Base):
    __tablename__ = "saved_job_listings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), default="")
    employment_type = Column(String(100), default="Full-time")
    salary = Column(String(100), default="")
    url = Column(String(500), default="")
    match_score = Column(Integer, default=0)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="saved_jobs")
