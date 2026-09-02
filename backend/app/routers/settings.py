from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user_id
from app.models.models import User
from app.schemas.settings import GeminiSettingsStatus, GeminiKeyRequest, GeminiKeyResponse
from app.services.gemini_cv_service import GeminiCvService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/gemini", response_model=GeminiSettingsStatus)
def get_gemini_status(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    key = user.gemini_api_key if user and user.gemini_api_key else settings.gemini_api_key

    is_configured = bool(key and len(key.strip()) > 5)
    masked = f"{key[:4]}...{key[-4:]}" if is_configured and len(key) > 8 else ("Configured" if is_configured else "Not Configured")

    return GeminiSettingsStatus(
        is_configured=is_configured,
        is_enabled=is_configured,
        masked_key=masked,
        status="CONNECTED" if is_configured else "NOT_CONFIGURED"
    )


@router.post("/gemini", response_model=GeminiKeyResponse)
async def save_gemini_key(
    request: GeminiKeyRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    api_key = (request.api_key or "").strip()
    if not api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="API key is required")

    gemini_svc = GeminiCvService()
    valid, msg = await gemini_svc.test_api_key(api_key)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    user.gemini_api_key = api_key
    db.commit()

    masked = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "Configured"
    return GeminiKeyResponse(
        success=True,
        message=msg,
        masked_key=masked,
        status="CONNECTED"
    )


@router.post("/gemini/test", response_model=GeminiKeyResponse)
async def test_gemini_key(
    request: GeminiKeyRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    api_key = (request.api_key or "").strip() if request.api_key else (user.gemini_api_key if user else settings.gemini_api_key)

    if not api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No Gemini API key provided or saved.")

    gemini_svc = GeminiCvService()
    valid, msg = await gemini_svc.test_api_key(api_key)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return GeminiKeyResponse(
        success=True,
        message=msg,
        status="CONNECTED"
    )


@router.delete("/gemini", response_model=GeminiKeyResponse)
def remove_gemini_key(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.gemini_api_key = None
        db.commit()

    return GeminiKeyResponse(
        success=True,
        message="Gemini API key removed successfully.",
        masked_key="Not Configured",
        status="NOT_CONFIGURED"
    )
