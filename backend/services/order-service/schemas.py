from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from models import OrderStatus

class OrderItemBase(BaseModel):
    item_id: UUID
    quantity: int
    unit_price: Decimal
    cost_price: Optional[Decimal] = 0.00

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemOut(OrderItemBase):
    order_item_id: UUID

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    category: str
    amount: Decimal
    restaurant_id: UUID
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseOut(ExpenseBase):
    expense_id: UUID

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    restaurant_id: UUID
    delivery_address: str
    geo_lat: Decimal
    geo_lng: Decimal
    total_amount: Decimal

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderOut(OrderBase):
    order_id: UUID
    customer_id: UUID
    rider_id: Optional[UUID] = None
    status: OrderStatus
    placed_at: datetime
    delivered_at: Optional[datetime] = None
    items: List[OrderItemOut]

    class Config:
        from_attributes = True

class DisputeBase(BaseModel):
    order_id: UUID
    customer_id: UUID
    vendor_id: UUID
    reason: str
    description: Optional[str] = None

class DisputeCreate(DisputeBase):
    pass

class DisputeOut(DisputeBase):
    dispute_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
