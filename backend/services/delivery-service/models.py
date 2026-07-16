from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from database import Base

class DeliveryStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"

class Delivery(Base):
    __tablename__ = "deliveries"

    delivery_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), nullable=False)
    rider_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.ASSIGNED)
    picked_at = Column(DateTime(timezone=True), nullable=True)
    dropped_at = Column(DateTime(timezone=True), nullable=True)
    current_lat = Column(Numeric(9,6), nullable=True)
    current_lng = Column(Numeric(9,6), nullable=True)
