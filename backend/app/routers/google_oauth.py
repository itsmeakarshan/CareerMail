import urllib.parse
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.models import ConnectedAccount, User
from app.schemas.gmail import GoogleAuthUrlResponse, GoogleConfigResponse
from app.services.google_oauth_service import GoogleOAuthService
from app.security import create_access_token

router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])


@router.get("/config", response_model=GoogleConfigResponse)
def get_google_config():
    service = GoogleOAuthService()
    return GoogleConfigResponse(
        configured=service.is_configured(),
        redirect_uri=settings.google_redirect_uri,
        frontend_url=settings.frontend_url
    )


@router.get("/url", response_model=GoogleAuthUrlResponse)
def get_auth_url(state: str = Query(default="careermail_auth")):
    service = GoogleOAuthService()
    url = service.get_authorization_url(state)
    return GoogleAuthUrlResponse(url=url, state=state)


@router.get("/callback")
async def oauth_callback(
    code: str | None = None,
    error: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db)
):
    if error or not code:
        err_param = urllib.parse.quote_plus(error or "authorization_denied")
        return RedirectResponse(f"{settings.frontend_url}/settings?error={err_param}")

    service = GoogleOAuthService()
    tokens = await service.exchange_code_for_tokens(code)
    if not tokens or "access_token" not in tokens:
        return RedirectResponse(f"{settings.frontend_url}/settings?error=token_exchange_failed")

    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)
    scope = tokens.get("scope", "")

    user_info = await service.get_user_info(access_token)
    email = user_info.get("email") if user_info else None
    google_id = user_info.get("id") if user_info else None
    name = user_info.get("name") if user_info else "Google User"
    avatar = user_info.get("picture") if user_info else None

    # Find or create user
    user = None
    if email:
        user = db.query(User).filter(User.email == email.lower()).first()

    if not user:
        # Fallback to demo user if available or create user
        user = db.query(User).filter(User.email == "akarshan@email.com").first()
        if not user and email:
            from app.security import hash_password
            user = User(
                name=name,
                email=email.lower(),
                password=hash_password("password123"),
                avatar_url=avatar
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user:
        user = db.query(User).first()

    if user:
        # Save or update ConnectedAccount
        account = (
            db.query(ConnectedAccount)
            .filter(ConnectedAccount.user_id == user.id, ConnectedAccount.provider == "google")
            .first()
        )
        if not account:
            account = ConnectedAccount(
                user_id=user.id,
                provider="google",
                provider_email=email or user.email,
                provider_account_id=google_id,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expiry=datetime.utcnow() + timedelta(seconds=expires_in),
                scope=scope,
                last_synced_at=None,
                total_emails_scanned=0
            )
            db.add(account)
        else:
            account.access_token = access_token
            if refresh_token:
                account.refresh_token = refresh_token
            account.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
            account.scope = scope
            if email:
                account.provider_email = email
            if google_id:
                account.provider_account_id = google_id

        db.commit()

        # Issue JWT for session
        app_token = create_access_token(user.id, user.email, user.name)
        return RedirectResponse(f"{settings.frontend_url}/settings?connected=true&token={app_token}")

    return RedirectResponse(f"{settings.frontend_url}/settings?connected=true")
