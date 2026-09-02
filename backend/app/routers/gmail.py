from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.gmail import GmailStatusResponse, GmailSyncResponse
from app.services.gmail_service import GmailService

router = APIRouter(prefix="/gmail", tags=["Gmail Sync"])


@router.get("/status", response_model=GmailStatusResponse)
def get_gmail_status(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = GmailService(db)
    return service.get_status(user_id)


@router.post("/sync", response_model=GmailSyncResponse)
async def sync_gmail(
    max_results: int = Query(default=25, alias="maxResults"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = GmailService(db)
    return await service.sync_gmail(user_id, max_results)


@router.post("/reprocess", response_model=GmailSyncResponse)
def reprocess_emails(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = GmailService(db)
    return service.reprocess_emails(user_id)


@router.post("/disconnect")
def disconnect_gmail(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = GmailService(db)
    service.disconnect(user_id)
    return {"success": True, "message": "Google Gmail account disconnected successfully."}
