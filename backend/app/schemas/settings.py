from app.schemas.base import CamelModel


class GeminiSettingsStatus(CamelModel):
    is_configured: bool
    is_enabled: bool
    masked_key: str
    status: str


class GeminiKeyRequest(CamelModel):
    api_key: str | None = None


class GeminiKeyResponse(CamelModel):
    success: bool
    message: str
    masked_key: str | None = None
    status: str | None = None
