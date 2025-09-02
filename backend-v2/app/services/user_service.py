"""
User Service
Business logic for user management operations
"""

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.security import security_manager
from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate

logger = get_logger(__name__)


class UserService:
    """Service for user management operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        hashed_password = security_manager.get_password_hash(user_data.password)
        
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role,
            full_name=user_data.full_name,
            phone=user_data.phone,
            address=user_data.address
        )
        
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            logger.info("User created successfully", user_id=user.id, username=user.username)
            return user
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to create user", error=str(e), username=user_data.username)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_users(self, skip: int = 0, limit: int = 100, role: Optional[UserRole] = None) -> List[User]:
        """Get list of users with optional filtering"""
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        return query.offset(skip).limit(limit).all()
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """Update user information"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        try:
            self.db.commit()
            self.db.refresh(user)
            logger.info("User updated successfully", user_id=user.id)
            return user
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to update user", error=str(e), user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user (soft delete by setting inactive)"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        try:
            user.is_active = False
            self.db.commit()
            logger.info("User deactivated successfully", user_id=user.id)
            return True
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to deactivate user", error=str(e), user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate user"
            )
    
    def search_users(self, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by username, email, or full name"""
        search_filter = or_(
            User.username.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%"),
            User.full_name.ilike(f"%{query}%")
        )
        
        return self.db.query(User).filter(search_filter).offset(skip).limit(limit).all()
    
    def get_user_count(self, role: Optional[UserRole] = None) -> int:
        """Get total count of users"""
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        return query.count()
