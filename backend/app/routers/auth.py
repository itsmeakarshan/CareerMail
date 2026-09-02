from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse, UserDto, UpdateProfileRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.register(request)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(request)


@router.get("/me", response_model=UserDto)
def get_me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.get_current_user_profile(user_id)


@router.put("/profile", response_model=UserDto)
def update_profile(
    request: UpdateProfileRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    return service.update_profile(user_id, request)
