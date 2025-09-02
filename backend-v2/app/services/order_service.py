"""
Order Service
Business logic for order management operations
"""

from decimal import Decimal
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.logging import get_logger
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderUpdate, OrderStatusUpdate

logger = get_logger(__name__)


class OrderService:
    """Service for order management operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_order(self, order_data: OrderCreate, user: User) -> Order:
        """Create a new order with items"""
        try:
            # Create order
            order = Order(
                user_id=user.id,
                customer_name=order_data.customer_name,
                customer_email=order_data.customer_email,
                customer_phone=order_data.customer_phone,
                shipping_address=order_data.shipping_address,
                notes=order_data.notes,
                status=OrderStatus.PENDING
            )
            
            self.db.add(order)
            self.db.flush()  # Get order ID
            
            # Create order items
            total_amount = Decimal('0.00')
            for item_data in order_data.items:
                item_total = item_data.unit_price * item_data.quantity
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_name=item_data.product_name,
                    product_sku=item_data.product_sku,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    total_price=item_total,
                    product_description=item_data.product_description
                )
                
                self.db.add(order_item)
                total_amount += item_total
            
            # Update order total
            order.total_amount = total_amount
            
            self.db.commit()
            self.db.refresh(order)
            
            logger.info("Order created successfully", order_id=order.id, user_id=user.id, total=total_amount)
            return order
            
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to create order", error=str(e), user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order"
            )
    
    def get_order_by_id(self, order_id: str, user: User) -> Optional[Order]:
        """Get order by ID with access control"""
        query = self.db.query(Order).filter(Order.id == order_id)
        
        # Apply access control
        if user.role == UserRole.CUSTOMER:
            query = query.filter(Order.user_id == user.id)
        
        order = query.first()
        
        if not order and user.role == UserRole.CUSTOMER:
            # Check if order exists but user doesn't have access
            exists = self.db.query(Order).filter(Order.id == order_id).first()
            if exists:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return order
    
    def get_orders(
        self, 
        user: User, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[OrderStatus] = None
    ) -> List[Order]:
        """Get orders with role-based filtering"""
        query = self.db.query(Order)
        
        # Apply role-based filtering
        if user.role == UserRole.CUSTOMER:
            query = query.filter(Order.user_id == user.id)
        
        # Apply status filter
        if status:
            query = query.filter(Order.status == status)
        
        return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    def update_order(self, order_id: str, order_data: OrderUpdate, user: User) -> Order:
        """Update order information"""
        order = self.get_order_by_id(order_id, user)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check permissions
        if user.role == UserRole.CUSTOMER and order.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Customers can only update certain fields and only for pending orders
        if user.role == UserRole.CUSTOMER and order.status != OrderStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only update pending orders"
            )
        
        update_data = order_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(order, field, value)
        
        try:
            self.db.commit()
            self.db.refresh(order)
            logger.info("Order updated successfully", order_id=order.id, user_id=user.id)
            return order
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to update order", error=str(e), order_id=order_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update order"
            )
    
    def update_order_status(self, db: Session, order_id: int, new_status: OrderStatus, 
                          notes: Optional[str] = None, current_user: User = None, 
                          bypass_permission_check: bool = False) -> Order:
        """Update order status"""
        order = self.get_order_by_id(order_id, current_user)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Permission checks (can be bypassed for auto-updates)
        if not bypass_permission_check:
            if current_user.role == UserRole.CUSTOMER:
                # Customers can only update their own orders from PENDING to PROCESSING (auto-update)
                if order.user_id != current_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You can only update your own orders"
                    )
                if not (order.status == OrderStatus.PENDING and new_status == OrderStatus.PROCESSING):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Customers can only auto-update pending orders to processing"
                    )
            elif current_user.role not in [UserRole.VENDOR, UserRole.ADMIN]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only vendors and admins can update order status"
                )
        
        # Validate status transition
        if not self._is_valid_status_transition(order.status, new_status):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {order.status} to {new_status}"
            )
        
        old_status = order.status
        order.status = new_status
        
        if notes:
            order.notes = f"{order.notes or ''}\n[{new_status}] {notes}".strip()
        
        try:
            self.db.commit()
            self.db.refresh(order)
            logger.info("Order status updated", order_id=order.id, old_status=old_status, new_status=new_status)
            return order
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to update order status", error=str(e), order_id=order_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update order status"
            )
    
    def cancel_order(self, db: Session, order_id: int, user: User) -> Order:
        """Cancel an order by updating status to CANCELLED"""
        print(f"DEBUG: Cancel order request - Order ID: {order_id}, User ID: {user.id}, User Role: {user.role}")
        
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            print(f"DEBUG: Order {order_id} not found")
            raise ValueError("Order not found")
        
        print(f"DEBUG: Found order - ID: {order.id}, Status: {order.status}, User ID: {order.user_id}")
        
        # Check if order can be cancelled
        if order.status in [OrderStatus.DELIVERED, OrderStatus.CANCELLED]:
            print(f"DEBUG: Order {order_id} cannot be cancelled - status is {order.status}")
            raise ValueError("Order cannot be cancelled")
        
        # Permission checks for cancellation
        if user.role == 'customer':
            print(f"DEBUG: Customer permission check - Order user_id: {order.user_id}, Current user_id: {user.id}")
            # Customers can only cancel their own orders
            if str(order.user_id) != str(user.id):
                print(f"DEBUG: Permission denied - Customer {user.id} trying to cancel order {order_id} owned by user {order.user_id}")
                raise PermissionError("You can only cancel your own orders")
            
            # Customers can only cancel PENDING orders (within 5 minutes)
            if order.status != OrderStatus.PENDING:
                print(f"DEBUG: Permission denied - Order {order_id} status is {order.status}, must be PENDING")
                raise PermissionError("You can only cancel orders that are in PENDING status")
            
            # Check 5-minute time limit for customer cancellations
            from app.utils.timezone import get_ist_now, to_ist
            current_time = get_ist_now()
            order_created_ist = to_ist(order.created_at)
            time_diff = (current_time - order_created_ist).total_seconds()
            if time_diff > 300:  # 5 minutes
                print(f"DEBUG: Permission denied - Order {order_id} is older than 5 minutes ({time_diff:.1f}s)")
                raise PermissionError("You can only cancel orders within 5 minutes of creation")
        elif user.role not in ['vendor', 'admin']:
            print(f"DEBUG: Permission denied - Invalid role: {user.role}")
            raise PermissionError("Only customers, vendors, and admins can cancel orders")
        
        # Update order status to cancelled
        old_status = order.status
        order.status = OrderStatus.CANCELLED
        order.notes = f"{order.notes or ''}\n[CANCELLED] Order cancelled by {user.role}".strip()
        
        try:
            db.commit()
            db.refresh(order)
            print(f"Order {order.id} cancelled successfully by user {user.id}")
            return order
        except Exception as e:
            db.rollback()
            print(f"Failed to cancel order {order_id}: {str(e)}")
            raise ValueError(f"Failed to cancel order: {str(e)}")
    
    def get_order_count(self, user: User, status: Optional[OrderStatus] = None) -> int:
        """Get total count of orders"""
        query = self.db.query(Order)
        
        # Apply role-based filtering
        if user.role == UserRole.CUSTOMER:
            query = query.filter(Order.user_id == user.id)
        
        # Apply status filter
        if status:
            query = query.filter(Order.status == status)
        
        return query.count()
    
    def _is_valid_status_transition(self, current_status: OrderStatus, new_status: OrderStatus) -> bool:
        """Validate if status transition is allowed"""
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.PROCESSING, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
            OrderStatus.DELIVERED: [OrderStatus.REFUNDED],
            OrderStatus.CANCELLED: [],  # Terminal state
            OrderStatus.REFUNDED: []   # Terminal state
        }
        
        return new_status in valid_transitions.get(current_status, [])
