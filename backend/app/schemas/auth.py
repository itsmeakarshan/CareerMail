from pydantic import EmailStr, Field
from app.schemas.base import CamelModel


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class RegisterRequest(CamelModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class AuthResponse(CamelModel):
    token: str
    id: int
    name: str
    email: str
    avatar_url: str | None = None


class UserDto(CamelModel):
    id: int
    name: str
    email: str
    avatar_url: str | None = None


class UpdateProfileRequest(CamelModel):
    name: str | None = None
    avatar_url: str | None = None
