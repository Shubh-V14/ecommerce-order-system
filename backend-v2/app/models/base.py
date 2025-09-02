"""
Base Model Classes
Common mixins and base classes for database models
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from app.utils.timezone import get_ist_now


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps in IST"""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_ist_now,
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_ist_now,
        onupdate=get_ist_now,
        nullable=False
    )


class UUIDMixin:
    """Mixin to add UUID primary key"""
    
    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        nullable=False
    )
