from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from models import DeliveryStatus

class DeliveryBase(BaseModel):
    order_id: UUID
    rider_id: Optional[UUID] = None
    status: DeliveryStatus

class DeliveryOut(DeliveryBase):
    delivery_id: UUID
    picked_at: Optional[datetime] = None
    dropped_at: Optional[datetime] = None
    current_lat: Optional[Decimal] = None
    current_lng: Optional[Decimal] = None

    class Config:
        from_attributes = True
