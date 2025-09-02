"""
API Routes Package
FastAPI route modules for different endpoints
"""

from .auth import router as auth_router
from .orders import router as orders_router
from .users import router as users_router
from .health import router as health_router
from .background import router as background_router

__all__ = [
    "auth_router",
    "orders_router",
    "users_router", 
    "health_router",
    "background_router"
]
