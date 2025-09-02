"""
Common Schemas
Shared Pydantic models for common API responses
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class BaseResponse(BaseModel):
    """Base response model with success indicator"""
    success: bool = Field(default=True, description="Indicates if the request was successful")
    message: Optional[str] = Field(default=None, description="Optional message")


class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = Field(default=False)
    error: str = Field(description="Error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model"""
    items: List[T] = Field(description="List of items")
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    size: int = Field(description="Items per page")
    pages: int = Field(description="Total number of pages")
    
    @classmethod
    def create(cls, items: List[T], total: int, pagination: PaginationParams):
        """Create paginated response"""
        pages = (total + pagination.size - 1) // pagination.size
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=pages
        )


class HealthCheck(BaseModel):
    """Health check response"""
    status: str = Field(default="healthy", description="Service status")
    service: str = Field(description="Service name")
    version: str = Field(description="Service version")
    timestamp: str = Field(description="Current timestamp")
    database: bool = Field(description="Database connection status")
    redis: Optional[bool] = Field(default=None, description="Redis connection status")
