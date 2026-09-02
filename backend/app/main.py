import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import SessionLocal
from app.data_initializer import init_db
from app.routers import (
    auth_router,
    applications_router,
    emails_router,
    interviews_router,
    follow_ups_router,
    analytics_router,
    opportunities_router,
    assistant_router,
    gmail_router,
    google_oauth_router,
    job_search_router,
    settings_router,
    health_router,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("careermail")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CareerMail Python Backend...")
    # Initialize database tables and seed demo user
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Database initialized and demo pipeline verified.")
    except Exception as e:
        logger.error(f"Error during DB initialization: {e}")
    finally:
        db.close()
    yield
    logger.info("Shutting down CareerMail Python Backend...")


app = FastAPI(
    title=settings.app_name,
    description="CareerMail Python Backend API - Automated Job Application & Pipeline Intelligence Engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api
api_prefix = "/api"
app.include_router(health_router, prefix=api_prefix)
app.include_router(auth_router, prefix=api_prefix)
app.include_router(applications_router, prefix=api_prefix)
app.include_router(emails_router, prefix=api_prefix)
app.include_router(interviews_router, prefix=api_prefix)
app.include_router(follow_ups_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(opportunities_router, prefix=api_prefix)
app.include_router(assistant_router, prefix=api_prefix)
app.include_router(gmail_router, prefix=api_prefix)
app.include_router(google_oauth_router, prefix=api_prefix)
app.include_router(job_search_router, prefix=api_prefix)
app.include_router(settings_router, prefix=api_prefix)

# Also mount root health check
app.include_router(health_router)


@app.get("/")
def root():
    return {
        "name": "CareerMail API",
        "language": "Python 3.12+",
        "framework": "FastAPI",
        "status": "ONLINE",
        "documentation": "/docs"
    }
