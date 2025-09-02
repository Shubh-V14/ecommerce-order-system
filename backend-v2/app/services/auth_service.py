"""
Authentication Service
Business logic for user authentication and authorization
"""

from datetime import timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import security_manager
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token
from app.services.user_service import UserService

logger = get_logger(__name__)


class AuthService:
    """Authentication service for login, registration, and token management"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
    
    def register_user(self, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = self.user_service.get_user_by_username(user_data.username)
        if existing_user:
            logger.warning("Registration attempt with existing username", username=user_data.username)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        existing_email = self.user_service.get_user_by_email(user_data.email)
        if existing_email:
            logger.warning("Registration attempt with existing email", email=user_data.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user = self.user_service.create_user(user_data)
        logger.info("User registered successfully", user_id=user.id, username=user.username)
        return user
    
    def authenticate_user(self, login_data: UserLogin) -> User:
        """Authenticate user credentials"""
        # Try to find user by username or email
        user = self.user_service.get_user_by_username(login_data.username)
        if not user:
            user = self.user_service.get_user_by_email(login_data.username)
        
        if not user:
            logger.warning("Login attempt with invalid credentials", username=login_data.username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not user.is_active:
            logger.warning("Login attempt with inactive user", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
        
        if not security_manager.verify_password(login_data.password, user.hashed_password):
            logger.warning("Login attempt with wrong password", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        logger.info("User authenticated successfully", user_id=user.id, username=user.username)
        return user
    
    def create_access_token(self, user: User) -> Token:
        """Create access token for authenticated user"""
        access_token_expires = timedelta(minutes=security_manager.access_token_expire_minutes)
        # Create JWT token
        token_data = {
            "sub": str(user.id),  # Convert to string for JWT compatibility
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active
        }
        
        access_token = security_manager.create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )
        
        # Convert user to response format
        from app.schemas.user import UserResponse
        user_response = UserResponse.model_validate(user)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
            user=user_response
        )
    
    def get_current_user(self, token: str) -> User:
        """Get current user from JWT token"""
        payload = security_manager.verify_token(token)
        user_id_str = payload.get("sub")
        user_id = int(user_id_str)  # Convert string back to int
        
        user = self.user_service.get_user_by_id(user_id)
        if not user:
            logger.error("Token contains invalid user ID", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        if not user.is_active:
            logger.warning("Token for inactive user", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
        
        return user
