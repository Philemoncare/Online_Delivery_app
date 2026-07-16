from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from models import UserRole

class UserBase(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    role: UserRole
    profile_picture_url: Optional[str] = None
    address: Optional[str] = None
    is_suspended: Optional[int] = 0
    notification_preferences: Optional[str] = None
    preferred_language: Optional[str] = "en"
    profile_visibility: Optional[int] = 1
    vehicle_info: Optional[str] = None
    id_details: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_picture_url: Optional[str] = None
    address: Optional[str] = None
    is_suspended: Optional[int] = None
    notification_preferences: Optional[str] = None
    preferred_language: Optional[str] = None
    profile_visibility: Optional[int] = None
    vehicle_info: Optional[str] = None
    id_details: Optional[str] = None

class UserOut(UserBase):
    user_id: UUID
    wallet_balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    user_id: UUID
    amount: float
    type: str
    description: Optional[str] = None

class TransactionOut(TransactionBase):
    transaction_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
