from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class MenuItemBase(BaseModel):
    name: str
    price: Decimal
    cost_price: Decimal = 0.00
    stock_level: int = 0
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True
    is_featured: bool = False

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemOut(MenuItemBase):
    item_id: UUID
    restaurant_id: UUID

    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    supplier_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class StockImportBase(BaseModel):
    supplier_id: UUID
    item_id: UUID
    quantity: int
    cost_at_import: Decimal

class StockImportCreate(StockImportBase):
    pass

class StockImportOut(StockImportBase):
    import_id: UUID
    import_date: datetime

    class Config:
        from_attributes = True

class RestaurantBase(BaseModel):
    name: str
    address: str
    geo_lat: Decimal
    geo_lng: Decimal
    is_open: bool = True
    is_online: bool = True
    cuisine_type: Optional[str] = None
    image_url: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    opening_hours: Optional[str] = None
    delivery_radius: Optional[Decimal] = None

class RestaurantCreate(RestaurantBase):
    owner_id: UUID

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    geo_lat: Optional[Decimal] = None
    geo_lng: Optional[Decimal] = None
    is_open: Optional[bool] = None
    is_online: Optional[bool] = None
    cuisine_type: Optional[str] = None
    image_url: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    opening_hours: Optional[str] = None
    delivery_radius: Optional[Decimal] = None

class RestaurantOut(RestaurantBase):
    restaurant_id: UUID
    rating_avg: Decimal

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    order_id: UUID

class ReviewOut(ReviewBase):
    review_id: UUID
    order_id: UUID
    restaurant_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    plan_type: str
    status: str = "ACTIVE"
    amount: Decimal
    end_date: datetime

class SubscriptionOut(SubscriptionBase):
    subscription_id: UUID
    restaurant_id: UUID
    start_date: datetime

    class Config:
        from_attributes = True

class RestaurantRiderBase(BaseModel):
    rider_id: UUID
    status: str = "ACTIVE"

class RestaurantRiderOut(RestaurantRiderBase):
    id: UUID
    restaurant_id: UUID
    joined_at: datetime

    class Config:
        from_attributes = True

class InquiryBase(BaseModel):
    name: str
    email: str
    message: str

class InquiryCreate(InquiryBase):
    pass

class InquiryOut(InquiryBase):
    inquiry_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class PromotionBase(BaseModel):
    title: str
    description: Optional[str] = None
    discount_percentage: Optional[Decimal] = None
    image_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    restaurant_id: Optional[UUID] = None

class PromotionCreate(PromotionBase):
    pass

class PromotionOut(PromotionBase):
    promo_id: UUID

    class Config:
        from_attributes = True

class CouponBase(BaseModel):
    code: str
    discount_amount: Decimal
    min_order_value: Decimal
    is_active: bool = True
    expiry_date: Optional[datetime] = None

class CouponCreate(CouponBase):
    pass

class CouponOut(CouponBase):
    coupon_id: UUID

    class Config:
        from_attributes = True

