"""
Background Jobs API Routes
Provides endpoints for triggering background job operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.background_jobs import job_manager
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/background", tags=["background"])

@router.post("/update-pending-orders")
async def trigger_pending_orders_update(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger update of all pending orders to processing status
    Only available to admin users
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can trigger background jobs"
        )
    
    try:
        updated_count = await job_manager.update_all_pending_orders_now()
        
        logger.info(
            f"Admin {current_user.email} triggered manual update of pending orders",
            updated_count=updated_count,
            admin_id=current_user.id
        )
        
        return {
            "success": True,
            "message": f"Successfully updated {updated_count} pending orders to processing status",
            "updated_count": updated_count
        }
        
    except Exception as e:
        logger.error(f"Failed to update pending orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update pending orders"
        )

@router.get("/job-status")
async def get_job_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get background job manager status
    Available to all authenticated users
    """
    return {
        "success": True,
        "job_manager_running": job_manager.running,
        "job_interval_seconds": job_manager.job_interval
    }
