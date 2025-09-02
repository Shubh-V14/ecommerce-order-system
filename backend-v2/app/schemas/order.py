"""
Order Schemas
Pydantic models for order-related API operations
"""

from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator, field_serializer

from app.models.order import OrderStatus


class OrderItemBase(BaseModel):
    """Base order item schema"""
    product_name: str = Field(..., min_length=1, max_length=255, description="Product name")
    product_sku: Optional[str] = Field(None, max_length=100, description="Product SKU")
    quantity: int = Field(..., ge=1, description="Item quantity")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    product_description: Optional[str] = Field(None, description="Product description")


class OrderItemCreate(OrderItemBase):
    """Schema for creating order items"""
    pass


class OrderItemResponse(OrderItemBase):
    """Schema for order item responses"""
    id: int = Field(..., description="Order item ID")
    order_id: int = Field(..., description="Order ID")
    total_price: Decimal = Field(..., description="Total price for this item")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    @field_serializer('created_at')
    def serialize_created_at(self, dt: datetime) -> str:
        return dt.isoformat()
    
    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """Base order schema"""
    customer_name: str = Field(..., min_length=1, max_length=255, description="Customer name")
    customer_email: str = Field(..., description="Customer email")
    customer_phone: Optional[str] = Field(None, max_length=20, description="Customer phone")
    shipping_address: str = Field(..., min_length=1, description="Shipping address")
    notes: Optional[str] = Field(None, description="Order notes")


class OrderCreate(OrderBase):
    """Schema for creating orders"""
    items: List[OrderItemCreate] = Field(..., min_items=1, description="Order items")
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('Order must contain at least one item')
        return v


class OrderUpdate(BaseModel):
    """Schema for updating orders"""
    customer_name: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    shipping_address: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status"""
    status: OrderStatus = Field(..., description="New order status")
    notes: Optional[str] = Field(None, description="Status change notes")


class OrderResponse(OrderBase):
    """Schema for order responses"""
    id: int = Field(..., description="Order ID")
    user_id: int = Field(..., description="User ID")
    status: OrderStatus = Field(..., description="Order status")
    total_amount: Decimal = Field(..., description="Total order amount")
    tracking_number: Optional[str] = Field(None, description="Tracking number")
    items: List[OrderItemResponse] = Field(..., description="Order items")
    items_count: int = Field(..., description="Total number of items")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    @field_serializer('created_at')
    def serialize_created_at(self, dt: datetime) -> str:
        return dt.isoformat()
    
    @field_serializer('updated_at')
    def serialize_updated_at(self, dt: datetime) -> str:
        return dt.isoformat()
    
    class Config:
        from_attributes = True
