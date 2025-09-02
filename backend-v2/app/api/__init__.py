"""
API Routes
FastAPI route definitions and dependencies
"""

from .dependencies import get_current_user, get_db
from .routes import auth, orders, users, health

__all__ = [
    "get_current_user",
    "get_db",
    "auth",
    "orders", 
    "users",
    "health"
]
