"""
User Management Routes
API endpoints for user management operations
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, require_admin
from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.common import PaginationParams, PaginatedResponse
from app.services.user_service import UserService

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile"""
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    user_service = UserService(db)
    updated_user = user_service.update_user(current_user.id, user_data)
    return UserResponse.from_orm(updated_user)


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def get_users(
    pagination: PaginationParams = Depends(),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get list of users (admin only)"""
    user_service = UserService(db)
    
    users = user_service.get_users(
        skip=pagination.offset,
        limit=pagination.size,
        role=role
    )
    
    total = user_service.get_user_count(role=role)
    
    user_responses = [UserResponse.from_orm(user) for user in users]
    
    return PaginatedResponse.create(
        items=user_responses,
        total=total,
        pagination=pagination
    )


@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Search users by username, email, or name (admin only)"""
    user_service = UserService(db)
    users = user_service.search_users(query=q, limit=limit)
    return [UserResponse.from_orm(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user by ID (admin only)"""
    user_service = UserService(db)
    updated_user = user_service.update_user(user_id, user_data)
    return UserResponse.from_orm(updated_user)


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deactivate user by ID (admin only)"""
    user_service = UserService(db)
    success = user_service.delete_user(user_id)
    
    return {"success": success, "message": "User deactivated successfully"}
