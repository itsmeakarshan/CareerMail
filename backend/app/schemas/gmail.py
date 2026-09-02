from datetime import datetime
from app.schemas.base import CamelModel


class GmailStatusResponse(CamelModel):
    connected: bool
    email: str | None = None
    provider: str = "google"
    last_synced_at: datetime | None = None
    total_emails_scanned: int = 0
    messages_scanned: int | None = None
    configured: bool = False
    scope: str | None = None
    has_send_scope: bool | None = False
    has_send_permission: bool | None = False


class GmailSyncResponse(CamelModel):
    success: bool = True
    scanned_count: int | None = None
    total_scanned: int | None = None
    messages_scanned: int | None = None
    job_emails_found: int = 0
    job_related_found: int | None = None
    applications_created: int = 0
    applications_updated: int = 0
    duplicates_skipped: int | None = 0
    interviews_found: int | None = 0
    interviews_created: int = 0
    follow_ups_found: int | None = 0
    follow_ups_created: int = 0
    total_processed: int | None = None
    message: str
    synced_at: datetime | None = None
    timestamp: datetime | None = None


class GoogleAuthUrlResponse(CamelModel):
    url: str
    state: str | None = None


class GoogleConfigResponse(CamelModel):
    configured: bool
    redirect_uri: str
    frontend_url: str
