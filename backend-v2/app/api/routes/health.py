"""
Health Check Routes
API endpoints for service health monitoring
"""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import settings
from app.schemas.common import HealthCheck
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthCheck)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    
    # Check database connection
    database_healthy = True
    try:
        db.execute("SELECT 1")
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        database_healthy = False
    
    # Redis not configured in this setup
    redis_healthy = None
    
    return HealthCheck(
        status="healthy" if database_healthy else "unhealthy",
        service="E-commerce Order System API",
        version="2.0.0",
        timestamp=datetime.utcnow().isoformat(),
        database=database_healthy,
        redis=redis_healthy
    )
