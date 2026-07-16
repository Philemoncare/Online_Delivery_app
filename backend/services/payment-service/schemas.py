from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from models import PaymentProvider, PaymentStatus

class PaymentInitiate(BaseModel):
    order_id: UUID
    amount: Decimal
    provider: PaymentProvider
    phone: str # For MoMo push

class PaymentCallback(BaseModel):
    transaction_ref: str
    status: str
    external_id: Optional[str] = None

class PaymentOut(BaseModel):
    payment_id: UUID
    order_id: UUID
    status: PaymentStatus
    amount: Decimal
    provider: PaymentProvider
    transaction_ref: Optional[str] = None
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True
