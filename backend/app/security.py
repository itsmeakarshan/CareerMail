from datetime import datetime, timedelta
import bcrypt
import jwt
from app.config import settings


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(user_id: int, email: str, name: str | None = None) -> str:
    expires = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    payload = {
        "sub": str(user_id),
        "nameid": str(user_id),
        "email": email,
        "name": name or email,
        "exp": expires,
        "iat": datetime.utcnow(),
    }
    # Ensure secret is at least 32 bytes
    secret = settings.jwt_secret
    if len(secret) < 32:
        secret = secret.ljust(32, "0")
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        secret = settings.jwt_secret
        if len(secret) < 32:
            secret = secret.ljust(32, "0")
        return jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    except Exception:
        return None
