from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from database import Base

class PaymentProvider(str, enum.Enum):
    MTN_MOMO = "MTN_MOMO"
    HUBTEL = "HUBTEL"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), nullable=False)
    provider = Column(Enum(PaymentProvider), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    amount = Column(Numeric(10,2), nullable=False)
    transaction_ref = Column(String(255), unique=True, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
