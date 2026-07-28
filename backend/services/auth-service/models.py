from sqlalchemy import Column, String, Enum, DateTime, Text, Numeric, Integer, Boolean
from sqlalchemy.sql import func
import uuid
import enum
from database import Base

class UserRole(str, enum.Enum):
    customer = "customer"
    vendor = "vendor"
    rider = "rider"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    password_hash = Column(Text, nullable=False)
    profile_picture_url = Column(String(500), nullable=True)
    wallet_balance = Column(Numeric(10, 2), default=0.00)
    address = Column(Text, nullable=True)

    # Unified Auth Additions
    onboarding_step = Column(Integer, default=1) # 1-7 for Vendors, 1-3 for Riders
    verification_status = Column(String(20), default="APPROVED") # PENDING, APPROVED, REJECTED
    is_super_admin = Column(Boolean, default=False)
    google_id = Column(String(255), nullable=True)

    is_suspended = Column(Boolean, default=False)
    notification_preferences = Column(Text, nullable=True) # Stored as JSON string
    preferred_language = Column(String(10), default="en")
    profile_visibility = Column(Boolean, default=True)
    vehicle_info = Column(String(255), nullable=True)
    id_details = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(20), nullable=False) # CREDIT, DEBIT
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    log_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    action = Column(String(255), nullable=False)
    details = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
