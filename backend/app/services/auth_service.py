from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse, UserDto, UpdateProfileRequest
from app.security import hash_password, verify_password, create_access_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, request: RegisterRequest) -> AuthResponse:
        normalized_email = request.email.strip().lower()
        existing = self.db.query(User).filter(User.email == normalized_email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists."
            )

        user = User(
            name=request.name.strip(),
            email=normalized_email,
            password=hash_password(request.password),
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token(user.id, user.email, user.name)
        return AuthResponse(
            token=token,
            id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url
        )

    def login(self, request: LoginRequest) -> AuthResponse:
        normalized_email = request.email.strip().lower()
        user = self.db.query(User).filter(User.email == normalized_email).first()

        if not user or not verify_password(request.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        token = create_access_token(user.id, user.email, user.name)
        return AuthResponse(
            token=token,
            id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url
        )

    def get_current_user_profile(self, user_id: int) -> UserDto:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return UserDto(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url
        )

    def update_profile(self, user_id: int, request: UpdateProfileRequest) -> UserDto:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if request.name and request.name.strip():
            user.name = request.name.strip()
        if request.avatar_url and request.avatar_url.strip():
            user.avatar_url = request.avatar_url.strip()

        self.db.commit()
        self.db.refresh(user)

        return UserDto(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url
        )
