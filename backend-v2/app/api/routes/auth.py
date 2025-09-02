"""
Authentication Routes
API endpoints for user authentication and registration
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    auth_service = AuthService(db)
    user = auth_service.register_user(user_data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_data)
    token = auth_service.create_access_token(user)
    return token


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthService(db)
    token = auth_service.create_access_token(current_user)
    return token
