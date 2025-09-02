"""
Order Management Routes
API endpoints for order operations with role-based access control
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, require_vendor_or_admin
from app.core.logging import get_logger
from app.models.user import User
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate, OrderStatusUpdate
from app.schemas.common import PaginationParams, PaginatedResponse
from app.services.order_service import OrderService

logger = get_logger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new order"""
    order_service = OrderService(db)
    order = order_service.create_order(order_data, current_user)
    return OrderResponse.from_orm(order)


@router.get("/my", response_model=PaginatedResponse[OrderResponse])
async def get_my_orders(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[OrderStatus] = Query(None, alias="status", description="Filter by order status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's orders"""
    order_service = OrderService(db)
    
    orders = order_service.get_orders(
        user=current_user,
        skip=pagination.offset,
        limit=pagination.size,
        status=status_filter
    )
    
    total = order_service.get_order_count(user=current_user, status=status_filter)
    
    order_responses = [OrderResponse.from_orm(order) for order in orders]
    
    return PaginatedResponse.create(
        items=order_responses,
        total=total,
        pagination=pagination
    )


@router.get("/", response_model=PaginatedResponse[OrderResponse])
async def get_all_orders(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[OrderStatus] = Query(None, alias="status", description="Filter by order status"),
    current_user: User = Depends(require_vendor_or_admin),
    db: Session = Depends(get_db)
):
    """Get all orders (vendor/admin only)"""
    order_service = OrderService(db)
    
    orders = order_service.get_orders(
        user=current_user,
        skip=pagination.offset,
        limit=pagination.size,
        status=status_filter
    )
    
    total = order_service.get_order_count(user=current_user, status=status_filter)
    
    order_responses = [OrderResponse.from_orm(order) for order in orders]
    
    return PaginatedResponse.create(
        items=order_responses,
        total=total,
        pagination=pagination
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get order by ID"""
    order_service = OrderService(db)
    order = order_service.get_order_by_id(order_id, current_user)
    
    if not order:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return OrderResponse.from_orm(order)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_data: OrderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update order information"""
    order_service = OrderService(db)
    updated_order = order_service.update_order(order_id, order_data, current_user)
    return OrderResponse.from_orm(updated_order)


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update order status - Available to all authenticated users for auto-updates"""
    try:
        # Allow auto-update from PENDING to PROCESSING for any authenticated user
        new_status = OrderStatus(status_update["status"])
        
        # Get the order first to check current status
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Allow PENDING -> PROCESSING for any user (auto-update)
        if order.status == OrderStatus.PENDING and new_status == OrderStatus.PROCESSING:
            order_service = OrderService(db)
            updated_order = order_service.update_order_status(
                db=db,
                order_id=order_id,
                new_status=new_status,
                notes=status_update.get("notes"),
                current_user=current_user,
                bypass_permission_check=True
            )
            return updated_order
        
        # For other status updates, use normal permission checks
        order_service = OrderService(db)
        updated_order = order_service.update_order_status(
            db=db,
            order_id=order_id,
            new_status=new_status,
            notes=status_update.get("notes"),
            current_user=current_user
        )
        return updated_order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating order status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.options("/{order_id}/cancel")
async def cancel_order_options(order_id: int):
    """Handle CORS preflight for cancel order"""
    return {"message": "OK"}

@router.patch("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel an order by updating status to CANCELLED"""
    try:
        logger.info(f"Cancel order request - Order ID: {order_id}, User: {current_user.id} ({current_user.role})")
        order_service = OrderService(db)
        cancelled_order = order_service.cancel_order(db, order_id, current_user)
        logger.info(f"Order {order_id} cancelled successfully")
        return cancelled_order
    except ValueError as e:
        logger.warning(f"Cancel order validation error - Order ID: {order_id}, Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        logger.warning(f"Cancel order permission error - Order ID: {order_id}, User: {current_user.id}, Error: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Cancel order unexpected error - Order ID: {order_id}, User: {current_user.id}, Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
