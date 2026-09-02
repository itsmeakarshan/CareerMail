from app.routers.auth import router as auth_router
from app.routers.applications import router as applications_router
from app.routers.emails import router as emails_router
from app.routers.interviews import router as interviews_router
from app.routers.follow_ups import router as follow_ups_router
from app.routers.analytics import router as analytics_router
from app.routers.opportunities import router as opportunities_router
from app.routers.assistant import router as assistant_router
from app.routers.gmail import router as gmail_router
from app.routers.google_oauth import router as google_oauth_router
from app.routers.job_search import router as job_search_router
from app.routers.settings import router as settings_router
from app.routers.health import router as health_router

__all__ = [
    "auth_router",
    "applications_router",
    "emails_router",
    "interviews_router",
    "follow_ups_router",
    "analytics_router",
    "opportunities_router",
    "assistant_router",
    "gmail_router",
    "google_oauth_router",
    "job_search_router",
    "settings_router",
    "health_router",
]
