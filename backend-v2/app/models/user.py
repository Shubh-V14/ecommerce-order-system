"""
User Model
SQLAlchemy model for user management with role-based access
"""

import enum
from typing import List, Optional

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):
    """User roles for role-based access control"""
    ADMIN = "admin"
    VENDOR = "vendor"
    CUSTOMER = "customer"


class User(Base, UUIDMixin, TimestampMixin):
    """User model with authentication and profile information"""
    
    __tablename__ = "users"
    
    # Authentication fields
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Role and permissions
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), 
        default=UserRole.CUSTOMER, 
        nullable=False,
        index=True
    )
    
    # Profile information
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    orders: Mapped[List["Order"]] = relationship(
        "Order", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin"""
        return self.role == UserRole.ADMIN
    
    @property
    def is_vendor(self) -> bool:
        """Check if user is a vendor"""
        return self.role == UserRole.VENDOR
    
    @property
    def is_customer(self) -> bool:
        """Check if user is a customer"""
        return self.role == UserRole.CUSTOMER
