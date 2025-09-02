"""
Order Models
SQLAlchemy models for order management and order items
"""

import enum
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import ForeignKey, Numeric, String, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class OrderStatus(str, enum.Enum):
    """Order status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Order(Base, UUIDMixin, TimestampMixin):
    """Order model with customer and shipping information"""
    
    __tablename__ = "orders"
    
    # User relationship
    user_id: Mapped[str] = mapped_column(
        String(36), 
        ForeignKey("users.id"), 
        nullable=False,
        index=True
    )
    
    # Customer information
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Shipping information
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Order details
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), 
        default=OrderStatus.PENDING, 
        nullable=False,
        index=True
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), 
        nullable=False,
        default=Decimal('0.00')
    )
    
    # Additional fields
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Order(id={self.id}, status={self.status}, total={self.total_amount})>"
    
    @property
    def items_count(self) -> int:
        """Get total number of items in the order"""
        return sum(item.quantity for item in self.items)
    
    def calculate_total(self) -> Decimal:
        """Calculate total amount from order items"""
        return sum(item.total_price for item in self.items)


class OrderItem(Base, UUIDMixin, TimestampMixin):
    """Order item model for individual products in an order"""
    
    __tablename__ = "order_items"
    
    # Order relationship
    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id"),
        nullable=False,
        index=True
    )
    
    # Product information
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Pricing and quantity
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    # Additional information
    product_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    
    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, product={self.product_name}, qty={self.quantity})>"
    
    def calculate_total_price(self) -> Decimal:
        """Calculate total price for this item"""
        return self.unit_price * self.quantity
