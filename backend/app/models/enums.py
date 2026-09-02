from enum import Enum


class ApplicationStatus(str, Enum):
    APPLIED = "APPLIED"
    ASSESSMENT = "ASSESSMENT"
    RECRUITER_SCREEN = "RECRUITER_SCREEN"
    INTERVIEW = "INTERVIEW"
    FINAL_INTERVIEW = "FINAL_INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

    def get_display_name(self) -> str:
        mapping = {
            ApplicationStatus.APPLIED: "Applied",
            ApplicationStatus.ASSESSMENT: "Assessment",
            ApplicationStatus.RECRUITER_SCREEN: "Recruiter Screen",
            ApplicationStatus.INTERVIEW: "Interview",
            ApplicationStatus.FINAL_INTERVIEW: "Final Interview",
            ApplicationStatus.OFFER: "Offer",
            ApplicationStatus.REJECTED: "Rejected",
            ApplicationStatus.WITHDRAWN: "Withdrawn",
        }
        return mapping.get(self, "Applied")

    @classmethod
    def from_string(cls, text: str | None) -> "ApplicationStatus":
        if not text or not str(text).strip():
            return cls.APPLIED
        normalized = str(text).strip().upper().replace(" ", "_").replace("-", "_")
        try:
            return cls(normalized)
        except ValueError:
            for item in cls:
                if item.get_display_name().lower() == str(text).strip().lower():
                    return item
            return cls.APPLIED


class EmailClassification(str, Enum):
    APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED"
    APPLICATION_RECEIVED = "APPLICATION_RECEIVED"
    RECRUITER_MESSAGE = "RECRUITER_MESSAGE"
    INTERVIEW_INVITATION = "INTERVIEW_INVITATION"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    ASSESSMENT = "ASSESSMENT"
    REJECTION = "REJECTION"
    OFFER = "OFFER"
    STATUS_UPDATE = "STATUS_UPDATE"
    NEW_OPPORTUNITY = "NEW_OPPORTUNITY"
    OTHER_JOB_RELATED = "OTHER_JOB_RELATED"

    def get_display_name(self) -> str:
        mapping = {
            EmailClassification.APPLICATION_SUBMITTED: "Application Submitted",
            EmailClassification.APPLICATION_RECEIVED: "Application Received",
            EmailClassification.RECRUITER_MESSAGE: "Recruiter Message",
            EmailClassification.INTERVIEW_INVITATION: "Interview Invitation",
            EmailClassification.INTERVIEW_SCHEDULED: "Interview Scheduled",
            EmailClassification.ASSESSMENT: "Assessment / Coding Test",
            EmailClassification.REJECTION: "Rejection",
            EmailClassification.OFFER: "Job Offer",
            EmailClassification.STATUS_UPDATE: "Status Update",
            EmailClassification.NEW_OPPORTUNITY: "New Opportunity",
            EmailClassification.OTHER_JOB_RELATED: "Other Job Related",
        }
        return mapping.get(self, "Job Related")


class EmailFolder(str, Enum):
    INBOX = "INBOX"
    SENT = "SENT"
    DRAFTS = "DRAFTS"
    ARCHIVE = "ARCHIVE"
    TRASH = "TRASH"

    @classmethod
    def from_string(cls, text: str | None) -> "EmailFolder":
        if not text or not str(text).strip():
            return cls.INBOX
        try:
            return cls(str(text).strip().upper())
        except ValueError:
            return cls.INBOX


class FollowUpStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    DISMISSED = "DISMISSED"

    @classmethod
    def from_string(cls, text: str | None) -> "FollowUpStatus":
        if not text or not str(text).strip():
            return cls.PENDING
        try:
            return cls(str(text).strip().upper())
        except ValueError:
            return cls.PENDING


class InterviewStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

    @classmethod
    def from_string(cls, text: str | None) -> "InterviewStatus":
        if not text or not str(text).strip():
            return cls.SCHEDULED
        try:
            return cls(str(text).strip().upper())
        except ValueError:
            return cls.SCHEDULED


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

    @classmethod
    def from_string(cls, text: str | None) -> "Priority":
        if not text or not str(text).strip():
            return cls.MEDIUM
        try:
            return cls(str(text).strip().upper())
        except ValueError:
            return cls.MEDIUM


class RecruiterType(str, Enum):
    HUMAN_RECRUITER = "HUMAN_RECRUITER"
    POSSIBLE_RECRUITER = "POSSIBLE_RECRUITER"
    AUTOMATED_SYSTEM = "AUTOMATED_SYSTEM"
    NO_RECRUITER_IDENTIFIED = "NO_RECRUITER_IDENTIFIED"
