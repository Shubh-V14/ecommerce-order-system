"""
User Schemas
Pydantic models for user-related API operations
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator, field_serializer

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    address: Optional[str] = Field(None, description="User address")


class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=8, description="User password")
    role: UserRole = Field(default=UserRole.CUSTOMER, description="User role")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    """Schema for user updates"""
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None)


class UserResponse(UserBase):
    """Schema for user responses"""
    id: int = Field(..., description="User ID")
    role: UserRole = Field(..., description="User role")
    is_active: bool = Field(..., description="User active status")
    is_verified: bool = Field(..., description="User verification status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime) -> str:
        return dt.isoformat()
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="User password")


class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: UserResponse = Field(..., description="User information")
