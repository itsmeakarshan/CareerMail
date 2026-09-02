from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserDto,
    UpdateProfileRequest,
)
from app.schemas.application import (
    JobApplicationRequest,
    StatusUpdateRequest,
    JobApplicationResponse,
    TimelineEventDto,
)
from app.schemas.interview import (
    InterviewRequest,
    InterviewResponse,
)
from app.schemas.follow_up import (
    FollowUpRequest,
    FollowUpResponse,
)
from app.schemas.email import (
    EmailResponse,
    EmailComposeRequest,
    EmailSimulateRequest,
)
from app.schemas.analytics import (
    AnalyticsResponse,
    MonthlyTrend,
    StatusDistribution,
)
from app.schemas.opportunity import (
    OpportunityDTO,
    OpportunityScanResult,
)
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    AssistantCardDTO,
    AssistantEmailDraftDTO,
)
from app.schemas.gmail import (
    GmailStatusResponse,
    GmailSyncResponse,
    GoogleAuthUrlResponse,
    GoogleConfigResponse,
)
from app.schemas.job_search import (
    CvProfileDto,
    JobListing,
    RelatedSkillMatch,
    JobSearchPayload,
    ConvertJobToApplicationRequest,
    SaveJobRequest,
    ResolveRealLinkRequest,
)
from app.schemas.settings import (
    GeminiSettingsStatus,
    GeminiKeyRequest,
    GeminiKeyResponse,
)

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "AuthResponse",
    "UserDto",
    "UpdateProfileRequest",
    "JobApplicationRequest",
    "StatusUpdateRequest",
    "JobApplicationResponse",
    "TimelineEventDto",
    "InterviewRequest",
    "InterviewResponse",
    "FollowUpRequest",
    "FollowUpResponse",
    "EmailResponse",
    "EmailComposeRequest",
    "EmailSimulateRequest",
    "AnalyticsResponse",
    "MonthlyTrend",
    "StatusDistribution",
    "OpportunityDTO",
    "OpportunityScanResult",
    "AssistantQueryRequest",
    "AssistantQueryResponse",
    "AssistantCardDTO",
    "AssistantEmailDraftDTO",
    "GmailStatusResponse",
    "GmailSyncResponse",
    "GoogleAuthUrlResponse",
    "GoogleConfigResponse",
    "CvProfileDto",
    "JobListing",
    "RelatedSkillMatch",
    "JobSearchPayload",
    "ConvertJobToApplicationRequest",
    "SaveJobRequest",
    "ResolveRealLinkRequest",
    "GeminiSettingsStatus",
    "GeminiKeyRequest",
    "GeminiKeyResponse",
]
