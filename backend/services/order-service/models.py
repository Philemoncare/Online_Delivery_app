from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from database import Base

class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PLACED = "PLACED"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), nullable=False)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False)
    rider_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING_PAYMENT)
    total_amount = Column(Numeric(10,2), nullable=False)
    delivery_address = Column(String, nullable=False)
    geo_lat = Column(Numeric(9,6), nullable=False)
    geo_lng = Column(Numeric(9,6), nullable=False)
    placed_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(UUID(as_uuid=True), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10,2), nullable=False)
    cost_price = Column(Numeric(10,2), default=0.00)

    order = relationship("Order", back_populates="items")

class Expense(Base):
    __tablename__ = "expenses"
    expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Numeric(10,2), nullable=False)
    description = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())

class Dispute(Base):
    __tablename__ = "disputes"
    dispute_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), nullable=False)
    customer_id = Column(UUID(as_uuid=True), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), nullable=False)
    reason = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="OPEN") # OPEN, RESOLVED, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
