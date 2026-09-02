import urllib.parse
import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class GoogleOAuthService:
    SCOPES = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ]

    def is_configured(self) -> bool:
        return bool(settings.google_client_id and settings.google_client_secret)

    def get_authorization_url(self, state: str = "careermail_auth") -> str:
        if not self.is_configured():
            return f"{settings.frontend_url}/settings?error=google_not_configured"

        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> dict | None:
        if not self.is_configured():
            return None

        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.google_redirect_uri
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=data)
                if resp.status_code == 200:
                    return resp.json()
                logger.error(f"Google Token Exchange Error: {resp.status_code} - {resp.text}")
                return None
        except Exception as e:
            logger.error(f"Google Token Exchange Exception: {e}")
            return None

    async def refresh_access_token(self, refresh_token: str) -> dict | None:
        if not self.is_configured() or not refresh_token:
            return None

        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=data)
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception as e:
            logger.error(f"Google Token Refresh Exception: {e}")
            return None

    async def get_user_info(self, access_token: str) -> dict | None:
        url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception as e:
            logger.error(f"Google User Info Exception: {e}")
            return None
